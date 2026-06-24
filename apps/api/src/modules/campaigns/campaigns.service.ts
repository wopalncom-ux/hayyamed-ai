import { Injectable, Logger, NotFoundException, BadRequestException, Optional } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { WhatsAppService } from '../whatsapp/whatsapp.service'
import { AuditService } from '../audit/audit.service'
import { RealtimeGateway } from '../../common/gateways/websocket.gateway'

const SEND_DELAY_MS = 120 // ~8 msgs/sec — well under Meta's 80/sec tier-1 limit
const BATCH_SIZE = 50

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name)

  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsAppService,
    private audit: AuditService,
    @Optional() private gateway: RealtimeGateway,
  ) {}

  // ─── LIST / CRUD ─────────────────────────────────────────────────────────

  async findAll(orgId: string, query: { status?: string; page?: number; limit?: number } = {}) {
    const { status, page = 1, limit = 20 } = query
    const where: any = { orgId }
    if (status) where.status = status

    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
        include: { channel: { select: { name: true, type: true } } },
      }),
      this.prisma.campaign.count({ where }),
    ])
    return { data, total, page, limit }
  }

  async findOne(id: string, orgId: string) {
    return this.prisma.campaign.findFirst({
      where: { id, orgId },
      include: { channel: true },
    })
  }

  async create(orgId: string, dto: any) {
    return this.prisma.campaign.create({ data: { ...dto, orgId } })
  }

  async update(id: string, orgId: string, dto: any) {
    return this.prisma.campaign.update({ where: { id }, data: dto })
  }

  async remove(id: string, orgId: string) {
    return this.prisma.campaign.deleteMany({ where: { id, orgId } })
  }

  async getStats(orgId: string) {
    const [total, active, completed, draft, scheduled] = await Promise.all([
      this.prisma.campaign.count({ where: { orgId } }),
      this.prisma.campaign.count({ where: { orgId, status: 'RUNNING' } }),
      this.prisma.campaign.count({ where: { orgId, status: 'COMPLETED' } }),
      this.prisma.campaign.count({ where: { orgId, status: 'DRAFT' } }),
      this.prisma.campaign.count({ where: { orgId, status: 'SCHEDULED' } }),
    ])
    return { total, active, completed, draft, scheduled }
  }

  // ─── CONTACT MANAGEMENT ──────────────────────────────────────────────────

  async addContacts(campaignId: string, orgId: string, contactIds: string[]) {
    await this.assertDraft(campaignId, orgId)

    const contacts = await this.prisma.contact.findMany({
      where: { id: { in: contactIds }, orgId, phone: { not: null } },
      select: { id: true },
    })

    const rows = contacts.map(c => ({ campaignId, contactId: c.id, status: 'pending' }))
    await this.prisma.campaignContact.createMany({ data: rows, skipDuplicates: true })

    const count = await this.prisma.campaignContact.count({ where: { campaignId } })
    await this.prisma.campaign.update({ where: { id: campaignId }, data: { totalRecipients: count } })

    return { added: contacts.length, total: count }
  }

  async addContactsByFilter(campaignId: string, orgId: string, filter: {
    status?: string; source?: string; tag?: string; search?: string; all?: boolean
  }) {
    await this.assertDraft(campaignId, orgId)

    const where: any = { orgId, phone: { not: null } }
    if (filter.status) where.status = filter.status
    if (filter.source) where.source = filter.source
    if (filter.search) where.name = { contains: filter.search, mode: 'insensitive' }

    const contacts = await this.prisma.contact.findMany({ where, select: { id: true } })
    const rows = contacts.map(c => ({ campaignId, contactId: c.id, status: 'pending' }))
    await this.prisma.campaignContact.createMany({ data: rows, skipDuplicates: true })

    const count = await this.prisma.campaignContact.count({ where: { campaignId } })
    await this.prisma.campaign.update({ where: { id: campaignId }, data: { totalRecipients: count } })

    return { added: contacts.length, total: count }
  }

  async removeContact(campaignId: string, orgId: string, contactId: string) {
    await this.assertDraft(campaignId, orgId)
    await this.prisma.campaignContact.deleteMany({ where: { campaignId, contactId } })
    const count = await this.prisma.campaignContact.count({ where: { campaignId } })
    await this.prisma.campaign.update({ where: { id: campaignId }, data: { totalRecipients: count } })
    return { total: count }
  }

  async getContacts(campaignId: string, orgId: string, page = 1, limit = 50) {
    const campaign = await this.assertExists(campaignId, orgId)
    const [data, total] = await Promise.all([
      this.prisma.campaignContact.findMany({
        where: { campaignId },
        include: { contact: { select: { id: true, name: true, phone: true, status: true } } },
        orderBy: { sentAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.campaignContact.count({ where: { campaignId } }),
    ])
    return { data, total, page, limit }
  }

  // ─── SCHEDULING ──────────────────────────────────────────────────────────

  async schedule(campaignId: string, orgId: string, scheduledAt: string) {
    const campaign = await this.assertDraft(campaignId, orgId)
    const dt = new Date(scheduledAt)
    if (dt <= new Date()) throw new BadRequestException('Scheduled time must be in the future')

    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'SCHEDULED', scheduledAt: dt },
    })
    this.audit.log({ orgId, action: 'campaign.schedule', category: 'campaign', resource: 'campaign', resourceId: campaignId, after: { scheduledAt } })
    return { scheduled: true, scheduledAt: dt }
  }

  // ─── EXECUTION ENGINE ────────────────────────────────────────────────────

  async launch(campaignId: string, orgId: string): Promise<{ launched: boolean; totalRecipients: number }> {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, orgId },
      include: { channel: true },
    })
    if (!campaign) throw new NotFoundException('Campaign not found')
    if (campaign.status === 'RUNNING') throw new BadRequestException('Campaign is already running')
    if (campaign.status === 'COMPLETED') throw new BadRequestException('Campaign already completed')

    const pendingCount = await this.prisma.campaignContact.count({ where: { campaignId, status: 'pending' } })
    if (pendingCount === 0) throw new BadRequestException('No recipients. Add contacts before launching.')

    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'RUNNING', sentAt: new Date() },
    })

    this.audit.log({ orgId, action: 'campaign.launch', category: 'campaign', resource: 'campaign', resourceId: campaignId })

    // Run async — don't block the HTTP response
    this.executeCampaign(campaignId, orgId, campaign.message).catch(err => {
      this.logger.error(`Campaign ${campaignId} execution failed: ${err.message}`)
    })

    return { launched: true, totalRecipients: pendingCount }
  }

  async pause(campaignId: string, orgId: string) {
    const campaign = await this.prisma.campaign.findFirst({ where: { id: campaignId, orgId } })
    if (!campaign) throw new NotFoundException('Campaign not found')
    if (campaign.status !== 'RUNNING') throw new BadRequestException('Campaign is not running')

    await this.prisma.campaign.update({ where: { id: campaignId }, data: { status: 'PAUSED' } })
    this.audit.log({ orgId, action: 'campaign.pause', category: 'campaign', resource: 'campaign', resourceId: campaignId })
    return { paused: true }
  }

  async resume(campaignId: string, orgId: string) {
    const campaign = await this.prisma.campaign.findFirst({ where: { id: campaignId, orgId } })
    if (!campaign) throw new NotFoundException('Campaign not found')
    if (campaign.status !== 'PAUSED') throw new BadRequestException('Campaign is not paused')

    await this.prisma.campaign.update({ where: { id: campaignId }, data: { status: 'RUNNING' } })
    this.audit.log({ orgId, action: 'campaign.resume', category: 'campaign', resource: 'campaign', resourceId: campaignId })

    this.executeCampaign(campaignId, orgId, campaign.message).catch(err => {
      this.logger.error(`Campaign ${campaignId} resume failed: ${err.message}`)
    })
    return { resumed: true }
  }

  // ─── CRON: process scheduled campaigns ───────────────────────────────────

  async processDueCampaigns() {
    const due = await this.prisma.campaign.findMany({
      where: { status: 'SCHEDULED', scheduledAt: { lte: new Date() } },
    })
    this.logger.log(`Processing ${due.length} scheduled campaigns`)
    for (const campaign of due) {
      await this.launch(campaign.id, campaign.orgId).catch(err =>
        this.logger.error(`Failed to launch scheduled campaign ${campaign.id}: ${err.message}`)
      )
    }
    return { processed: due.length }
  }

  // ─── ANALYTICS ───────────────────────────────────────────────────────────

  async getAnalytics(campaignId: string, orgId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, orgId },
      include: { channel: { select: { name: true } } },
    })
    if (!campaign) throw new NotFoundException('Campaign not found')

    const statusCounts = await this.prisma.campaignContact.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: true,
    })

    const byStatus: Record<string, number> = {}
    statusCounts.forEach(s => { byStatus[s.status] = s._count })

    const total = campaign.totalRecipients || 0
    const sent = campaign.sent || 0
    const delivered = campaign.delivered || 0
    const read = campaign.read || 0

    return {
      campaign: {
        id: campaign.id, name: campaign.name, status: campaign.status,
        message: campaign.message, scheduledAt: campaign.scheduledAt,
        sentAt: campaign.sentAt, channelName: campaign.channel?.name,
      },
      stats: {
        total, sent, delivered, read,
        deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100) : 0,
        readRate: delivered > 0 ? Math.round((read / delivered) * 100) : 0,
        pendingCount: byStatus.pending || 0,
        sentCount: byStatus.sent || 0,
        failedCount: byStatus.failed || 0,
      },
    }
  }

  // ─── PRIVATE ENGINE ───────────────────────────────────────────────────────

  private async executeCampaign(campaignId: string, orgId: string, message: string) {
    let sentTotal = 0
    let failedTotal = 0
    const total = await this.prisma.campaignContact.count({ where: { campaignId } })

    while (true) {
      // Re-check campaign status in case it was paused
      const status = await this.prisma.campaign.findUnique({
        where: { id: campaignId }, select: { status: true },
      })
      if (!status || status.status === 'PAUSED' || status.status === 'COMPLETED' || status.status === 'FAILED') {
        this.logger.log(`Campaign ${campaignId} stopped: status=${status?.status}`)
        break
      }

      const batch = await this.prisma.campaignContact.findMany({
        where: { campaignId, status: 'pending' },
        include: { contact: { select: { phone: true, name: true } } },
        take: BATCH_SIZE,
      })

      if (batch.length === 0) {
        // All sent — mark complete
        await this.prisma.campaign.update({
          where: { id: campaignId },
          data: { status: 'COMPLETED' },
        })
        this.gateway?.emitCampaignProgress(orgId, campaignId, { sent: sentTotal, failed: failedTotal, total, status: 'COMPLETED' })
        this.logger.log(`Campaign ${campaignId} completed — ${sentTotal}/${total} sent`)
        break
      }

      for (const cc of batch) {
        // Re-check pause between each message
        const current = await this.prisma.campaign.findUnique({ where: { id: campaignId }, select: { status: true } })
        if (current?.status !== 'RUNNING') break

        if (!cc.contact.phone) {
          await this.prisma.campaignContact.update({ where: { id: cc.id }, data: { status: 'failed' } })
          failedTotal++
          continue
        }

        try {
          await this.whatsapp.sendFromOrg(orgId, cc.contact.phone, message)

          await this.prisma.campaignContact.update({
            where: { id: cc.id },
            data: { status: 'sent', sentAt: new Date() },
          })
          await this.prisma.campaign.update({
            where: { id: campaignId },
            data: { sent: { increment: 1 } },
          })
          sentTotal++
        } catch (err: any) {
          this.logger.warn(`Failed to send to ${cc.contact.phone}: ${err.message}`)
          await this.prisma.campaignContact.update({
            where: { id: cc.id },
            data: { status: 'failed' },
          })
          failedTotal++
        }

        // Emit progress every 10 messages
        if ((sentTotal + failedTotal) % 10 === 0) {
          this.gateway?.emitCampaignProgress(orgId, campaignId, { sent: sentTotal, failed: failedTotal, total, status: 'RUNNING' })
        }

        await new Promise(r => setTimeout(r, SEND_DELAY_MS))
      }
    }
  }

  private async assertExists(id: string, orgId: string) {
    const campaign = await this.prisma.campaign.findFirst({ where: { id, orgId } })
    if (!campaign) throw new NotFoundException('Campaign not found')
    return campaign
  }

  private async assertDraft(id: string, orgId: string) {
    const campaign = await this.assertExists(id, orgId)
    if (campaign.status === 'RUNNING') throw new BadRequestException('Cannot modify a running campaign')
    if (campaign.status === 'COMPLETED') throw new BadRequestException('Campaign already completed')
    return campaign
  }
}
