import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class AgencyService {
  constructor(private prisma: PrismaService) {}

  // ── Clients ────────────────────────────────────────────────────────────────

  async listClients(agencyOrgId: string) {
    const clients = await this.prisma.organization.findMany({
      where: { parentOrgId: agencyOrgId, isActive: true },
      include: {
        _count: { select: { contacts: true } },
        channels: { where: { type: 'WHATSAPP' }, select: { isActive: true }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    })

    return clients.map(c => ({
      id:          c.id,
      name:        c.name,
      type:        c.industry || '',
      logo:        c.logo || '🏢',
      plan:        c.plan,
      status:      c.agencyStatus,
      contacts:    c._count.contacts,
      messages:    0,
      balance:     c.agencyBalance,
      monthlyRev:  c.agencyMonthlyRev,
      customMargin:c.agencyCustomMgn,
      wa:          c.channels[0]?.isActive ? 'Connected' : 'Disconnected',
      lastActive:  c.updatedAt.toISOString(),
      ai:          c.agencyAiScore,
      notes:       c.agencyNotes,
    }))
  }

  async createClient(agencyOrgId: string, dto: {
    name: string
    type?: string
    logo?: string
    plan?: string
    monthlyRev?: number
  }) {
    const slug = `${dto.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    const client = await this.prisma.organization.create({
      data: {
        name:          dto.name,
        slug,
        industry:      dto.type,
        logo:          dto.logo || '🏢',
        parentOrgId:   agencyOrgId,
        agencyMonthlyRev: dto.monthlyRev || 0,
      },
    })
    return { id: client.id, name: client.name }
  }

  async updateClient(agencyOrgId: string, clientId: string, dto: {
    name?: string
    type?: string
    logo?: string
    plan?: string
    status?: string
    notes?: string
    customMargin?: number | null
    monthlyRev?: number
    aiScore?: number
  }) {
    await this.assertOwns(agencyOrgId, clientId)
    return this.prisma.organization.update({
      where: { id: clientId },
      data: {
        name:            dto.name,
        industry:        dto.type,
        logo:            dto.logo,
        agencyStatus:    dto.status,
        agencyNotes:     dto.notes,
        agencyCustomMgn: dto.customMargin,
        agencyMonthlyRev:dto.monthlyRev,
        agencyAiScore:   dto.aiScore,
      },
    })
  }

  async topUp(agencyOrgId: string, clientId: string, amount: number) {
    await this.assertOwns(agencyOrgId, clientId)
    const client = await this.prisma.organization.findUnique({ where: { id: clientId } })
    return this.prisma.organization.update({
      where: { id: clientId },
      data: { agencyBalance: (client?.agencyBalance ?? 0) + amount },
    })
  }

  async deleteClient(agencyOrgId: string, clientId: string) {
    await this.assertOwns(agencyOrgId, clientId)
    await this.prisma.organization.update({
      where: { id: clientId },
      data: { isActive: false },
    })
  }

  private async assertOwns(agencyOrgId: string, clientId: string) {
    const client = await this.prisma.organization.findUnique({ where: { id: clientId } })
    if (!client || client.parentOrgId !== agencyOrgId) {
      throw new ForbiddenException('Client does not belong to this agency')
    }
  }

  // ── Packages ───────────────────────────────────────────────────────────────

  async listPackages(orgId: string) {
    return this.prisma.agencyPackage.findMany({
      where: { orgId },
      orderBy: { price: 'asc' },
    })
  }

  async createPackage(orgId: string, dto: {
    name: string
    price: number
    margin?: number
    color?: string
    description?: string
    features?: string[]
    conditions?: string[]
  }) {
    return this.prisma.agencyPackage.create({
      data: {
        orgId,
        name:        dto.name,
        price:       dto.price,
        margin:      dto.margin ?? 25,
        color:       dto.color ?? '#00e5a0',
        description: dto.description ?? '',
        features:    dto.features ?? [],
        conditions:  dto.conditions ?? [],
      },
    })
  }

  async updatePackage(orgId: string, pkgId: string, dto: Partial<{
    name: string
    price: number
    margin: number
    color: string
    description: string
    features: string[]
    conditions: string[]
    isActive: boolean
  }>) {
    const pkg = await this.prisma.agencyPackage.findUnique({ where: { id: pkgId } })
    if (!pkg || pkg.orgId !== orgId) throw new NotFoundException()
    return this.prisma.agencyPackage.update({ where: { id: pkgId }, data: dto })
  }

  async deletePackage(orgId: string, pkgId: string) {
    const pkg = await this.prisma.agencyPackage.findUnique({ where: { id: pkgId } })
    if (!pkg || pkg.orgId !== orgId) throw new NotFoundException()
    await this.prisma.agencyPackage.delete({ where: { id: pkgId } })
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  async getStats(agencyOrgId: string) {
    const clients = await this.prisma.organization.findMany({
      where: { parentOrgId: agencyOrgId, isActive: true },
      select: { agencyBalance: true, agencyMonthlyRev: true, agencyCustomMgn: true, plan: true, _count: { select: { contacts: true } } },
    })

    const totalRev    = clients.reduce((s, c) => s + (c.agencyMonthlyRev || 0), 0)
    const totalConts  = clients.reduce((s, c) => s + c._count.contacts, 0)

    return {
      totalClients: clients.length,
      totalRevenue: totalRev,
      totalContacts: totalConts,
    }
  }
}
