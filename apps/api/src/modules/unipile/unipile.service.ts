import { Injectable, BadRequestException, Logger, Optional } from '@nestjs/common'
import axios from 'axios'
import { PrismaService } from '../../database/prisma.service'
import { AIService } from '../ai/ai.service'
import { RagService } from '../knowledge-base/rag.service'
import { WebhooksService } from '../webhooks/webhooks.service'
import { encryptJson, decryptJson } from '../../common/crypto/crypto.util'
import { computeLeadScore } from '../../common/util/lead-score.util'

const PLATFORM_KEY = 'unipile'

// Unipile unified API — connects WhatsApp (and later LinkedIn/Instagram/etc.) by
// QR code, with no Meta Business API approval. One platform-level Unipile account
// (DSN + API key) holds every tenant's connected WhatsApp as a sub-account.
@Injectable()
export class UnipileService {
  private readonly logger = new Logger(UnipileService.name)

  constructor(
    private prisma: PrismaService,
    private ai: AIService,
    private rag: RagService,
    @Optional() private webhooks?: WebhooksService,
  ) {}

  // ─── Platform config (owner-level) ─────────────────────────────────────────
  private async getPlatformConfig(): Promise<{ dsn?: string; apiKey?: string } | null> {
    const row = await this.prisma.platformSetting.findUnique({ where: { key: PLATFORM_KEY } })
    if (!row) return null
    try { return decryptJson(row.value as any) as { dsn?: string; apiKey?: string } } catch { return null }
  }

  async platformStatus() {
    const cfg = await this.getPlatformConfig()
    return { configured: !!(cfg?.dsn && cfg?.apiKey) }
  }

  async savePlatformConfig(dto: { dsn: string; apiKey: string }) {
    if (!dto?.dsn || !dto?.apiKey) throw new BadRequestException('dsn and apiKey are required')
    const dsn = dto.dsn.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')
    const value = encryptJson({ dsn, apiKey: dto.apiKey.trim() }) as any
    await this.prisma.platformSetting.upsert({
      where: { key: PLATFORM_KEY },
      create: { key: PLATFORM_KEY, value },
      update: { value },
    })
    return { configured: true }
  }

  async disconnectPlatform() {
    await this.prisma.platformSetting.deleteMany({ where: { key: PLATFORM_KEY } })
    return { ok: true }
  }

  private async client() {
    const cfg = await this.getPlatformConfig()
    if (!cfg?.dsn || !cfg?.apiKey) {
      throw new BadRequestException('WhatsApp (Unipile) is not configured yet. The platform owner must add the Unipile DSN + API key first.')
    }
    return { base: `https://${cfg.dsn}/api/v1`, key: cfg.apiKey }
  }

  private headers(key: string) {
    return { 'X-API-KEY': key, 'Content-Type': 'application/json', accept: 'application/json' }
  }

  // ─── Tenant connects their WhatsApp → returns a QR string to scan ──────────
  async connectWhatsapp(orgId: string, pairingPhone?: string) {
    const { base, key } = await this.client()
    const body: any = { provider: 'WHATSAPP' }
    if (pairingPhone) body.pairing_phone_number = pairingPhone.replace(/[^0-9]/g, '')
    let data: any
    try {
      const res = await axios.post(`${base}/accounts`, body, { headers: this.headers(key), timeout: 20000 })
      data = res.data || {}
    } catch (e: any) {
      this.logger.warn(`Unipile connect failed: ${e?.response?.status} ${JSON.stringify(e?.response?.data || e.message)}`)
      throw new BadRequestException(e?.response?.data?.message || 'Could not start the WhatsApp connection.')
    }
    const accountId = data.account_id || data.accountId || data.id || ''
    const meta: any = { provider: 'unipile', accountId }
    const existing = await this.prisma.channel.findFirst({ where: { orgId, type: 'WHATSAPP' } })
    if (existing) {
      await this.prisma.channel.update({ where: { id: existing.id }, data: { identifier: accountId || existing.identifier, name: 'WhatsApp (Unipile)', metadata: meta, isActive: true, isVerified: false } })
    } else {
      await this.prisma.channel.create({ data: { orgId, type: 'WHATSAPP', name: 'WhatsApp (Unipile)', identifier: accountId || `unipile-${orgId}`, metadata: meta, isActive: true, isVerified: false } })
    }
    return {
      qrCodeString: data.qrCodeString || data.qr_code_string || data.qrcode || data.qr || null,
      code: data.code || null,
      accountId,
    }
  }

  async status(orgId: string) {
    const ch = await this.prisma.channel.findFirst({ where: { orgId, type: 'WHATSAPP' } })
    if (!ch || (ch.metadata as any)?.provider !== 'unipile') return { connected: false }
    return { connected: !!ch.isActive, verified: !!ch.isVerified, accountId: (ch.metadata as any)?.accountId || null }
  }

  async disconnect(orgId: string) {
    const ch = await this.prisma.channel.findFirst({ where: { orgId, type: 'WHATSAPP' } })
    if (ch && (ch.metadata as any)?.provider === 'unipile') {
      await this.prisma.channel.update({ where: { id: ch.id }, data: { isActive: false } })
    }
    return { ok: true }
  }

  // ─── Outbound ──────────────────────────────────────────────────────────────
  async sendMessage(orgId: string, to: string, text: string) {
    const { base, key } = await this.client()
    const ch = await this.prisma.channel.findFirst({ where: { orgId, type: 'WHATSAPP', isActive: true } })
    const accountId = (ch?.metadata as any)?.accountId
    if (!accountId) throw new BadRequestException('No connected WhatsApp account for this workspace.')
    try {
      await axios.post(`${base}/messages`, { account_id: accountId, to: to.replace(/[^0-9]/g, ''), text }, { headers: this.headers(key), timeout: 20000 })
    } catch (e: any) {
      this.logger.warn(`Unipile send failed: ${JSON.stringify(e?.response?.data || e.message)}`)
      throw new BadRequestException('Failed to send the WhatsApp message.')
    }
    return { ok: true }
  }

  // ─── Inbound webhook (Unipile → us) ────────────────────────────────────────
  // Unipile webhook payload field names vary by event; this mapping is defensive
  // and tolerant. Validate against the first real webhook in the logs once a key
  // is connected, then tighten.
  async handleWebhook(payload: any) {
    const accountId = payload?.account_id || payload?.accountId || payload?.account?.id
    if (!accountId) return { ignored: 'no account_id' }

    const channel = await this.prisma.channel.findFirst({ where: { type: 'WHATSAPP', identifier: String(accountId) } })
    if (!channel) {
      // Account status callbacks (e.g. CREATION_SUCCESS) may arrive before we
      // have stored the identifier; mark matching unipile channel verified.
      return { ignored: 'unknown account' }
    }
    const orgId = channel.orgId

    // Account-status event → mark the channel verified/connected.
    const status = payload?.status || payload?.account_status || payload?.event
    if (status && /SUCCESS|OK|CONNECTED|CREATION/i.test(String(status)) && !payload?.message) {
      await this.prisma.channel.update({ where: { id: channel.id }, data: { isVerified: true, isActive: true } })
      return { ok: true, verified: true }
    }

    // Inbound message event.
    const m = payload?.message || payload
    const text: string = m?.text || m?.body || m?.message || ''
    const fromRaw = m?.sender?.attendee_provider_id || m?.from || m?.sender_id || m?.sender?.id || payload?.from || ''
    const phone = String(fromRaw).replace(/[^0-9]/g, '')
    // Ignore our own outgoing echoes.
    if (m?.is_sender || m?.from_me || m?.direction === 'out') return { ignored: 'outbound echo' }
    if (!text || !phone) return { ignored: 'no text/phone' }

    const name = m?.sender?.name || payload?.sender?.name || `WhatsApp ${phone.slice(-4)}`
    const externalId = `wa-${phone}`

    let conv = await this.prisma.conversation.findFirst({ where: { orgId, channelId: channel.id, externalId } })
    if (!conv) {
      const contact = await this.prisma.contact.create({
        data: { orgId, name, phone, source: 'whatsapp', status: 'NEW', score: computeLeadScore({ status: 'NEW', name }), metadata: { whatsappPhone: phone } as any },
      })
      conv = await this.prisma.conversation.create({
        data: { orgId, channelId: channel.id, contactId: contact.id, externalId, status: 'OPEN', subject: 'WhatsApp chat' },
      })
      this.webhooks?.dispatch(orgId, 'contact.created', { id: contact.id, name: contact.name, source: 'whatsapp', status: 'NEW' }).catch(() => {})
    }

    await this.prisma.message.create({ data: { conversationId: conv.id, senderId: null, type: 'TEXT', content: text } })
    await this.prisma.conversation.update({ where: { id: conv.id }, data: { lastMessage: text, lastMsgAt: new Date(), isRead: false } })

    // Don't auto-reply if a human paused the AI for this conversation.
    if ((conv.metadata as any)?.aiPaused) return { ok: true, paused: true }

    // Grounded AI reply (graceful if no AI/KB), then send back via Unipile.
    try {
      const org = await this.prisma.organization.findUnique({ where: { id: orgId }, select: { name: true, industry: true } })
      let knowledge = ''
      try { knowledge = await this.rag.getContextForQuery(orgId, text, 4) } catch { knowledge = '' }
      const system = `You are the WhatsApp assistant for ${org?.name || 'our business'}${org?.industry ? `, a ${org.industry} business` : ''}. Be concise, warm and helpful. Answer using ONLY the business knowledge below when relevant; if you don't know, offer to connect the customer with the team.${knowledge ? `\n\n--- BUSINESS KNOWLEDGE ---\n${knowledge}\n--- END ---` : ''}`
      const reply = await this.ai.complete(
        [{ role: 'system', content: system }, { role: 'user', content: text }],
        { maxTokens: 300, temperature: 0.5, orgId, module: 'whatsapp', action: 'reply' },
      )
      if (reply) {
        await this.sendMessage(orgId, phone, reply)
        await this.prisma.message.create({ data: { conversationId: conv.id, senderId: null, type: 'TEXT', content: reply, metadata: { ai: true } as any } })
        await this.prisma.conversation.update({ where: { id: conv.id }, data: { lastMessage: reply, lastMsgAt: new Date() } })
      }
    } catch (e: any) {
      this.logger.warn(`Unipile AI reply failed: ${e?.message}`)
    }
    return { ok: true }
  }
}
