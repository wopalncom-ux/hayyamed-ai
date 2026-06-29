import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service'
import { RagService } from '../knowledge-base/rag.service'
import { AIAgentsService } from '../ai-agents/ai-agents.service'
import { UnipileService } from '../unipile/unipile.service'
import { WhatsAppService } from '../whatsapp/whatsapp.service'
import { InstagramService } from '../instagram/instagram.service'
import { WorkflowsService } from '../workflows/workflows.service'

// One-click automation templates. Each maps to triggers/actions the engine
// actually runs today. Time-based templates are flagged (need the scheduler).
const AUTOMATION_TEMPLATES = [
  { id: 'new-lead-reply', name: 'New lead — instant reply', desc: 'When a new contact arrives, send a WhatsApp welcome.', trigger: 'new_contact', conditions: {}, actions: [{ type: 'send_whatsapp', message: 'Hi {{name}}! 👋 Thanks for reaching out — how can we help you today?' }] },
  { id: 'faq-pricing', name: 'FAQ — pricing auto-answer', desc: 'When a customer mentions price, reply and tag them.', trigger: 'keyword', conditions: { keyword: 'price' }, actions: [{ type: 'add_tag', tag: 'price-interest' }, { type: 'send_whatsapp', message: 'Happy to help with pricing, {{name}}! A team member will share details shortly.' }] },
  { id: 'complaint-escalation', name: 'Complaint — escalate', desc: 'When a customer complains, tag it and log an escalation.', trigger: 'keyword', conditions: { keyword: 'complaint' }, actions: [{ type: 'add_tag', tag: 'complaint' }, { type: 'create_activity', title: 'Complaint received — escalate to manager' }] },
  { id: 'won-thankyou', name: 'Deal won — thank you', desc: 'When a contact is marked WON, send a thank-you.', trigger: 'status_changed', conditions: { status: 'WON' }, actions: [{ type: 'send_whatsapp', message: 'Thank you for choosing us, {{name}}! 🎉 We look forward to serving you.' }] },
  { id: 'vip-alert', name: 'VIP tagged — notify team', desc: 'When a contact is tagged vip, log an internal alert.', trigger: 'tag_added', conditions: { tag: 'vip' }, actions: [{ type: 'create_activity', title: 'VIP customer flagged — give white-glove attention' }] },
  { id: 'human-handoff', name: 'Human handoff request', desc: 'When a customer asks for a human, tag + log for a takeover.', trigger: 'keyword', conditions: { keyword: 'human' }, actions: [{ type: 'add_tag', tag: 'needs-human' }, { type: 'create_activity', title: 'Customer requested a human agent' }] },
  { id: 'lead-followup-1d', name: 'New lead — 1-day follow-up', desc: 'If a new lead goes quiet, send a friendly WhatsApp follow-up after 1 day (time-delayed).', trigger: 'new_contact', conditions: {}, actions: [{ type: 'wait', seconds: 86400 }, { type: 'send_whatsapp', message: 'Hi {{name}}, just following up 😊 do you have any questions we can help with?' }] },
]

// Internal marketplace — modules the owner can enable/disable per client.
// price = monthly QAR add-on the owner can charge (0 = included).
const MODULE_CATALOG = [
  { key: 'ai_agents', name: 'AI Agents', icon: '🤖', desc: 'AI agents that answer customers across channels.', price: 0, defaultOn: true },
  { key: 'whatsapp', name: 'WhatsApp', icon: '💚', desc: 'WhatsApp inbox + AI replies (Unipile or Meta).', price: 0, defaultOn: true },
  { key: 'website_chatbot', name: 'Website Chatbot', icon: '🌐', desc: 'Embeddable AI chat widget for the client site.', price: 0, defaultOn: true },
  { key: 'email', name: 'Email', icon: '✉️', desc: 'Transactional + inbound email handling.', price: 30, defaultOn: false },
  { key: 'crm', name: 'CRM & Pipeline', icon: '👥', desc: 'Contacts, pipeline, lead scoring.', price: 0, defaultOn: true },
  { key: 'campaigns', name: 'Campaigns', icon: '📣', desc: 'Broadcast + WhatsApp campaign templates.', price: 50, defaultOn: false },
  { key: 'payments', name: 'Payments', icon: '💳', desc: 'Collect payments / invoices (MyFatoorah).', price: 25, defaultOn: false },
  { key: 'reporting', name: 'Reporting & Analytics', icon: '📈', desc: 'Dashboards, CSAT, response-time reports.', price: 0, defaultOn: true },
  { key: 'storage', name: 'Extra Storage', icon: '💾', desc: 'Additional AI Brain storage for this client.', price: 20, defaultOn: false },
  { key: 'addons', name: 'Premium Add-ons', icon: '✨', desc: 'White-label, priority support, custom work.', price: 100, defaultOn: false },
]

@Injectable()
export class AgencyService {
  constructor(
    private prisma: PrismaService,
    private kb: KnowledgeBaseService,
    private rag: RagService,
    private agents: AIAgentsService,
    private unipile: UnipileService,
    private whatsapp: WhatsAppService,
    private instagram: InstagramService,
    private workflows: WorkflowsService,
  ) {}

  // Instagram DM (Meta) for a client.
  async connectClientInstagram(agencyOrgId: string, clientId: string, dto: { igAccountId: string; accessToken: string; username?: string }) {
    await this.assertOwns(agencyOrgId, clientId)
    return this.instagram.connectChannel(clientId, dto)
  }

  // ── Per-client Automations (agency-scoped) ─────────────────────────────────
  automationTemplates() {
    return AUTOMATION_TEMPLATES.map(({ id, name, desc, trigger }) => ({ id, name, desc, trigger }))
  }

  async listClientAutomations(agencyOrgId: string, clientId: string) {
    await this.assertOwns(agencyOrgId, clientId)
    return this.workflows.findAll(clientId)
  }

  async createClientAutomation(agencyOrgId: string, clientId: string, dto: any) {
    await this.assertOwns(agencyOrgId, clientId)
    return this.workflows.create(clientId, dto)
  }

  async installClientTemplate(agencyOrgId: string, clientId: string, templateId: string) {
    await this.assertOwns(agencyOrgId, clientId)
    const t = AUTOMATION_TEMPLATES.find(x => x.id === templateId)
    if (!t) throw new NotFoundException('Template not found')
    return this.workflows.create(clientId, { name: t.name, trigger: t.trigger, conditions: t.conditions, actions: t.actions })
  }

  async updateClientAutomation(agencyOrgId: string, clientId: string, wfId: string, dto: any) {
    await this.assertOwns(agencyOrgId, clientId)
    return this.workflows.update(wfId, clientId, dto)
  }

  async toggleClientAutomation(agencyOrgId: string, clientId: string, wfId: string, isActive: boolean) {
    await this.assertOwns(agencyOrgId, clientId)
    return this.workflows.toggle(wfId, clientId, isActive)
  }

  async removeClientAutomation(agencyOrgId: string, clientId: string, wfId: string) {
    await this.assertOwns(agencyOrgId, clientId)
    return this.workflows.remove(wfId, clientId)
  }

  async clientAutomationRuns(agencyOrgId: string, clientId: string) {
    await this.assertOwns(agencyOrgId, clientId)
    return this.prisma.workflowRun.findMany({
      where: { orgId: clientId },
      select: { id: true, workflowId: true, status: true, error: true, createdAt: true, workflow: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
  }

  // ── Per-client Modules (internal marketplace) ──────────────────────────────
  moduleCatalog() { return MODULE_CATALOG }

  async getClientModules(agencyOrgId: string, clientId: string) {
    await this.assertOwns(agencyOrgId, clientId)
    const org = await this.prisma.organization.findUnique({ where: { id: clientId }, select: { modules: true } })
    const state: any = (org?.modules as any) || {}
    return MODULE_CATALOG.map(m => ({
      ...m,
      enabled: state[m.key]?.enabled ?? m.defaultOn,
    }))
  }

  async setClientModule(agencyOrgId: string, clientId: string, moduleKey: string, enabled: boolean) {
    await this.assertOwns(agencyOrgId, clientId)
    if (!MODULE_CATALOG.some(m => m.key === moduleKey)) throw new NotFoundException('Unknown module')
    const org = await this.prisma.organization.findUnique({ where: { id: clientId }, select: { modules: true } })
    const state: any = (org?.modules as any) || {}
    state[moduleKey] = { ...(state[moduleKey] || {}), enabled }
    await this.prisma.organization.update({ where: { id: clientId }, data: { modules: state } })
    return { key: moduleKey, enabled }
  }

  // ── Per-client Channels (agency-scoped) ────────────────────────────────────
  async listClientChannels(agencyOrgId: string, clientId: string) {
    await this.assertOwns(agencyOrgId, clientId)
    const channels = await this.prisma.channel.findMany({
      where: { orgId: clientId },
      select: { id: true, type: true, name: true, identifier: true, isActive: true, isVerified: true, metadata: true },
      orderBy: { createdAt: 'desc' },
    })
    return channels.map(c => ({ ...c, provider: (c.metadata as any)?.provider || (c.type === 'WHATSAPP' ? 'meta' : c.type.toLowerCase()) }))
  }

  // WhatsApp via Unipile (QR/pairing code) for a client.
  async connectClientUnipile(agencyOrgId: string, clientId: string, pairingPhone?: string) {
    await this.assertOwns(agencyOrgId, clientId)
    return this.unipile.connectWhatsapp(clientId, pairingPhone)
  }
  async clientUnipileStatus(agencyOrgId: string, clientId: string) {
    await this.assertOwns(agencyOrgId, clientId)
    return this.unipile.status(clientId)
  }

  // WhatsApp via Meta Cloud API for a client.
  async connectClientMeta(agencyOrgId: string, clientId: string, dto: { name?: string; phoneNumberId: string; accessToken: string; businessId?: string; webhookSecret?: string }) {
    await this.assertOwns(agencyOrgId, clientId)
    return this.whatsapp.connectChannel(clientId, {
      name: dto.name || 'WhatsApp (Meta Cloud API)',
      phoneNumberId: dto.phoneNumberId, accessToken: dto.accessToken,
      businessId: dto.businessId, webhookSecret: dto.webhookSecret,
    })
  }

  // Manual / custom webhook channel for a client.
  async connectClientManual(agencyOrgId: string, clientId: string, dto: { name?: string; type?: string; webhookUrl?: string }) {
    await this.assertOwns(agencyOrgId, clientId)
    return this.prisma.channel.create({
      data: {
        orgId: clientId, type: 'WHATSAPP', name: dto.name || 'Custom provider',
        identifier: `manual-${Date.now()}`, isActive: true, isVerified: false,
        metadata: { provider: 'manual', webhookUrl: dto.webhookUrl || '' } as any,
      },
    })
  }

  async disconnectClientChannel(agencyOrgId: string, clientId: string, channelId: string) {
    await this.assertOwns(agencyOrgId, clientId)
    await this.prisma.channel.updateMany({ where: { id: channelId, orgId: clientId }, data: { isActive: false } })
    return { ok: true }
  }

  // ── Per-client AI Agents (agency-scoped) ───────────────────────────────────
  async listClientAgents(agencyOrgId: string, clientId: string) {
    await this.assertOwns(agencyOrgId, clientId)
    return this.agents.findAll(clientId)
  }

  async createClientAgent(agencyOrgId: string, clientId: string, dto: any) {
    await this.assertOwns(agencyOrgId, clientId)
    return this.agents.create(clientId, dto)
  }

  async updateClientAgent(agencyOrgId: string, clientId: string, agentId: string, dto: any) {
    await this.assertOwns(agencyOrgId, clientId)
    return this.agents.update(agentId, clientId, dto)
  }

  async removeClientAgent(agencyOrgId: string, clientId: string, agentId: string) {
    await this.assertOwns(agencyOrgId, clientId)
    return this.agents.remove(agentId, clientId)
  }

  async toggleClientAgent(agencyOrgId: string, clientId: string, agentId: string, isActive: boolean) {
    await this.assertOwns(agencyOrgId, clientId)
    return this.agents.toggle(agentId, clientId, isActive)
  }

  async testClientAgent(agencyOrgId: string, clientId: string, agentId: string, message: string, history: any[] = []) {
    await this.assertOwns(agencyOrgId, clientId)
    return this.agents.runAgent(agentId, clientId, message, history)
  }

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
    const source = await this.kb.addSource(kbId, clientId, { ...dto, sizeBytes, status: 'pending' })
    // Chunk + embed (fetches the URL for url-type sources). Async — status moves
    // pending → processing → ready/failed, visible in the storage/source list.
    if (source?.id) this.rag.indexSource(source.id).catch(() => {})
    return source
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

  // ── Owner control: global overview + logs (P8) ─────────────────────────────
  async ownerOverview(agencyOrgId: string) {
    const clients = await this.prisma.organization.findMany({
      where: { parentOrgId: agencyOrgId },
      select: {
        id: true, name: true, logo: true, industry: true, isActive: true,
        agencyBalance: true, agencyStatus: true, agencyMonthlyRev: true, lowBalanceThreshold: true,
        _count: { select: { contacts: true, aiAgents: true, knowledgeBases: true, workflows: true, channels: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    const rows = clients.map(c => ({
      id: c.id, name: c.name, logo: c.logo, industry: c.industry, isActive: c.isActive,
      balance: c.agencyBalance, status: c.agencyStatus, monthlyRev: c.agencyMonthlyRev,
      lowBalance: c.agencyBalance <= (c.lowBalanceThreshold ?? 0),
      contacts: c._count.contacts, agents: c._count.aiAgents,
      knowledgeBases: c._count.knowledgeBases, automations: c._count.workflows, channels: c._count.channels,
    }))
    return {
      totals: {
        clients: rows.length,
        active: rows.filter(r => r.isActive).length,
        wallet: +rows.reduce((s, r) => s + (r.balance || 0), 0).toFixed(2),
        monthlyRev: +rows.reduce((s, r) => s + (r.monthlyRev || 0), 0).toFixed(2),
        agents: rows.reduce((s, r) => s + r.agents, 0),
        automations: rows.reduce((s, r) => s + r.automations, 0),
        lowBalance: rows.filter(r => r.isActive && r.lowBalance).length,
      },
      clients: rows,
    }
  }

  async ownerAuditLogs(agencyOrgId: string) {
    const clientIds = (await this.prisma.organization.findMany({ where: { parentOrgId: agencyOrgId }, select: { id: true } })).map(c => c.id)
    return this.prisma.auditLog.findMany({
      where: { orgId: { in: [agencyOrgId, ...clientIds] } },
      select: { id: true, orgId: true, action: true, resource: true, resourceId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 40,
    })
  }

  async setClientActive(agencyOrgId: string, clientId: string, isActive: boolean) {
    await this.assertOwns(agencyOrgId, clientId)
    await this.prisma.organization.update({ where: { id: clientId }, data: { isActive } })
    return { id: clientId, isActive }
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

    // Auto-provision the standard package so the client is ready to configure:
    // a Knowledge Brain + the two agents the setup fee covers (Receptionist +
    // Analyzer). Left inactive until the owner trains the brain & connects a
    // channel. Non-fatal — the client is created regardless.
    try {
      const kb = await this.prisma.knowledgeBase.create({
        data: { orgId: client.id, name: 'Business Knowledge', description: "Train on the client's business — website, documents, FAQs, price lists." },
      })
      await this.prisma.aIAgent.createMany({
        data: [
          { orgId: client.id, name: 'AI Receptionist', role: 'receptionist', knowledgeBaseId: kb.id, isActive: false,
            objective: 'Greet customers, answer questions, qualify leads and book appointments 24/7 in Arabic & English.',
            channels: [], allowedActions: [] },
          { orgId: client.id, name: 'AI Analyzer', role: 'analyzer', knowledgeBaseId: kb.id, isActive: false,
            objective: 'Analyze conversations for sentiment, intent and lead score; flag chats that need a human.',
            channels: [], allowedActions: [] },
        ],
      })

      // If the client gave a website, pre-load their AI Brain by crawling it
      // (async chunk + embed; status moves pending → ready in the brain view).
      let site = String(dto.website || '').trim()
      if (site && !/^https?:\/\//i.test(site)) site = 'https://' + site
      if (/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(site)) {
        const src = await this.prisma.knowledgeSource.create({
          data: { knowledgeBaseId: kb.id, type: 'url', name: 'Website', url: site, status: 'pending' },
        })
        this.rag.indexSource(src.id).catch(() => {})
      }
    } catch {
      // non-fatal: the client is created even if default provisioning fails
    }

    return { id: client.id, name: client.name }
  }

  // Provision a client-portal login (role CLIENT) scoped to the client org.
  // Returns the password once so the owner can hand it to the client.
  async createClientPortalUser(agencyOrgId: string, clientId: string, dto: { email: string; name?: string; password?: string }) {
    await this.assertOwns(agencyOrgId, clientId)
    const email = String(dto?.email || '').trim().toLowerCase()
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new BadRequestException('A valid email is required')
    const exists = await this.prisma.user.findUnique({ where: { email } })
    if (exists) throw new BadRequestException('A user with that email already exists')

    const bcrypt = require('bcryptjs')
    const password = String(dto.password || '').trim() || Math.random().toString(36).slice(-4) + 'A' + Math.random().toString(36).slice(-4) + '!'
    const hash = await bcrypt.hash(password, 12)
    const client = await this.prisma.organization.findUnique({ where: { id: clientId }, select: { name: true } })

    const u = await this.prisma.user.create({
      data: {
        orgId: clientId, email, password: hash, role: 'CLIENT' as any, isActive: true,
        name: dto.name?.trim() || `${client?.name || 'Client'} Portal`,
      },
      select: { id: true, email: true, name: true },
    })
    return { id: u.id, email: u.email, name: u.name, password, portalUrl: 'https://www.hayyaai.com/login' }
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
    return this.walletAdjust(clientId, 'credit', Math.abs(amount), 'Wallet top-up')
  }

  // ── Wallet ledger + billing/profit (agency-scoped) ─────────────────────────
  private async walletAdjust(clientId: string, type: 'credit' | 'debit', amount: number, description: string, metadata?: any) {
    const client = await this.prisma.organization.findUnique({ where: { id: clientId }, select: { agencyBalance: true } })
    const balanceAfter = +((client?.agencyBalance ?? 0) + (type === 'credit' ? amount : -amount)).toFixed(2)
    await this.prisma.organization.update({ where: { id: clientId }, data: { agencyBalance: balanceAfter } })
    await this.prisma.walletTransaction.create({ data: { orgId: clientId, type, amount: +amount.toFixed(2), description, balanceAfter, metadata: metadata || undefined } })
    return { type, amount: +amount.toFixed(2), balanceAfter }
  }

  // Campaign/usage charge math: provider cost + owner profit% = client charge.
  computeCharge(providerCost: number, profitPercent: number) {
    const cost = Math.max(0, Number(providerCost) || 0)
    const profit = +(cost * (Math.max(0, Number(profitPercent) || 0) / 100)).toFixed(2)
    const clientCharge = +(cost + profit).toFixed(2)
    return { providerCost: cost, profitPercent: Number(profitPercent) || 0, profit, clientCharge }
  }

  // Debit a client's wallet for a campaign/usage (applies the profit markup).
  async chargeClient(agencyOrgId: string, clientId: string, providerCost: number, description: string) {
    await this.assertOwns(agencyOrgId, clientId)
    const org = await this.prisma.organization.findUnique({ where: { id: clientId }, select: { profitPercent: true } })
    const calc = this.computeCharge(providerCost, org?.profitPercent ?? 0)
    const res = await this.walletAdjust(clientId, 'debit', calc.clientCharge, description || 'Usage charge', { providerCost: calc.providerCost, profit: calc.profit })
    return { ...calc, ...res }
  }

  async setLowBalanceThreshold(agencyOrgId: string, clientId: string, threshold: number) {
    await this.assertOwns(agencyOrgId, clientId)
    await this.prisma.organization.update({ where: { id: clientId }, data: { lowBalanceThreshold: Math.max(0, Number(threshold) || 0) } })
    return { lowBalanceThreshold: Math.max(0, Number(threshold) || 0) }
  }

  async clientBilling(agencyOrgId: string, clientId: string) {
    await this.assertOwns(agencyOrgId, clientId)
    const org = await this.prisma.organization.findUnique({
      where: { id: clientId },
      select: { agencyBalance: true, lowBalanceThreshold: true, profitPercent: true, paymentResponsibility: true, campaignBilling: true },
    })
    const transactions = await this.prisma.walletTransaction.findMany({
      where: { orgId: clientId }, orderBy: { createdAt: 'desc' }, take: 25,
    })
    const balance = org?.agencyBalance ?? 0
    const threshold = org?.lowBalanceThreshold ?? 0
    return {
      balance, lowBalanceThreshold: threshold, lowBalance: balance <= threshold,
      profitPercent: org?.profitPercent ?? 0, paymentResponsibility: org?.paymentResponsibility,
      campaignBilling: org?.campaignBilling, transactions,
    }
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
