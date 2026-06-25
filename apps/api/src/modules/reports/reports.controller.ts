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

  @Get('full')
  async getFull(@CurrentUser() user: JwtPayload) {
    const orgId = user.orgId
    const since7 = new Date(); since7.setDate(since7.getDate() - 7)
    const since30 = new Date(); since30.setDate(since30.getDate() - 30)

    const [
      totalContacts, wonContacts, lostContacts,
      totalConvs, openConvs,
      activeCampaigns, totalCampaigns,
      totalWorkflowRuns,
      newContacts30d, newContacts7d,
      pipelineStages, sourceCounts,
      topCampaigns,
      recentActivities,
    ] = await Promise.all([
      this.prisma.contact.count({ where: { orgId } }),
      this.prisma.contact.count({ where: { orgId, status: 'WON' } }),
      this.prisma.contact.count({ where: { orgId, status: 'LOST' } }),
      this.prisma.conversation.count({ where: { orgId } }),
      this.prisma.conversation.count({ where: { orgId, status: 'OPEN' } }),
      this.prisma.campaign.count({ where: { orgId, status: 'RUNNING' } }),
      this.prisma.campaign.count({ where: { orgId } }),
      this.prisma.workflowRun.count({ where: { orgId } }),
      this.prisma.contact.count({ where: { orgId, createdAt: { gte: since30 } } }),
      this.prisma.contact.count({ where: { orgId, createdAt: { gte: since7 } } }),
      this.prisma.contact.groupBy({
        by: ['status'],
        where: { orgId },
        _count: { id: true },
        _sum: { value: true },
      }),
      this.prisma.contact.groupBy({
        by: ['source'],
        where: { orgId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.campaign.findMany({
        where: { orgId, status: { in: ['COMPLETED', 'RUNNING', 'PAUSED'] } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true, name: true, status: true,
          _count: { select: { contacts: true } },
        },
      }),
      this.prisma.activity.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true, type: true, data: true, createdAt: true,
          contact: { select: { id: true, name: true } },
          user: { select: { name: true } },
        },
      }),
    ])

    const campaignIds = topCampaigns.map(c => c.id)
    const [deliveredCounts, readCounts] = campaignIds.length > 0 ? await Promise.all([
      this.prisma.campaignContact.groupBy({
        by: ['campaignId'],
        where: { campaignId: { in: campaignIds }, status: { in: ['delivered', 'read'] } },
        _count: { id: true },
      }),
      this.prisma.campaignContact.groupBy({
        by: ['campaignId'],
        where: { campaignId: { in: campaignIds }, status: 'read' },
        _count: { id: true },
      }),
    ]) : [[], []]

    const delivMap = Object.fromEntries((deliveredCounts as any[]).map(d => [d.campaignId, d._count.id]))
    const readMap = Object.fromEntries((readCounts as any[]).map(d => [d.campaignId, d._count.id]))

    const winRate = (wonContacts + lostContacts) > 0
      ? Math.round((wonContacts / (wonContacts + lostContacts)) * 100) : 0

    const pipelineValue = pipelineStages
      .filter(s => !['WON', 'LOST'].includes(s.status))
      .reduce((sum, s) => sum + Number(s._sum?.value || 0), 0)

    const wonValue = Number(pipelineStages.find(s => s.status === 'WON')?._sum?.value || 0)

    const STAGE_ORDER = ['NEW', 'CONTACTED', 'QUALIFYING', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']

    return {
      kpis: {
        totalContacts, wonContacts, lostContacts, winRate,
        totalConvs, openConvs,
        activeCampaigns, totalCampaigns, totalWorkflowRuns,
        newContacts30d, newContacts7d,
        pipelineValue, wonValue,
      },
      pipeline: STAGE_ORDER.map(status => {
        const s = pipelineStages.find(p => p.status === status)
        return { status, count: s?._count?.id || 0, value: Number(s?._sum?.value || 0) }
      }),
      sources: sourceCounts
        .filter(s => s.source)
        .map(s => ({ source: s.source!, count: s._count.id })),
      campaigns: topCampaigns.map(c => ({
        id: c.id, name: c.name, status: c.status,
        total: c._count.contacts,
        delivered: delivMap[c.id] || 0,
        read: readMap[c.id] || 0,
      })),
      recentActivities: recentActivities.map(a => ({
        id: a.id, type: a.type, data: a.data,
        createdAt: a.createdAt,
        contactName: (a as any).contact?.name,
        contactId: (a as any).contact?.id,
        userName: (a as any).user?.name,
      })),
    }
  }

  // Sales dashboard — real pipeline value, win rate, forecast, sources, leaderboard
  @Get('sales')
  async getSales(@CurrentUser() user: JwtPayload) {
    const orgId = user.orgId
    const OPEN_STAGES = ['NEW', 'CONTACTED', 'QUALIFYING', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION']
    // Probability weighting per stage for the weighted forecast
    const WEIGHT: Record<string, number> = { NEW: 0.05, CONTACTED: 0.1, QUALIFYING: 0.2, QUALIFIED: 0.4, PROPOSAL: 0.6, NEGOTIATION: 0.8, WON: 1, LOST: 0 }

    const [byStatus, bySource, won, lost, recentWon] = await Promise.all([
      this.prisma.contact.groupBy({ by: ['status'], where: { orgId }, _count: { id: true }, _sum: { value: true } }),
      this.prisma.contact.groupBy({ by: ['source'], where: { orgId }, _count: { id: true }, _sum: { value: true } }),
      this.prisma.contact.aggregate({ where: { orgId, status: 'WON' }, _count: { id: true }, _sum: { value: true } }),
      this.prisma.contact.count({ where: { orgId, status: 'LOST' } }),
      this.prisma.contact.findMany({ where: { orgId, status: 'WON' }, orderBy: { updatedAt: 'desc' }, take: 8, select: { id: true, name: true, value: true, currency: true, source: true, updatedAt: true } }),
    ])

    const stageMap = Object.fromEntries(byStatus.map(s => [s.status, { count: s._count.id, value: Number(s._sum.value || 0) }]))
    const pipeline = OPEN_STAGES.map(st => ({
      stage: st,
      count: stageMap[st]?.count || 0,
      value: stageMap[st]?.value || 0,
      weighted: Math.round((stageMap[st]?.value || 0) * (WEIGHT[st] || 0)),
    }))

    const openValue = pipeline.reduce((s, p) => s + p.value, 0)
    const weightedForecast = pipeline.reduce((s, p) => s + p.weighted, 0)
    const wonCount = won._count.id
    const wonValue = Number(won._sum.value || 0)
    const closed = wonCount + lost
    const winRate = closed > 0 ? Math.round((wonCount / closed) * 100) : 0
    const avgDealSize = wonCount > 0 ? Math.round(wonValue / wonCount) : 0

    return {
      currency: 'QAR',
      openValue,
      weightedForecast,
      wonValue,
      wonCount,
      lostCount: lost,
      winRate,
      avgDealSize,
      pipeline,
      bySource: bySource
        .map(s => ({ source: s.source || 'Unknown', count: s._count.id, value: Number(s._sum.value || 0) }))
        .sort((a, b) => b.value - a.value),
      recentWon: recentWon.map(c => ({ id: c.id, name: c.name, value: Number(c.value || 0), currency: c.currency, source: c.source, wonAt: c.updatedAt })),
    }
  }
}
