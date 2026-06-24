import { Injectable, Optional } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { WorkflowEngineService } from '../workflows/workflow-engine.service'

@Injectable()
export class ContactsService {
  constructor(
    private prisma: PrismaService,
    @Optional() private workflowEngine?: WorkflowEngineService,
  ) {}

  async findAll(orgId: string, query: { search?: string; status?: string; page?: number; limit?: number } = {}) {
    const { search, status, page = 1, limit = 50 } = query
    const where: any = { orgId }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status) where.status = status

    const [data, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.contact.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async findOne(id: string, orgId: string) {
    return this.prisma.contact.findFirst({ where: { id, orgId } })
  }

  async create(orgId: string, dto: any) {
    const contact = await this.prisma.contact.create({ data: { ...dto, orgId } })
    // Fire new_contact trigger (fire-and-forget)
    this.workflowEngine?.fire(orgId, 'new_contact', contact.id, { source: contact.source }).catch(() => {})
    return contact
  }

  async update(id: string, orgId: string, dto: any) {
    const before = await this.prisma.contact.findUnique({ where: { id }, select: { status: true } })
    const contact = await this.prisma.contact.update({ where: { id }, data: dto })
    // Fire status_changed if status was updated
    if (dto.status && before?.status !== dto.status) {
      this.workflowEngine?.fire(orgId, 'status_changed', id, { oldStatus: before?.status, status: dto.status }).catch(() => {})
    }
    return contact
  }

  async remove(id: string, orgId: string) {
    return this.prisma.contact.deleteMany({ where: { id, orgId } })
  }

  async getStats(orgId: string) {
    const [total, qualifying, proposal, won] = await Promise.all([
      this.prisma.contact.count({ where: { orgId } }),
      this.prisma.contact.count({ where: { orgId, status: 'QUALIFYING' } }),
      this.prisma.contact.count({ where: { orgId, status: 'PROPOSAL' } }),
      this.prisma.contact.count({ where: { orgId, status: 'WON' } }),
    ])
    return { total, hot: qualifying, booked: proposal, won }
  }
}
