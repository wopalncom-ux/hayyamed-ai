import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class KnowledgeBaseService {
  constructor(private prisma: PrismaService) {}

  findAll(orgId: string) {
    return this.prisma.knowledgeBase.findMany({
      where: { orgId },
      include: { sources: true, _count: { select: { sources: true, agents: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string, orgId: string) {
    const kb = await this.prisma.knowledgeBase.findFirst({
      where: { id, orgId },
      include: { sources: true },
    })
    if (!kb) throw new NotFoundException('Knowledge base not found')
    return kb
  }

  create(orgId: string, dto: any) {
    return this.prisma.knowledgeBase.create({ data: { ...dto, orgId } })
  }

  async addSource(id: string, orgId: string, dto: any) {
    await this.findOne(id, orgId)
    return this.prisma.knowledgeSource.create({
      data: { ...dto, knowledgeBaseId: id },
    })
  }

  async removeSource(id: string, sourceId: string, orgId: string) {
    await this.findOne(id, orgId)
    return this.prisma.knowledgeSource.deleteMany({ where: { id: sourceId, knowledgeBaseId: id } })
  }

  async reindex(id: string, orgId: string) {
    await this.findOne(id, orgId)
    await this.prisma.knowledgeSource.updateMany({
      where: { knowledgeBaseId: id },
      data: { status: 'pending', lastIndexed: null },
    })
    return { queued: true }
  }
}
