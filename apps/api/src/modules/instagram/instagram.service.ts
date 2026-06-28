import { Injectable, Logger, BadRequestException, Optional } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import { PrismaService } from '../../database/prisma.service'
import { AIService } from '../ai/ai.service'
import { RagService } from '../knowledge-base/rag.service'
import { NotificationsService } from '../notifications/notifications.service'
import { encrypt, decrypt } from '../../common/crypto/crypto.util'
import { isModuleEnabled } from '../../common/util/entitlements.util'
import { detectNegative } from '../../common/util/sentiment.util'
import { wantsHuman } from '../../common/util/escalation.util'
import { isSubstantiveQuestion } from '../../common/util/question.util'
import { computeLeadScore } from '../../common/util/lead-score.util'

// Instagram Direct Messages via the official Meta (Graph) API — same app/webhook
// as WhatsApp Cloud API. An IG professional account is stored as a Channel of
// type INSTAGRAM (identifier = IG account id, accessToken = page token).
const GRAPH = 'https://graph.facebook.com/v21.0'

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name)

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private ai: AIService,
    private rag: RagService,
    @Optional() private notifications?: NotificationsService,
  ) {}

  // ─── Connect / status ──────────────────────────────────────────────────────
  async connectChannel(orgId: string, dto: { igAccountId: string; accessToken: string; username?: string }) {
    if (!dto?.igAccountId || !dto?.accessToken) throw new BadRequestException('igAccountId and accessToken are required')
    let username = dto.username
    try {
      const res = await axios.get(`${GRAPH}/${dto.igAccountId}`, { params: { fields: 'username,name', access_token: dto.accessToken }, timeout: 12000 })
      username = res.data?.username || res.data?.name || username
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 401 || status === 403 || status === 400) throw new BadRequestException('Meta rejected those Instagram credentials — check the IG account id and access token.')
      throw new BadRequestException('Could not verify the Instagram account with Meta. Check the credentials and retry.')
    }
    const meta: any = { provider: 'meta', username }
    const existing = await this.prisma.channel.findFirst({ where: { orgId, type: 'INSTAGRAM' } })
    if (existing) {
      return this.prisma.channel.update({ where: { id: existing.id }, data: { name: username ? `Instagram @${username}` : 'Instagram', identifier: dto.igAccountId, accessToken: encrypt(dto.accessToken), isActive: true, isVerified: true, metadata: meta } })
    }
    return this.prisma.channel.create({ data: { orgId, type: 'INSTAGRAM', name: username ? `Instagram @${username}` : 'Instagram', identifier: dto.igAccountId, accessToken: encrypt(dto.accessToken), isActive: true, isVerified: true, metadata: meta } })
  }

  async status(orgId: string) {
    const ch = await this.prisma.channel.findFirst({ where: { orgId, type: 'INSTAGRAM' } })
    if (!ch) return { connected: false }
    return { connected: !!ch.isActive, username: (ch.metadata as any)?.username || null }
  }

  async disconnect(orgId: string) {
    const ch = await this.prisma.channel.findFirst({ where: { orgId, type: 'INSTAGRAM' } })
    if (ch) await this.prisma.channel.update({ where: { id: ch.id }, data: { isActive: false } })
    return { ok: true }
  }

  // ─── Webhook ────────────────────────────────────────────────────────────────
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.config.get('WHATSAPP_WEBHOOK_TOKEN')) return challenge
    return null
  }

  // Inbound IG messaging webhook (object: "instagram"). Defensive parsing.
  async processWebhook(body: any) {
    if (body?.object !== 'instagram') return { ignored: true }
    for (const entry of (body.entry || [])) {
      const igAccountId = String(entry.id || '')
      for (const event of (entry.messaging || [])) {
        // Skip echoes of our own outgoing messages.
        if (event?.message?.is_echo) continue
        const senderId = event?.sender?.id
        const text = event?.message?.text
        if (!senderId || !text) continue
        try { await this.handleIncoming(igAccountId, String(senderId), String(text)) } catch (e: any) { this.logger.warn(`IG inbound failed: ${e?.message}`) }
      }
    }
    return { ok: true }
  }

  private async handleIncoming(igAccountId: string, senderId: string, text: string) {
    const channel = await this.prisma.channel.findFirst({ where: { type: 'INSTAGRAM', identifier: igAccountId, isActive: true } })
    if (!channel) { this.logger.warn(`No active Instagram channel for ig=${igAccountId}`); return }
    const orgId = channel.orgId
    const externalId = `ig-${senderId}`

    let conv = await this.prisma.conversation.findFirst({ where: { orgId, channelId: channel.id, externalId } })
    let contact: any
    if (!conv) {
      const name = `Instagram ${senderId.slice(-4)}`
      contact = await this.prisma.contact.create({ data: { orgId, name, source: 'instagram', status: 'NEW', score: computeLeadScore({ status: 'NEW', name }), metadata: { instagramId: senderId } as any } })
      conv = await this.prisma.conversation.create({ data: { orgId, channelId: channel.id, contactId: contact.id, externalId, status: 'OPEN', subject: 'Instagram DM' } })
    } else {
      contact = await this.prisma.contact.findUnique({ where: { id: conv.contactId! } })
    }

    await this.prisma.message.create({ data: { conversationId: conv.id, senderId: null, type: 'TEXT', content: text } })
    await this.prisma.conversation.update({ where: { id: conv.id }, data: { lastMessage: text, lastMsgAt: new Date(), isRead: false } })

    await this.autoReply(orgId, conv.id, senderId, contact, text, igAccountId, channel)
  }

  // ─── Outbound ───────────────────────────────────────────────────────────────
  async sendMessage(igAccountId: string, recipientId: string, text: string, token: string) {
    await axios.post(`${GRAPH}/${igAccountId}/messages`, { recipient: { id: recipientId }, message: { text } }, { params: { access_token: token }, timeout: 15000 })
  }

  async sendFromOrg(orgId: string, recipientId: string, text: string) {
    const ch = await this.prisma.channel.findFirst({ where: { orgId, type: 'INSTAGRAM', isActive: true } })
    if (!ch?.accessToken) throw new BadRequestException('No connected Instagram account.')
    return this.sendMessage(ch.identifier, recipientId, text, decrypt(ch.accessToken))
  }

  // ─── AI reply (mirrors WhatsApp/webchat) ────────────────────────────────────
  private async autoReply(orgId: string, conversationId: string, senderId: string, contact: any, text: string, igAccountId: string, channel: any) {
    if (!(await isModuleEnabled(this.prisma, orgId, 'ai_agents'))) return
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } })
    if (!conv) return
    const meta: any = conv.metadata || {}
    const token = channel?.accessToken ? decrypt(channel.accessToken) : null

    if (detectNegative(text) && !meta.negative) {
      this.prisma.conversation.update({ where: { id: conversationId }, data: { priority: 'HIGH' as any, metadata: { ...meta, negative: true } } }).catch(() => {})
      this.notifications?.notifyConversation(orgId, { assigneeId: (conv as any).assigneeId, type: 'sentiment', conversationId, title: '😟 Unhappy customer', body: `${contact?.name || 'A customer'} sounds frustrated on Instagram.` }).catch(() => {})
    }
    if (wantsHuman(text)) {
      await this.prisma.conversation.update({ where: { id: conversationId }, data: { metadata: { ...meta, aiPaused: true, escalated: true } } })
      this.notifications?.notifyConversation(orgId, { assigneeId: (conv as any).assigneeId, type: 'escalation', conversationId, title: '⚠ Customer asked for a human', body: `${contact?.name || 'A customer'} requested a human on Instagram.` }).catch(() => {})
      if (token) { try { await this.sendMessage(igAccountId, senderId, "Thanks — I'm connecting you with a team member who'll reply shortly.", token) } catch {} }
      return
    }
    if (meta.aiPaused) return

    try {
      const org = await this.prisma.organization.findUnique({ where: { id: orgId }, select: { name: true, industry: true } })
      let knowledge = ''
      try { knowledge = await this.rag.getContextForQuery(orgId, text, 4) } catch { knowledge = '' }
      if (!knowledge && isSubstantiveQuestion(text)) this.rag.logGap(orgId, text, 'instagram').catch(() => {})
      const system = `You are the Instagram assistant for ${org?.name || 'our business'}${org?.industry ? `, a ${org.industry} business` : ''}. Be concise, warm and helpful. Answer using ONLY the business knowledge below when relevant; if you don't know, offer to connect the customer with the team.${knowledge ? `\n\n--- BUSINESS KNOWLEDGE ---\n${knowledge}\n--- END ---` : ''}`
      const reply = await this.ai.complete([{ role: 'system', content: system }, { role: 'user', content: text }], { maxTokens: 300, temperature: 0.5, orgId, module: 'instagram', action: 'reply' })
      if (reply && token) {
        await this.sendMessage(igAccountId, senderId, reply, token)
        await this.prisma.message.create({ data: { conversationId, type: 'TEXT', content: reply, isAI: true, isFromBot: true, status: 'SENT' } })
        await this.prisma.conversation.update({ where: { id: conversationId }, data: { lastMessage: reply, lastMsgAt: new Date() } })
      }
    } catch (e: any) {
      this.logger.warn(`Instagram AI reply failed: ${e?.message}`)
    }
  }
}
