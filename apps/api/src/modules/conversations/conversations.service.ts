import { Injectable, Optional } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { RealtimeGateway } from '../../common/gateways/websocket.gateway'
import { AIService } from '../ai/ai.service'

@Injectable()
export class ConversationsService {
  constructor(
    private prisma: PrismaService,
    private ai: AIService,
    @Optional() private gateway?: RealtimeGateway,
  ) {}

  // AI summary of a conversation — pulls the thread and produces a short brief.
  async summarize(id: string, orgId: string) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id, orgId },
      include: { contact: { select: { name: true, status: true } } },
    })
    if (!conv) return { summary: 'Conversation not found.' }

    const messages = await this.prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      take: 40,
    })
    if (!messages.length) return { summary: 'No messages to summarize yet.' }

    const transcript = messages
      .map(m => `${m.senderId ? 'Agent' : 'Customer'}: ${m.content || `(${m.type})`}`)
      .join('\n')

    const prompt = `Summarize this customer conversation in 3-4 short bullet points: the customer's intent, key questions/requests, sentiment, and the recommended next action. Be concise.\n\nCustomer: ${conv.contact?.name || 'Unknown'} (lead status: ${conv.contact?.status || 'NEW'})\n\nTranscript:\n${transcript}`

    try {
      const summary = await this.ai.complete(
        [{ role: 'user', content: prompt }],
        { maxTokens: 250, temperature: 0.4, orgId, module: 'inbox', action: 'summarize' },
      )
      return { summary }
    } catch {
      return { summary: '⚠️ AI summary unavailable — no valid AI provider configured.' }
    }
  }

  async findAll(orgId: string, query: { status?: string; search?: string; page?: number; limit?: number } = {}) {
    const { status, search, page = 1, limit = 30 } = query
    const where: any = { orgId }
    if (status) where.status = status
    if (search) {
      where.OR = [
        { contact: { name: { contains: search, mode: 'insensitive' } } },
        { lastMessage: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        orderBy: { lastMsgAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          contact: { select: { id: true, name: true, phone: true, avatar: true, status: true } },
          channel: { select: { id: true, name: true, type: true } },
          assignee: { select: { id: true, name: true, avatar: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      this.prisma.conversation.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async findOne(id: string, orgId: string) {
    return this.prisma.conversation.findFirst({
      where: { id, orgId },
      include: {
        contact: true,
        channel: true,
        assignee: { select: { id: true, name: true, avatar: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })
  }

  async getMessages(conversationId: string) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    })
  }

  async sendMessage(conversationId: string, content: string, senderId?: string) {
    const msg = await this.prisma.message.create({
      data: { conversationId, content, senderId, type: 'TEXT', status: 'SENT' },
    })
    const conv = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessage: content, lastMsgAt: new Date() },
    })
    // Emit real-time event to all agents in this org
    this.gateway?.emitNewMessage(conv.orgId, conversationId, {
      id: msg.id, content, direction: 'OUTBOUND', senderType: 'AGENT',
      status: 'SENT', createdAt: msg.createdAt, conversationId,
    })
    return msg
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.conversation.update({ where: { id }, data: { status: status as any } })
  }

  async getStats(orgId: string) {
    const [total, open, pending, resolved] = await Promise.all([
      this.prisma.conversation.count({ where: { orgId } }),
      this.prisma.conversation.count({ where: { orgId, status: 'OPEN' } }),
      this.prisma.conversation.count({ where: { orgId, status: 'PENDING' } }),
      this.prisma.conversation.count({ where: { orgId, status: 'RESOLVED' } }),
    ])
    return { total, open, pending, resolved }
  }
}
