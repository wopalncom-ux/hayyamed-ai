import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

@Controller('reports')
export class ReportsController {
  constructor(private prisma: PrismaService) {}

  private getOrgId(headers: Record<string, string>): string {
    const orgId = headers['x-org-id']
    if (!orgId) throw new UnauthorizedException('x-org-id header required')
    return orgId
  }

  @Get('dashboard')
  async getDashboard(@Headers() headers: Record<string, string>) {
    const orgId = this.getOrgId(headers)

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

    const channelCounts = await this.prisma.conversation.groupBy({
      by: ['channelId'],
      where: { orgId },
      _count: { id: true },
    })

    const statusCounts = await this.prisma.contact.groupBy({
      by: ['status'],
      where: { orgId },
      _count: { id: true },
    })

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
}
