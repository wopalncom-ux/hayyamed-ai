import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.contact.create({ data: { ...dto, orgId } })
  }

  async update(id: string, orgId: string, dto: any) {
    return this.prisma.contact.update({ where: { id }, data: dto })
  }

  async remove(id: string) {
    return this.prisma.contact.delete({ where: { id } })
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
