import { Injectable, Logger, Optional } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { AIService } from '../ai/ai.service'
import { RagService } from '../knowledge-base/rag.service'
import { NotificationsService } from '../notifications/notifications.service'
import { WebhooksService } from '../webhooks/webhooks.service'
import { wantsHuman } from '../../common/util/escalation.util'
import { isWithinHours } from '../../common/util/business-hours.util'
import { isSubstantiveQuestion } from '../../common/util/question.util'
import { computeLeadScore } from '../../common/util/lead-score.util'
import { detectNegative } from '../../common/util/sentiment.util'
import { WorkflowEngineService } from '../workflows/workflow-engine.service'

@Injectable()
export class WebchatService {
  private readonly logger = new Logger(WebchatService.name)

  constructor(
    private prisma: PrismaService,
    private ai: AIService,
    private rag: RagService,
    @Optional() private notifications?: NotificationsService,
    @Optional() private webhooks?: WebhooksService,
    @Optional() private workflows?: WorkflowEngineService,
  ) {}

  // Lazily ensure the org has a LIVE_CHAT (website) channel.
  private async ensureChannel(orgId: string) {
    let channel = await this.prisma.channel.findFirst({ where: { orgId, type: 'LIVE_CHAT' } })
    if (!channel) {
      channel = await this.prisma.channel.create({
        data: { orgId, type: 'LIVE_CHAT', name: 'Website Chat', identifier: `webchat-${orgId.slice(0, 8)}`, isActive: true, isVerified: true },
      })
    }
    return channel
  }

  // Find or create the conversation for a website chat session (keyed by sessionId).
  private async getOrCreateConversation(orgId: string, sessionId: string, name?: string) {
    let conv = await this.prisma.conversation.findFirst({
      where: { orgId, channel: { type: 'LIVE_CHAT' }, externalId: sessionId },
    })
    if (conv) return conv

    const channel = await this.ensureChannel(orgId)
    const cName = name?.trim() || 'Website Visitor'
    const contact = await this.prisma.contact.create({
      data: {
        orgId,
        name: cName,
        source: 'website',
        status: 'NEW',
        score: computeLeadScore({ status: 'NEW', name: cName }),
        metadata: { webchatSession: sessionId },
      },
    })
    conv = await this.prisma.conversation.create({
      data: { orgId, channelId: channel.id, contactId: contact.id, externalId: sessionId, status: 'OPEN', subject: 'Website chat' },
    })
    this.webhooks?.dispatch(orgId, 'contact.created', { id: contact.id, name: contact.name, source: 'website', status: 'NEW' }).catch(() => {})
    return conv
  }

  async receiveMessage(orgId: string, sessionId: string, text: string, name?: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId }, select: { id: true, name: true, industry: true } })
    if (!org) return { error: 'Invalid workspace' }
    if (!text?.trim()) return { error: 'Empty message' }

    const conv = await this.getOrCreateConversation(orgId, sessionId, name)

    // Store the inbound (customer) message
    await this.prisma.message.create({
      data: { conversationId: conv.id, senderId: null, type: 'TEXT', content: text.trim() },
    })
    await this.prisma.conversation.update({ where: { id: conv.id }, data: { lastMessage: text.trim(), lastMsgAt: new Date(), isRead: false } })

    // Keyword-triggered automations run on the inbound text (non-blocking).
    this.workflows?.fire(orgId, 'keyword', conv.contactId || undefined, { text: text.trim() }).catch(() => {})

    // Satisfaction rating: if we asked for a rating, capture a leading 1–5.
    if ((conv.metadata as any)?.awaitingRating) {
      const m = text.trim().match(/^([1-5])\b/)
      if (m) {
        const rating = Number(m[1])
        await this.prisma.conversation.update({ where: { id: conv.id }, data: { metadata: { ...((conv.metadata as any) || {}), awaitingRating: false, rating } } })
        const thanks = `Thank you for your feedback! ⭐ ${rating}/5`
        await this.prisma.message.create({ data: { conversationId: conv.id, senderId: null, isAI: true, isFromBot: true, type: 'TEXT', content: thanks } })
        await this.prisma.conversation.update({ where: { id: conv.id }, data: { lastMessage: thanks, lastMsgAt: new Date() } })
        return { reply: thanks, sessionId, rated: rating }
      }
    }

    // A new (non-rating) message on a resolved conversation reopens it.
    if ((conv as any).status === 'RESOLVED') {
      await this.prisma.conversation.update({ where: { id: conv.id }, data: { status: 'OPEN' } })
    }

    // Negative sentiment: flag frustrated customers + alert the team (non-blocking).
    if (detectNegative(text) && !(conv.metadata as any)?.negative) {
      this.prisma.conversation.update({ where: { id: conv.id }, data: { priority: 'HIGH' as any, metadata: { ...((conv.metadata as any) || {}), negative: true } } }).catch(() => {})
      this.notifications?.notifyConversation(orgId, { assigneeId: (conv as any).assigneeId, type: 'sentiment', conversationId: conv.id, title: '😟 Unhappy customer', body: 'A website chat customer sounds frustrated — may need attention.' }).catch(() => {})
    }

    // Human takeover: if AI is paused for this conversation, don't auto-reply —
    // a human is handling it. The message is stored and surfaces in the inbox.
    if ((conv.metadata as any)?.aiPaused) {
      return { paused: true, sessionId }
    }

    // Auto-escalation: customer is asking for a human → pause AI, flag the
    // conversation for human attention, and acknowledge once.
    if (wantsHuman(text)) {
      const md = { ...((conv.metadata as any) || {}), aiPaused: true, escalated: true }
      await this.prisma.conversation.update({ where: { id: conv.id }, data: { metadata: md, priority: 'HIGH' as any } })
      const ack = 'Of course — I’m connecting you with a member of our team. They’ll reply here shortly. 🙏'
      await this.prisma.message.create({ data: { conversationId: conv.id, senderId: null, isAI: true, isFromBot: true, type: 'TEXT', content: ack } })
      await this.prisma.conversation.update({ where: { id: conv.id }, data: { lastMessage: ack, lastMsgAt: new Date() } })
      this.notifications?.notifyConversation(orgId, {
        assigneeId: (conv as any).assigneeId, type: 'escalation', conversationId: conv.id,
        title: '⚠ A customer needs a human', body: 'A website chat visitor asked to speak with your team.',
      }).catch(() => {})
      this.webhooks?.dispatch(orgId, 'conversation.escalated', { conversationId: conv.id, contactId: conv.contactId, channel: 'webchat', question: text }).catch(() => {})
      return { reply: ack, sessionId, escalated: true }
    }

    // Business hours: outside open hours → send the away message, skip the AI answer.
    const settings = await this.prisma.orgSettings.findUnique({ where: { orgId }, select: { workingHours: true, autoReplyMsg: true } })
    if (settings && !isWithinHours(settings.workingHours as any)) {
      const away = settings.autoReplyMsg?.trim() || 'Thanks for your message! We’re currently closed and will get back to you during our working hours.'
      await this.prisma.message.create({ data: { conversationId: conv.id, senderId: null, isAI: true, isFromBot: true, type: 'TEXT', content: away } })
      await this.prisma.conversation.update({ where: { id: conv.id }, data: { lastMessage: away, lastMsgAt: new Date() } })
      return { reply: away, sessionId, away: true }
    }

    // Build an AI reply grounded in the org's knowledge base (graceful if no AI/KB)
    let reply = ''
    try {
      let knowledge = ''
      try { knowledge = await this.rag.getContextForQuery(orgId, text, 4) } catch { knowledge = '' }
      if (!knowledge && isSubstantiveQuestion(text)) this.rag.logGap(orgId, text, 'webchat').catch(() => {})
      const history = await this.prisma.message.findMany({ where: { conversationId: conv.id }, orderBy: { createdAt: 'asc' }, take: 12 })
      const system = `You are the website assistant for ${org.name}${org.industry ? `, a ${org.industry} business` : ''}. Be concise, friendly, and helpful. Answer using ONLY the business knowledge below when relevant; if you don't know, offer to connect the visitor with the team.${knowledge ? `\n\n--- BUSINESS KNOWLEDGE ---\n${knowledge}\n--- END ---` : ''}`
      const messages = [
        { role: 'system' as const, content: system },
        ...history.map(m => ({ role: (m.senderId || m.isAI ? 'assistant' : 'user') as 'user' | 'assistant', content: m.content || '' })).filter(m => m.content),
      ]
      reply = await this.ai.complete(messages, { maxTokens: 300, temperature: 0.5, orgId, module: 'webchat', action: 'reply' })
    } catch {
      reply = 'Thanks for your message! A team member will get back to you shortly.'
    }

    // Store the AI reply
    await this.prisma.message.create({
      data: { conversationId: conv.id, senderId: null, isAI: true, isFromBot: true, type: 'TEXT', content: reply },
    })
    await this.prisma.conversation.update({ where: { id: conv.id }, data: { lastMessage: reply, lastMsgAt: new Date() } })

    return { reply, sessionId }
  }

  async getSession(orgId: string, sessionId: string) {
    const conv = await this.prisma.conversation.findFirst({
      where: { orgId, channel: { type: 'LIVE_CHAT' }, externalId: sessionId },
    })
    if (!conv) return { messages: [] }
    const messages = await this.prisma.message.findMany({ where: { conversationId: conv.id }, orderBy: { createdAt: 'asc' }, take: 100 })
    return {
      messages: messages.map(m => ({
        from: (m.isAI || m.isFromBot) ? 'bot' : m.senderId ? 'agent' : 'visitor',
        text: m.content || '',
        at: m.createdAt,
      })),
    }
  }
}
