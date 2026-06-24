import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import { PrismaService } from '../../database/prisma.service'
import { RealtimeGateway } from '../../common/gateways/websocket.gateway'

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name)
  private readonly baseUrl = 'https://graph.facebook.com/v19.0'

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    @Optional() private gateway?: RealtimeGateway,
  ) {}

  // ─── CHANNEL MANAGEMENT ──────────────────────────────────────────────────

  async getChannels(orgId: string) {
    return this.prisma.channel.findMany({
      where: { orgId, type: 'WHATSAPP' },
      select: { id: true, name: true, identifier: true, isActive: true, isVerified: true, metadata: true, accessToken: false },
      orderBy: { isActive: 'desc' },
    })
  }

  async connectChannel(orgId: string, data: {
    name: string
    phoneNumberId: string
    accessToken: string
    businessId?: string
    webhookSecret?: string
  }) {
    // Verify credentials with Meta before saving
    let verified = false
    let metadata: any = { businessId: data.businessId }
    try {
      const profile = await this.getBusinessProfile(data.phoneNumberId, data.accessToken)
      metadata = { ...metadata, displayPhone: profile?.data?.[0]?.display_phone_number, about: profile?.data?.[0]?.about }
      verified = true
    } catch {
      // Save anyway — user may add token before Meta approval
    }

    const existing = await this.prisma.channel.findFirst({
      where: { orgId, type: 'WHATSAPP', identifier: data.phoneNumberId }
    })

    if (existing) {
      return this.prisma.channel.update({
        where: { id: existing.id },
        data: { name: data.name, accessToken: data.accessToken, webhookSecret: data.webhookSecret, isActive: true, isVerified: verified, metadata },
      })
    }

    return this.prisma.channel.create({
      data: {
        orgId,
        type: 'WHATSAPP',
        name: data.name,
        identifier: data.phoneNumberId,
        accessToken: data.accessToken,
        webhookSecret: data.webhookSecret,
        isActive: true,
        isVerified: verified,
        metadata,
      },
    })
  }

  async disconnectChannel(orgId: string, channelId: string) {
    const channel = await this.prisma.channel.findFirst({ where: { id: channelId, orgId } })
    if (!channel) throw new NotFoundException('Channel not found')
    return this.prisma.channel.update({
      where: { id: channelId },
      data: { isActive: false },
    })
  }

  // ─── SEND FROM ORG (uses stored credentials) ────────────────────────────

  async sendFromOrg(orgId: string, to: string, text: string) {
    const channel = await this.getActiveChannel(orgId)
    return this.sendText(channel.identifier, to, text, channel.accessToken!)
  }

  async sendTemplateFromOrg(orgId: string, to: string, templateName: string, languageCode = 'ar', components: any[] = []) {
    const channel = await this.getActiveChannel(orgId)
    return this.sendTemplate(channel.identifier, to, templateName, languageCode, components, channel.accessToken!)
  }

  async sendButtonsFromOrg(orgId: string, to: string, body: string, buttons: string[]) {
    const channel = await this.getActiveChannel(orgId)
    return this.sendButtons(channel.identifier, to, body, buttons, channel.accessToken!)
  }

  // ─── BROADCAST TO CONTACTS ───────────────────────────────────────────────

  async broadcast(orgId: string, contactIds: string[], text: string): Promise<{ sent: number; failed: number; errors: string[] }> {
    const channel = await this.getActiveChannel(orgId)
    const contacts = await this.prisma.contact.findMany({
      where: { id: { in: contactIds }, orgId, phone: { not: null } },
      select: { id: true, phone: true, name: true },
    })

    let sent = 0; let failed = 0; const errors: string[] = []
    for (const contact of contacts) {
      try {
        await this.sendText(channel.identifier, contact.phone!, text, channel.accessToken!)
        sent++
        await new Promise(r => setTimeout(r, 100)) // 10/sec rate limit buffer
      } catch (err: any) {
        failed++
        errors.push(`${contact.name}: ${err?.response?.data?.error?.message || err.message}`)
      }
    }
    return { sent, failed, errors }
  }

  // ─── WEBHOOK PROCESSING (multi-org routing via phone_number_id) ──────────

  async processWebhook(body: any) {
    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    if (!value) return

    const phoneNumberId = value.metadata?.phone_number_id
    if (!phoneNumberId) return

    // Route to correct org by looking up which org owns this phone_number_id
    const channel = await this.prisma.channel.findFirst({
      where: { identifier: phoneNumberId, type: 'WHATSAPP', isActive: true },
    })
    if (!channel) {
      this.logger.warn(`No active WhatsApp channel for phone_number_id=${phoneNumberId}`)
      return
    }

    const orgId = channel.orgId
    for (const msg of (value.messages || [])) {
      await this.handleIncomingMessage(msg, phoneNumberId, orgId, channel.id)
    }
    for (const status of (value.statuses || [])) {
      await this.handleStatusUpdate(status)
    }
  }

  // ─── SEND PRIMITIVES ─────────────────────────────────────────────────────

  async sendText(phoneNumberId: string, to: string, text: string, token: string) {
    return this.send(`${this.baseUrl}/${phoneNumberId}/messages`, {
      messaging_product: 'whatsapp', recipient_type: 'individual', to,
      type: 'text', text: { preview_url: false, body: text },
    }, token)
  }

  async sendTemplate(phoneNumberId: string, to: string, templateName: string, languageCode: string, components: any[], token: string) {
    return this.send(`${this.baseUrl}/${phoneNumberId}/messages`, {
      messaging_product: 'whatsapp', to, type: 'template',
      template: { name: templateName, language: { code: languageCode }, components },
    }, token)
  }

  async sendImage(phoneNumberId: string, to: string, imageUrl: string, caption: string, token: string) {
    return this.send(`${this.baseUrl}/${phoneNumberId}/messages`, {
      messaging_product: 'whatsapp', to, type: 'image', image: { link: imageUrl, caption },
    }, token)
  }

  async sendButtons(phoneNumberId: string, to: string, body: string, buttons: string[], token: string) {
    return this.send(`${this.baseUrl}/${phoneNumberId}/messages`, {
      messaging_product: 'whatsapp', to, type: 'interactive',
      interactive: {
        type: 'button', body: { text: body },
        action: { buttons: buttons.map((btn, i) => ({ type: 'reply', reply: { id: `btn_${i}`, title: btn } })) },
      },
    }, token)
  }

  async markAsRead(phoneNumberId: string, messageId: string, token: string) {
    return this.send(`${this.baseUrl}/${phoneNumberId}/messages`, {
      messaging_product: 'whatsapp', status: 'read', message_id: messageId,
    }, token)
  }

  // ─── META API HELPERS ─────────────────────────────────────────────────────

  async getBusinessProfile(phoneNumberId: string, token: string) {
    const res = await axios.get(`${this.baseUrl}/${phoneNumberId}/whatsapp_business_profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  }

  async getTemplates(businessId: string, token: string) {
    const res = await axios.get(`${this.baseUrl}/${businessId}/message_templates`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  }

  async sendTestMessage(orgId: string, to: string) {
    const channel = await this.getActiveChannel(orgId)
    return this.sendText(channel.identifier, to, '✅ Hayya AI WhatsApp connection test successful! Your channel is live.', channel.accessToken!)
  }

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    const verifyToken = this.config.get('WHATSAPP_WEBHOOK_TOKEN')
    if (mode === 'subscribe' && token === verifyToken) return challenge
    return null
  }

  // ─── PRIVATE ─────────────────────────────────────────────────────────────

  private async getActiveChannel(orgId: string) {
    const channel = await this.prisma.channel.findFirst({
      where: { orgId, type: 'WHATSAPP', isActive: true },
    })
    if (!channel) throw new NotFoundException('No active WhatsApp channel. Connect one in Integrations → WhatsApp.')
    return channel
  }

  private async handleIncomingMessage(msg: any, phoneNumberId: string, orgId: string, channelId: string) {
    const from = msg.from
    const messageType = msg.type
    const externalId = msg.id

    let contact = await this.prisma.contact.findFirst({ where: { phone: from, orgId } })
    let isNewContact = false
    if (!contact) {
      isNewContact = true
      contact = await this.prisma.contact.create({
        data: {
          orgId, phone: from,
          name: msg.contacts?.[0]?.profile?.name || from,
          status: 'NEW', source: 'whatsapp', language: 'ar',
        },
      })
    }

    let conversation = await this.prisma.conversation.findFirst({
      where: { contactId: contact.id, channelId, status: { in: ['OPEN', 'PENDING'] } },
    })
    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { orgId, channelId, contactId: contact.id, status: 'OPEN', externalId: from },
      })
    }

    let content = ''; let mediaUrl = ''
    if (messageType === 'text') content = msg.text?.body || ''
    if (messageType === 'image') mediaUrl = msg.image?.id || ''
    if (messageType === 'audio') mediaUrl = msg.audio?.id || ''
    if (messageType === 'document') mediaUrl = msg.document?.id || ''
    if (messageType === 'interactive') {
      content = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || ''
    }

    const savedMsg = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        type: messageType.toUpperCase() as any,
        // senderId: null means inbound (from customer)
        content, mediaUrl, externalId, status: 'DELIVERED',
      },
    })

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessage: content || `[${messageType}]`, lastMsgAt: new Date(), isRead: false },
    })

    // Emit real-time events to agents in this org
    const msgPayload = {
      id: savedMsg.id, content, direction: 'INBOUND', type: messageType.toUpperCase(),
      status: 'DELIVERED', createdAt: savedMsg.createdAt, conversationId: conversation.id,
      contact: { id: contact.id, name: contact.name, phone: contact.phone },
    }
    this.gateway?.emitNewMessage(orgId, conversation.id, msgPayload)
    if (isNewContact) this.gateway?.emitNewLead(orgId, contact)

    this.logger.log(`📨 WhatsApp ${messageType} from ${from} → org ${orgId}`)
    return { conversationId: conversation.id, contactId: contact.id, content }
  }

  private async handleStatusUpdate(status: any) {
    const statusMap: Record<string, string> = { sent: 'SENT', delivered: 'DELIVERED', read: 'READ', failed: 'FAILED' }
    await this.prisma.message.updateMany({
      where: { externalId: status.id },
      data: { status: statusMap[status.status] as any },
    })
  }

  private async send(url: string, payload: any, token: string) {
    try {
      const res = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
      return res.data
    } catch (err: any) {
      this.logger.error(`WhatsApp API error: ${err?.response?.data?.error?.message || err.message}`)
      throw err
    }
  }
}
