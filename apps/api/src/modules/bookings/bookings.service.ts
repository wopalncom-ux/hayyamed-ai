import { Injectable, NotFoundException, Optional } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { WebhooksService } from '../webhooks/webhooks.service'
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    @Optional() private webhooks?: WebhooksService,
    @Optional() private notifications?: NotificationsService,
  ) {}

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

  async create(orgId: string, dto: any) {
    const booking = await this.prisma.booking.create({
      data: { ...dto, orgId },
      include: { contact: { select: { id: true, name: true, phone: true } } },
    })
    const who = (booking as any).contact?.name || 'A customer'
    const svc = (booking as any).service || 'appointment'
    this.webhooks?.dispatch(orgId, 'booking.created', {
      id: booking.id, contactId: booking.contactId, service: (booking as any).service, startTime: (booking as any).startTime, status: booking.status,
    }).catch(() => {})
    this.notifications?.notifyOrgUsers(orgId, 'booking', '📅 New booking', `${who} — ${svc}`, '/bookings').catch(() => {})
    return booking
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
