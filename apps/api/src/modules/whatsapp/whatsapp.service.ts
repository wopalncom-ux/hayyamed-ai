// ============================================
// WHATSAPP BUSINESS API SERVICE
// apps/api/src/modules/whatsapp/whatsapp.service.ts
// ============================================

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import { PrismaService } from '../../database/prisma.service'
import { firstValueFrom } from 'rxjs'

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name)
  private readonly baseUrl = 'https://graph.facebook.com/v19.0'

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // ─── SEND TEXT MESSAGE ───────────────────
  async sendText(phoneNumberId: string, to: string, text: string, token: string) {
    const url = `${this.baseUrl}/${phoneNumberId}/messages`
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: text },
    }
    return this.send(url, payload, token)
  }

  // ─── SEND TEMPLATE MESSAGE ───────────────
  async sendTemplate(
    phoneNumberId: string,
    to: string,
    templateName: string,
    languageCode: string,
    components: any[],
    token: string
  ) {
    const url = `${this.baseUrl}/${phoneNumberId}/messages`
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    }
    return this.send(url, payload, token)
  }

  // ─── SEND IMAGE ──────────────────────────
  async sendImage(phoneNumberId: string, to: string, imageUrl: string, caption: string, token: string) {
    const url = `${this.baseUrl}/${phoneNumberId}/messages`
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: { link: imageUrl, caption },
    }
    return this.send(url, payload, token)
  }

  // ─── SEND INTERACTIVE BUTTONS ────────────
  async sendButtons(phoneNumberId: string, to: string, body: string, buttons: string[], token: string) {
    const url = `${this.baseUrl}/${phoneNumberId}/messages`
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: body },
        action: {
          buttons: buttons.map((btn, i) => ({
            type: 'reply',
            reply: { id: `btn_${i}`, title: btn }
          }))
        }
      }
    }
    return this.send(url, payload, token)
  }

  // ─── SEND LIST MESSAGE ───────────────────
  async sendList(phoneNumberId: string, to: string, body: string, items: any[], token: string) {
    const url = `${this.baseUrl}/${phoneNumberId}/messages`
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: body },
        action: {
          button: 'اختر / Choose',
          sections: [{ title: 'Options', rows: items }]
        }
      }
    }
    return this.send(url, payload, token)
  }

  // ─── MARK MESSAGE AS READ ────────────────
  async markAsRead(phoneNumberId: string, messageId: string, token: string) {
    const url = `${this.baseUrl}/${phoneNumberId}/messages`
    return this.send(url, {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }, token)
  }

  // ─── PROCESS INCOMING WEBHOOK ────────────
  async processWebhook(body: any, orgId: string) {
    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    if (!value) return

    const phoneNumberId = value.metadata?.phone_number_id
    const messages = value.messages || []
    const statuses = value.statuses || []

    // Process incoming messages
    for (const msg of messages) {
      await this.handleIncomingMessage(msg, phoneNumberId, orgId)
    }

    // Process delivery/read statuses
    for (const status of statuses) {
      await this.handleStatusUpdate(status)
    }
  }

  // ─── HANDLE INCOMING MESSAGE ─────────────
  private async handleIncomingMessage(msg: any, phoneNumberId: string, orgId: string) {
    const from = msg.from
    const messageType = msg.type
    const externalId = msg.id

    // Find or create contact
    let contact = await this.prisma.contact.findFirst({
      where: { phone: from, orgId }
    })

    if (!contact) {
      contact = await this.prisma.contact.create({
        data: {
          orgId,
          phone: from,
          name: msg.contacts?.[0]?.profile?.name || from,
          status: 'NEW',
          source: 'whatsapp',
          language: 'ar',
        }
      })
    }

    // Find channel
    const channel = await this.prisma.channel.findFirst({
      where: { orgId, type: 'WHATSAPP', identifier: phoneNumberId }
    })
    if (!channel) return

    // Find or create conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: { contactId: contact.id, channelId: channel.id, status: { in: ['OPEN', 'PENDING'] } }
    })

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          orgId,
          channelId: channel.id,
          contactId: contact.id,
          status: 'OPEN',
          externalId: from,
        }
      })
    }

    // Extract message content
    let content = ''
    let mediaUrl = ''
    if (messageType === 'text') content = msg.text?.body || ''
    if (messageType === 'image') mediaUrl = msg.image?.id || ''
    if (messageType === 'audio') mediaUrl = msg.audio?.id || ''
    if (messageType === 'document') mediaUrl = msg.document?.id || ''
    if (messageType === 'interactive') {
      content = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || ''
    }

    // Save message
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        type: messageType.toUpperCase() as any,
        content,
        mediaUrl,
        externalId,
        status: 'DELIVERED',
      }
    })

    // Update conversation
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessage: content || `[${messageType}]`, lastMsgAt: new Date(), isRead: false }
    })

    this.logger.log(`📨 New ${messageType} from ${from}`)

    // Trigger AI / chatbot response
    return { conversationId: conversation.id, contactId: contact.id, content }
  }

  // ─── HANDLE STATUS UPDATE ────────────────
  private async handleStatusUpdate(status: any) {
    const { id, status: msgStatus } = status
    const statusMap: Record<string, string> = {
      sent: 'SENT',
      delivered: 'DELIVERED',
      read: 'READ',
      failed: 'FAILED',
    }

    await this.prisma.message.updateMany({
      where: { externalId: id },
      data: { status: statusMap[msgStatus] as any }
    })
  }

  // ─── GET BUSINESS PROFILE ────────────────
  async getBusinessProfile(phoneNumberId: string, token: string) {
    const url = `${this.baseUrl}/${phoneNumberId}/whatsapp_business_profile`
    const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
    return res.data
  }

  // ─── GET TEMPLATES ───────────────────────
  async getTemplates(businessId: string, token: string) {
    const url = `${this.baseUrl}/${businessId}/message_templates`
    const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
    return res.data
  }

  // ─── VERIFY WEBHOOK ──────────────────────
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    const verifyToken = this.config.get('WHATSAPP_WEBHOOK_TOKEN')
    if (mode === 'subscribe' && token === verifyToken) return challenge
    return null
  }

  // ─── HTTP HELPER ─────────────────────────
  private async send(url: string, payload: any, token: string) {
    try {
      const res = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })
      return res.data
    } catch (err: any) {
      this.logger.error(`WhatsApp API error: ${err?.response?.data?.error?.message}`)
      throw err
    }
  }
}
