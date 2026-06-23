import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string, query: { status?: string; page?: number; limit?: number } = {}) {
    const { status, page = 1, limit = 20 } = query
    const where: any = { orgId }
    if (status) where.status = status

    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { channel: { select: { name: true, type: true } } },
      }),
      this.prisma.campaign.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async findOne(id: string, orgId: string) {
    return this.prisma.campaign.findFirst({
      where: { id, orgId },
      include: { channel: true },
    })
  }

  async create(orgId: string, dto: any) {
    return this.prisma.campaign.create({ data: { ...dto, orgId } })
  }

  async update(id: string, orgId: string, dto: any) {
    return this.prisma.campaign.update({ where: { id }, data: dto })
  }

  async remove(id: string, orgId: string) {
    return this.prisma.campaign.deleteMany({ where: { id, orgId } })
  }

  async getStats(orgId: string) {
    const [total, active, completed, draft] = await Promise.all([
      this.prisma.campaign.count({ where: { orgId } }),
      this.prisma.campaign.count({ where: { orgId, status: 'RUNNING' } }),
      this.prisma.campaign.count({ where: { orgId, status: 'COMPLETED' } }),
      this.prisma.campaign.count({ where: { orgId, status: 'DRAFT' } }),
    ])
    return { total, active, completed, draft }
  }
}
