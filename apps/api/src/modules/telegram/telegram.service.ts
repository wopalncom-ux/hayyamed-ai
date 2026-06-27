import { Injectable, Logger, BadRequestException, Optional } from '@nestjs/common'
import axios from 'axios'
import { PrismaService } from '../../database/prisma.service'
import { AIService } from '../ai/ai.service'
import { RagService } from '../knowledge-base/rag.service'
import { NotificationsService } from '../notifications/notifications.service'
import { WebhooksService } from '../webhooks/webhooks.service'
import { encrypt, decrypt } from '../../common/crypto/crypto.util'
import { wantsHuman } from '../../common/util/escalation.util'
import { isWithinHours } from '../../common/util/business-hours.util'
import { isSubstantiveQuestion } from '../../common/util/question.util'

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name)
  private api(token: string) { return `https://api.telegram.org/bot${token}` }

  constructor(private prisma: PrismaService, private ai: AIService, private rag: RagService, @Optional() private notifications?: NotificationsService, @Optional() private webhooks?: WebhooksService) {}

  // Connect a Telegram bot: validate token, store channel, register webhook.
  async connect(orgId: string, botToken: string) {
    if (!botToken?.trim()) throw new BadRequestException('Bot token is required')
    let me: any
    try {
      const r = await axios.get(`${this.api(botToken)}/getMe`)
      me = r.data?.result
      if (!me) throw new Error()
    } catch {
      throw new BadRequestException('Invalid bot token — check it with @BotFather')
    }

    const existing = await this.prisma.channel.findFirst({ where: { orgId, type: 'TELEGRAM' } })
    const data = { name: `Telegram @${me.username}`, identifier: String(me.id), accessToken: encrypt(botToken), isActive: true, isVerified: true, metadata: { username: me.username } as any }
    if (existing) await this.prisma.channel.update({ where: { id: existing.id }, data })
    else await this.prisma.channel.create({ data: { orgId, type: 'TELEGRAM', ...data } })

    const url = `${process.env.API_URL || 'https://api.hayyaai.com'}/api/v1/telegram/webhook/${orgId}`
    try {
      await axios.post(`${this.api(botToken)}/setWebhook`, { url, allowed_updates: ['message'] })
    } catch {
      this.logger.warn('setWebhook failed — token saved; webhook can be retried')
    }
    return { ok: true, username: me.username, webhook: url }
  }

  async status(orgId: string) {
    const ch = await this.prisma.channel.findFirst({ where: { orgId, type: 'TELEGRAM' } })
    if (!ch) return { connected: false }
    return { connected: true, username: (ch.metadata as any)?.username || null }
  }

  async disconnect(orgId: string) {
    const ch = await this.prisma.channel.findFirst({ where: { orgId, type: 'TELEGRAM' } })
    if (ch) {
      try { await axios.post(`${this.api(decrypt(ch.accessToken!))}/deleteWebhook`) } catch {}
      await this.prisma.channel.update({ where: { id: ch.id }, data: { isActive: false } })
    }
    return { ok: true }
  }

  // Inbound Telegram update → store, AI-reply (grounded in KB), send back.
  async handleUpdate(orgId: string, update: any) {
    const msg = update?.message
    if (!msg?.text) return
    const channel = await this.prisma.channel.findFirst({ where: { orgId, type: 'TELEGRAM', isActive: true } })
    if (!channel?.accessToken) return
    const token = decrypt(channel.accessToken)
    const chatId = msg.chat?.id
    const name = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || msg.from?.username || 'Telegram User'
    const sessionId = `tg-${chatId}`

    // Find/create conversation keyed by telegram chat id
    let conv = await this.prisma.conversation.findFirst({ where: { orgId, channelId: channel.id, externalId: sessionId } })
    if (!conv) {
      const contact = await this.prisma.contact.create({ data: { orgId, name, source: 'telegram', status: 'NEW', metadata: { telegramChatId: String(chatId) } } })
      conv = await this.prisma.conversation.create({ data: { orgId, channelId: channel.id, contactId: contact.id, externalId: sessionId, status: 'OPEN', subject: 'Telegram chat' } })
    }

    await this.prisma.message.create({ data: { conversationId: conv.id, senderId: null, type: 'TEXT', content: msg.text } })
    await this.prisma.conversation.update({ where: { id: conv.id }, data: { lastMessage: msg.text, lastMsgAt: new Date(), isRead: false } })

    // A new message on a resolved conversation reopens it.
    if ((conv as any).status === 'RESOLVED') {
      await this.prisma.conversation.update({ where: { id: conv.id }, data: { status: 'OPEN' } })
    }

    // Human takeover: skip the AI auto-reply when paused for this conversation.
    if ((conv.metadata as any)?.aiPaused) return

    // Auto-escalation: customer asked for a human → pause AI, flag, acknowledge once.
    if (wantsHuman(msg.text)) {
      const md = { ...((conv.metadata as any) || {}), aiPaused: true, escalated: true }
      await this.prisma.conversation.update({ where: { id: conv.id }, data: { metadata: md, priority: 'HIGH' as any } })
      const ack = 'Of course — I’m connecting you with a member of our team. They’ll reply here shortly. 🙏'
      await this.prisma.message.create({ data: { conversationId: conv.id, senderId: null, isAI: true, isFromBot: true, type: 'TEXT', content: ack } })
      await this.prisma.conversation.update({ where: { id: conv.id }, data: { lastMessage: ack, lastMsgAt: new Date() } })
      try { await axios.post(`${this.api(token)}/sendMessage`, { chat_id: chatId, text: ack }) } catch {}
      this.notifications?.notifyConversation(orgId, {
        assigneeId: (conv as any).assigneeId, type: 'escalation', conversationId: conv.id,
        title: '⚠ A customer needs a human', body: `${name} asked to speak with your team on Telegram.`,
      }).catch(() => {})
      this.webhooks?.dispatch(orgId, 'conversation.escalated', { conversationId: conv.id, contactId: conv.contactId, channel: 'telegram', question: msg.text }).catch(() => {})
      return
    }

    // Business hours: outside open hours → away message, skip the AI answer.
    const settings = await this.prisma.orgSettings.findUnique({ where: { orgId }, select: { workingHours: true, autoReplyMsg: true } })
    if (settings && !isWithinHours(settings.workingHours as any)) {
      const away = settings.autoReplyMsg?.trim() || 'Thanks for your message! We’re currently closed and will get back to you during our working hours.'
      await this.prisma.message.create({ data: { conversationId: conv.id, senderId: null, isAI: true, isFromBot: true, type: 'TEXT', content: away } })
      await this.prisma.conversation.update({ where: { id: conv.id }, data: { lastMessage: away, lastMsgAt: new Date() } })
      try { await axios.post(`${this.api(token)}/sendMessage`, { chat_id: chatId, text: away }) } catch {}
      return
    }

    // AI reply grounded in the org's knowledge base
    let reply = ''
    try {
      const org = await this.prisma.organization.findUnique({ where: { id: orgId }, select: { name: true, industry: true } })
      let knowledge = ''
      try { knowledge = await this.rag.getContextForQuery(orgId, msg.text, 4) } catch {}
      if (!knowledge && isSubstantiveQuestion(msg.text)) this.rag.logGap(orgId, msg.text, 'telegram').catch(() => {})
      const history = await this.prisma.message.findMany({ where: { conversationId: conv.id }, orderBy: { createdAt: 'asc' }, take: 12 })
      const system = `You are the Telegram assistant for ${org?.name || 'this business'}${org?.industry ? `, a ${org.industry} business` : ''}. Be concise and helpful. Use ONLY the business knowledge below when relevant; if unsure, offer to connect the customer with the team.${knowledge ? `\n\n--- KNOWLEDGE ---\n${knowledge}\n--- END ---` : ''}`
      const messages = [
        { role: 'system' as const, content: system },
        ...history.map(m => ({ role: (m.senderId || m.isAI ? 'assistant' : 'user') as 'user' | 'assistant', content: m.content || '' })).filter(m => m.content),
      ]
      reply = await this.ai.complete(messages, { maxTokens: 300, temperature: 0.5, orgId, module: 'telegram', action: 'reply' })
    } catch {
      reply = 'Thanks for your message! A team member will reply shortly.'
    }

    await this.prisma.message.create({ data: { conversationId: conv.id, senderId: null, isAI: true, isFromBot: true, type: 'TEXT', content: reply } })
    await this.prisma.conversation.update({ where: { id: conv.id }, data: { lastMessage: reply, lastMsgAt: new Date() } })
    try { await axios.post(`${this.api(token)}/sendMessage`, { chat_id: chatId, text: reply }) } catch {}
  }
}
