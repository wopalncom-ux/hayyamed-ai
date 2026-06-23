import { Injectable, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class MasterAdminService {
  constructor(private prisma: PrismaService) {}

  private async assertOwner(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user || !['SUPER_ADMIN', 'AGENCY_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Super admin access required')
    }
    return user
  }

  async getPlatformStats(userId: string) {
    await this.assertOwner(userId)
    const [totalOrgs, totalUsers, totalContacts, totalMessages, totalCampaigns] = await Promise.all([
      this.prisma.organization.count(),
      this.prisma.user.count(),
      this.prisma.contact.count(),
      this.prisma.message.count(),
      this.prisma.campaign.count(),
    ])
    const recentOrgs = await this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { _count: { select: { users: true, contacts: true, conversations: true } } },
    })
    return { totalOrgs, totalUsers, totalContacts, totalMessages, totalCampaigns, recentOrgs }
  }

  async getAllOrgs(userId: string, query: { search?: string; plan?: string; page?: number; limit?: number } = {}) {
    await this.assertOwner(userId)
    const { search, plan, page = 1, limit = 20 } = query
    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (plan) where.plan = plan

    const [data, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { users: true, contacts: true, conversations: true, campaigns: true } },
          settings: { select: { aiEnabled: true, autoReply: true } },
        },
      }),
      this.prisma.organization.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async getOrgDetails(userId: string, orgId: string) {
    await this.assertOwner(userId)
    return this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        users: { select: { id: true, name: true, email: true, role: true, lastSeen: true } },
        channels: true,
        settings: true,
        subscription: true,
        _count: { select: { contacts: true, conversations: true, campaigns: true, aiAgents: true } },
      },
    })
  }

  async updateOrg(userId: string, orgId: string, dto: any) {
    await this.assertOwner(userId)
    return this.prisma.organization.update({ where: { id: orgId }, data: dto })
  }

  async suspendOrg(userId: string, orgId: string) {
    await this.assertOwner(userId)
    return this.prisma.organization.update({
      where: { id: orgId },
      data: { plan: 'SUSPENDED' as any },
    })
  }

  async createOrg(userId: string, dto: { name: string; slug: string; industry?: string; country?: string; adminName: string; adminEmail: string }) {
    await this.assertOwner(userId)
    const bcrypt = require('bcryptjs')
    const tempPassword = 'Change@2025'
    const hash = await bcrypt.hash(tempPassword, 10)

    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        industry: dto.industry,
        country: dto.country || 'QA',
        settings: { create: { aiEnabled: true, autoReply: false } },
        users: {
          create: {
            name: dto.adminName,
            email: dto.adminEmail,
            role: 'ADMIN',
            password: hash,
          },
        },
      },
      include: { users: { select: { id: true, email: true, name: true } } },
    })

    return { org, tempPassword }
  }

  async getAuditLogs(userId: string, query: { orgId?: string; page?: number; limit?: number } = {}) {
    await this.assertOwner(userId)
    const { orgId, page = 1, limit = 50 } = query
    const where: any = {}
    if (orgId) where.orgId = orgId

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ])

    return { data, total, page, limit }
  }
}
