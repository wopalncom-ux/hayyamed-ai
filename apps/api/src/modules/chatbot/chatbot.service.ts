import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import axios from 'axios'

@Injectable()
export class ChatbotService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    return this.prisma.chatbot.findMany({
      where: { orgId },
      orderBy: { updatedAt: 'desc' },
    })
  }

  async findOne(id: string, orgId: string) {
    return this.prisma.chatbot.findFirst({ where: { id, orgId } })
  }

  async create(orgId: string, dto: { name: string; channelType: string; flow: any; triggers?: any }) {
    return this.prisma.chatbot.create({
      data: {
        orgId,
        name: dto.name,
        channelType: dto.channelType as any,
        flow: dto.flow || { nodes: [], edges: [] },
        triggers: dto.triggers || {},
        isActive: false,
      },
    })
  }

  async update(id: string, orgId: string, dto: { name?: string; flow?: any; triggers?: any; isActive?: boolean }) {
    return this.prisma.chatbot.update({
      where: { id },
      data: dto,
    })
  }

  async publish(id: string, orgId: string) {
    // Deactivate all other bots for this org first (only one active at a time per channel)
    const bot = await this.prisma.chatbot.findFirst({ where: { id, orgId } })
    if (!bot) throw new Error('Chatbot not found')

    await this.prisma.chatbot.updateMany({
      where: { orgId, channelType: bot.channelType, id: { not: id } },
      data: { isActive: false },
    })

    return this.prisma.chatbot.update({
      where: { id },
      data: { isActive: true },
    })
  }

  async remove(id: string) {
    return this.prisma.chatbot.delete({ where: { id } })
  }

  async getKnowledge(id: string, orgId: string) {
    const bot = await this.prisma.chatbot.findFirst({ where: { id, orgId } })
    const meta = (bot?.metadata as any) || {}
    return { docs: meta.knowledgeDocs || [], websiteUrl: meta.websiteUrl || '' }
  }

  async saveKnowledgeText(id: string, orgId: string, text: string, source: string) {
    const bot = await this.prisma.chatbot.findFirst({ where: { id, orgId } })
    if (!bot) throw new Error('Chatbot not found')
    const meta = (bot.metadata as any) || {}
    const docs: any[] = meta.knowledgeDocs || []
    docs.push({ source, text: text.slice(0, 50000), addedAt: new Date().toISOString() })
    await this.prisma.chatbot.update({
      where: { id },
      data: { metadata: { ...meta, knowledgeDocs: docs } },
    })
    return { success: true, source, chars: text.length }
  }

  async addWebsiteUrl(id: string, orgId: string, url: string) {
    const bot = await this.prisma.chatbot.findFirst({ where: { id, orgId } })
    if (!bot) throw new Error('Chatbot not found')
    const res = await axios.get(url, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } })
    const html: string = res.data
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
    const meta = (bot.metadata as any) || {}
    const docs: any[] = meta.knowledgeDocs || []
    docs.push({ source: url, text: text.slice(0, 50000), addedAt: new Date().toISOString() })
    await this.prisma.chatbot.update({
      where: { id },
      data: { metadata: { ...meta, knowledgeDocs: docs, websiteUrl: url } },
    })
    return { success: true, source: url, chars: text.length }
  }

  async removeKnowledgeDoc(id: string, orgId: string, index: number) {
    const bot = await this.prisma.chatbot.findFirst({ where: { id, orgId } })
    if (!bot) throw new Error('Chatbot not found')
    const meta = (bot.metadata as any) || {}
    const docs: any[] = meta.knowledgeDocs || []
    docs.splice(index, 1)
    await this.prisma.chatbot.update({
      where: { id },
      data: { metadata: { ...meta, knowledgeDocs: docs } },
    })
    return { success: true }
  }

  async getActiveKnowledge(orgId: string) {
    const bot = await this.prisma.chatbot.findFirst({
      where: { orgId, isActive: true },
    })
    if (!bot) return null
    const meta = (bot.metadata as any) || {}
    const docs: any[] = meta.knowledgeDocs || []
    if (!docs.length) return null
    return docs.map((d: any) => `--- ${d.source} ---\n${d.text}`).join('\n\n')
  }

  // Process an incoming message through the active chatbot flow
  async processMessage(orgId: string, channelType: string, message: string): Promise<string | null> {
    const bot = await this.prisma.chatbot.findFirst({
      where: { orgId, channelType: channelType as any, isActive: true },
    })
    if (!bot) return null

    const flow = bot.flow as any
    const nodes: any[] = flow?.nodes || []

    // Find trigger node
    const trigger = nodes.find((n: any) => n.type === 'trigger')
    if (!trigger) return null

    // Simple keyword matching from triggers
    const triggers = (bot.triggers as any) || {}
    const keywords: string[] = triggers.keywords || []
    const msgLower = message.toLowerCase()

    if (keywords.length > 0 && !keywords.some((k: string) => msgLower.includes(k.toLowerCase()))) {
      return null
    }

    // Find first message node after trigger
    const msgNode = nodes.find((n: any) => n.type === 'message')
    if (msgNode) return msgNode.preview || msgNode.title || null

    return null
  }
}
