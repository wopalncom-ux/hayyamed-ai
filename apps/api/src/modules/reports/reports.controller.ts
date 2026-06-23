import { Controller, Get, Query } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

@Controller('reports')
export class ReportsController {
  constructor(private prisma: PrismaService) {}

  @Get('dashboard')
  async getDashboard(@CurrentUser() user: JwtPayload) {
    const orgId = user.orgId

    const [totalLeads, wonLeads, booked, totalConvs, openConvs, activeCampaigns] = await Promise.all([
      this.prisma.contact.count({ where: { orgId } }),
      this.prisma.contact.count({ where: { orgId, status: 'WON' } }),
      this.prisma.contact.count({ where: { orgId, status: 'PROPOSAL' } }),
      this.prisma.conversation.count({ where: { orgId } }),
      this.prisma.conversation.count({ where: { orgId, status: 'OPEN' } }),
      this.prisma.campaign.count({ where: { orgId, status: 'RUNNING' } }),
    ])

    const bookingRate = totalLeads > 0 ? Math.round((booked / totalLeads) * 100) : 0
    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0

    const [channelCounts, statusCounts] = await Promise.all([
      this.prisma.conversation.groupBy({
        by: ['channelId'],
        where: { orgId },
        _count: { id: true },
      }),
      this.prisma.contact.groupBy({
        by: ['status'],
        where: { orgId },
        _count: { id: true },
      }),
    ])

    return {
      totalLeads,
      wonLeads,
      booked,
      bookingRate,
      conversionRate,
      totalConvs,
      openConvs,
      activeCampaigns,
      channels: channelCounts.map(c => ({ channelId: c.channelId, count: c._count.id })),
      statuses: statusCounts.map(s => ({ status: s.status, count: s._count.id })),
    }
  }

  @Get('analytics')
  async getAnalytics(
    @CurrentUser() user: JwtPayload,
    @Query('period') period: string = '7days',
  ) {
    const orgId = user.orgId
    const days = period === '90days' ? 90 : period === '30days' ? 30 : 7
    const since = new Date()
    since.setDate(since.getDate() - days)

    const [messages, contacts] = await Promise.all([
      this.prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS count
        FROM "Message"
        WHERE "orgId" = ${orgId} AND "createdAt" >= ${since}
        GROUP BY day ORDER BY day ASC
      `,
      this.prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS count
        FROM "Contact"
        WHERE "orgId" = ${orgId} AND "createdAt" >= ${since}
        GROUP BY day ORDER BY day ASC
      `,
    ])

    const toMap = (rows: { day: Date; count: bigint }[]) =>
      Object.fromEntries(rows.map(r => [r.day.toISOString().slice(0, 10), Number(r.count)]))

    const msgMap = toMap(messages)
    const conMap = toMap(contacts)

    const result: { date: string; messages: number; contacts: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      result.push({ date: key, messages: msgMap[key] ?? 0, contacts: conMap[key] ?? 0 })
    }

    return { period, days: result }
  }
}
