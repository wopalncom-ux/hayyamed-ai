import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service'

@Injectable()
export class AgencyService {
  constructor(
    private prisma: PrismaService,
    private kb: KnowledgeBaseService,
  ) {}

  // ── Per-client AI Brain (agency-scoped — operates on the client's org) ──────
  async listClientBrains(agencyOrgId: string, clientId: string) {
    await this.assertOwns(agencyOrgId, clientId)
    return this.kb.findAll(clientId)
  }

  async createClientBrain(agencyOrgId: string, clientId: string, dto: { name: string; description?: string }) {
    await this.assertOwns(agencyOrgId, clientId)
    return this.kb.create(clientId, dto)
  }

  async addClientSource(agencyOrgId: string, clientId: string, kbId: string, dto: any) {
    await this.assertOwns(agencyOrgId, clientId)
    const sizeBytes = dto?.content ? Buffer.byteLength(String(dto.content), 'utf8') : 0
    const status = dto?.type === 'text' || dto?.type === 'faq' ? 'ready' : 'pending'
    return this.kb.addSource(kbId, clientId, { ...dto, sizeBytes, status })
  }

  async removeClientSource(agencyOrgId: string, clientId: string, kbId: string, sourceId: string) {
    await this.assertOwns(agencyOrgId, clientId)
    return this.kb.removeSource(kbId, clientId, sourceId)
  }

  async retrainClientBrain(agencyOrgId: string, clientId: string, kbId: string) {
    await this.assertOwns(agencyOrgId, clientId)
    return this.kb.reindex(kbId, clientId)
  }

  // Storage usage across all of the client's knowledge sources vs their limit.
  async clientStorage(agencyOrgId: string, clientId: string) {
    await this.assertOwns(agencyOrgId, clientId)
    const org = await this.prisma.organization.findUnique({ where: { id: clientId }, select: { storageLimitMb: true } })
    const rows = await this.prisma.knowledgeSource.findMany({
      where: { knowledgeBase: { orgId: clientId } },
      select: { sizeBytes: true },
    })
    const usedBytes = rows.reduce((s, r) => s + (r.sizeBytes || 0), 0)
    const limitMb = org?.storageLimitMb ?? 500
    return {
      usedBytes,
      usedMb: +(usedBytes / 1048576).toFixed(2),
      limitMb,
      sources: rows.length,
      pct: limitMb > 0 ? Math.min(100, Math.round((usedBytes / (limitMb * 1048576)) * 100)) : 0,
    }
  }

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
    contactPerson?: string
    whatsappNumber?: string
    clientEmail?: string
    website?: string
    businessType?: string
    storageLimitMb?: number
    paymentResponsibility?: string
    profitPercent?: number
    adminNotes?: string
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
        contactPerson:  dto.contactPerson,
        whatsappNumber: dto.whatsappNumber,
        clientEmail:    dto.clientEmail,
        website:        dto.website,
        businessType:   dto.businessType,
        ...(dto.storageLimitMb != null ? { storageLimitMb: dto.storageLimitMb } : {}),
        ...(dto.paymentResponsibility ? { paymentResponsibility: dto.paymentResponsibility } : {}),
        ...(dto.profitPercent != null ? { profitPercent: dto.profitPercent } : {}),
        ...(dto.adminNotes ? { adminNotes: dto.adminNotes } : {}),
      },
    })
    return { id: client.id, name: client.name }
  }

  // Full client profile + resource counts for the Client AI Operating Center.
  async getClientDetail(agencyOrgId: string, clientId: string) {
    await this.assertOwns(agencyOrgId, clientId)
    const c = await this.prisma.organization.findUnique({
      where: { id: clientId },
      include: {
        _count: { select: { contacts: true, aiAgents: true, knowledgeBases: true, workflows: true, channels: true } },
        channels: { select: { id: true, type: true, name: true, isActive: true, isVerified: true } },
      },
    })
    if (!c) throw new NotFoundException('Client not found')
    return {
      id: c.id, name: c.name, logo: c.logo, industry: c.industry, website: c.website,
      contactPerson: c.contactPerson, whatsappNumber: c.whatsappNumber, clientEmail: c.clientEmail,
      businessType: c.businessType, plan: c.plan, status: c.agencyStatus,
      storageLimitMb: c.storageLimitMb, paymentResponsibility: c.paymentResponsibility,
      profitPercent: c.profitPercent, campaignBilling: c.campaignBilling,
      adminNotes: c.adminNotes, notes: c.agencyNotes, balance: c.agencyBalance,
      monthlyRev: c.agencyMonthlyRev, customMargin: c.agencyCustomMgn, aiScore: c.agencyAiScore,
      counts: {
        contacts: c._count.contacts, agents: c._count.aiAgents,
        knowledgeBases: c._count.knowledgeBases, automations: c._count.workflows,
        channels: c._count.channels,
      },
      channels: c.channels,
    }
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
    contactPerson?: string
    whatsappNumber?: string
    clientEmail?: string
    website?: string
    businessType?: string
    storageLimitMb?: number
    paymentResponsibility?: string
    profitPercent?: number
    campaignBilling?: string
    adminNotes?: string
  }) {
    await this.assertOwns(agencyOrgId, clientId)
    const data: any = {
      name: dto.name, industry: dto.type, logo: dto.logo,
      agencyStatus: dto.status, agencyNotes: dto.notes, agencyCustomMgn: dto.customMargin,
      agencyMonthlyRev: dto.monthlyRev, agencyAiScore: dto.aiScore,
      contactPerson: dto.contactPerson, whatsappNumber: dto.whatsappNumber,
      clientEmail: dto.clientEmail, website: dto.website, businessType: dto.businessType,
      paymentResponsibility: dto.paymentResponsibility, campaignBilling: dto.campaignBilling,
      adminNotes: dto.adminNotes,
    }
    if (dto.storageLimitMb != null) data.storageLimitMb = dto.storageLimitMb
    if (dto.profitPercent != null) data.profitPercent = dto.profitPercent
    // Strip undefined so we only update provided fields.
    Object.keys(data).forEach(k => data[k] === undefined && delete data[k])
    return this.prisma.organization.update({ where: { id: clientId }, data })
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
