import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

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
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessage: content, lastMsgAt: new Date() },
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
