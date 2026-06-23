import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  findAll(orgId: string, query: { status?: string; staffId?: string; contactId?: string; page?: number; limit?: number } = {}) {
    const { status, staffId, contactId, page = 1, limit = 50 } = query
    const where: any = { orgId }
    if (status) where.status = status
    if (staffId) where.staffId = staffId
    if (contactId) where.contactId = contactId

    return this.prisma.booking.findMany({
      where,
      include: {
        contact: { select: { id: true, name: true, phone: true } },
        staff: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startTime: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })
  }

  async findOne(id: string, orgId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id, orgId },
      include: { contact: true, staff: true },
    })
    if (!booking) throw new NotFoundException('Booking not found')
    return booking
  }

  create(orgId: string, dto: any) {
    return this.prisma.booking.create({
      data: { ...dto, orgId },
      include: { contact: { select: { id: true, name: true, phone: true } } },
    })
  }

  async update(id: string, orgId: string, dto: any) {
    await this.findOne(id, orgId)
    return this.prisma.booking.update({ where: { id }, data: dto })
  }

  async cancel(id: string, orgId: string) {
    await this.findOne(id, orgId)
    return this.prisma.booking.update({ where: { id }, data: { status: 'CANCELLED' } })
  }
}
