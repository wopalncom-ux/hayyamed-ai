import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { WhatsAppService } from '../whatsapp/whatsapp.service'
import { EmailService } from '../email/email.service'
import { AuditService } from '../audit/audit.service'

// ─── Action Types ─────────────────────────────────────────────────────────────
// All supported step types in a workflow's actions[] array:
//
//  { type: 'send_whatsapp', message: 'Hello {{name}}!' }
//  { type: 'send_email',    subject: '...', body: '...' }
//  { type: 'update_contact', field: 'status', value: 'QUALIFIED' }
//  { type: 'add_tag',       tag: 'vip' }
//  { type: 'remove_tag',    tag: 'cold' }
//  { type: 'wait',          seconds: 86400 }   // resumes via CRON
//  { type: 'assign_to',     userId: 'uuid' }   // assigns the contact's latest conversation
//  { type: 'create_activity', title: '...' }
//  { type: 'stop' }                            // end the workflow

@Injectable()
export class WorkflowEngineService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowEngineService.name)
  private pendingTimer?: NodeJS.Timeout
  private pendingRunning = false

  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsAppService,
    private email: EmailService,
    private audit: AuditService,
  ) {}

  // In-process scheduler: resume due time-delayed (wait-step) automations every
  // 2 minutes. Runs while a Cloud Run container is warm; for guaranteed delivery
  // also point a Cloud Scheduler job at POST /workflows/cron/process-pending.
  onModuleInit() {
    this.pendingTimer = setInterval(async () => {
      if (this.pendingRunning) return
      this.pendingRunning = true
      try { await this.processPending() } catch (e: any) { this.logger.warn(`scheduler tick failed: ${e?.message}`) } finally { this.pendingRunning = false }
    }, 2 * 60 * 1000)
    if (this.pendingTimer.unref) this.pendingTimer.unref()
  }

  // ─── Fire a trigger for all active workflows in an org ─────────────────────

  async fire(orgId: string, trigger: string, contactId?: string, extra: Record<string, any> = {}) {
    const workflows = await this.prisma.workflow.findMany({
      where: { orgId, trigger, isActive: true },
    })

    for (const wf of workflows) {
      if (!this.matchesConditions(wf.conditions as any, extra)) continue
      await this.startRun(wf, orgId, contactId, extra)
    }
  }

  // ─── Start a new run from step 0 ───────────────────────────────────────────

  private async startRun(workflow: any, orgId: string, contactId?: string, extra: Record<string, any> = {}) {
    let contact: any = null
    if (contactId) {
      contact = await this.prisma.contact.findUnique({ where: { id: contactId } })
    }
    const context = { contact, extra }
    const run = await this.prisma.workflowRun.create({
      data: { orgId, workflowId: workflow.id, contactId: contactId || null, status: 'running', currentStep: 0, context },
    })
    await this.prisma.workflow.update({ where: { id: workflow.id }, data: { runCount: { increment: 1 } } })
    await this.executeFromStep(run.id, workflow, context, 0)
  }

  // ─── Execute steps starting at `stepIndex` ─────────────────────────────────

  async executeFromStep(runId: string, workflow: any, context: any, stepIndex: number) {
    const actions: any[] = Array.isArray(workflow.actions) ? workflow.actions : []

    for (let i = stepIndex; i < actions.length; i++) {
      const step = actions[i]

      if (step.type === 'wait') {
        const seconds = step.seconds || step.duration || 3600
        const nextAt = new Date(Date.now() + seconds * 1000)
        await this.prisma.workflowRun.update({
          where: { id: runId },
          data: { currentStep: i + 1, nextStepAt: nextAt, context },
        })
        return // CRON will resume
      }

      if (step.type === 'stop') {
        await this.prisma.workflowRun.update({ where: { id: runId }, data: { status: 'completed', nextStepAt: null } })
        return
      }

      try {
        await this.executeStep(step, context, workflow.orgId)
      } catch (err: any) {
        this.logger.error(`WorkflowRun ${runId} step ${i} failed: ${err.message}`)
        await this.prisma.workflowRun.update({ where: { id: runId }, data: { status: 'failed', error: err.message, nextStepAt: null } })
        return
      }

      // Refresh contact after mutations
      if (['update_contact', 'add_tag', 'remove_tag'].includes(step.type) && context.contact?.id) {
        const updated = await this.prisma.contact.findUnique({ where: { id: context.contact.id } })
        context = { ...context, contact: updated }
      }
    }

    await this.prisma.workflowRun.update({ where: { id: runId }, data: { status: 'completed', nextStepAt: null, context } })
  }

  // ─── CRON: process runs that have hit their wait deadline ──────────────────

  async processPending() {
    const pending = await this.prisma.workflowRun.findMany({
      where: { status: 'running', nextStepAt: { lte: new Date() } },
      include: { workflow: true },
    })

    this.logger.log(`Processing ${pending.length} pending workflow runs`)
    for (const run of pending) {
      const context = run.context as any || {}
      // Refresh contact so we work on current data, not snapshot
      if (run.contactId) {
        const fresh = await this.prisma.contact.findUnique({ where: { id: run.contactId } })
        context.contact = fresh
      }
      await this.prisma.workflowRun.update({ where: { id: run.id }, data: { nextStepAt: null } })
      await this.executeFromStep(run.id, run.workflow, context, run.currentStep)
    }

    return { processed: pending.length }
  }

  // ─── Get workflow run stats ─────────────────────────────────────────────────

  async getStats(orgId: string) {
    const [total, running, completed, failed] = await Promise.all([
      this.prisma.workflowRun.count({ where: { orgId } }),
      this.prisma.workflowRun.count({ where: { orgId, status: 'running' } }),
      this.prisma.workflowRun.count({ where: { orgId, status: 'completed' } }),
      this.prisma.workflowRun.count({ where: { orgId, status: 'failed' } }),
    ])
    return { total, running, completed, failed }
  }

  async getRuns(orgId: string, workflowId?: string, page = 1, limit = 50) {
    const where: any = { orgId }
    if (workflowId) where.workflowId = workflowId
    const [data, total] = await Promise.all([
      this.prisma.workflowRun.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
        select: { id: true, status: true, contactId: true, currentStep: true, error: true, nextStepAt: true, createdAt: true, workflow: { select: { name: true } } },
      }),
      this.prisma.workflowRun.count({ where }),
    ])
    return { data, total, page, limit }
  }

  // ─── Individual step executors ─────────────────────────────────────────────

  private async executeStep(step: any, context: any, orgId: string) {
    const contact = context.contact

    switch (step.type) {

      case 'send_whatsapp': {
        if (!contact?.phone) return
        const msg = this.interpolate(step.message, context)
        await this.whatsapp.sendFromOrg(orgId, contact.phone, msg)
        this.audit.log({ orgId, action: 'workflow.send_whatsapp', category: 'workflow', resource: 'contact', resourceId: contact?.id })
        break
      }

      case 'send_email': {
        if (!contact?.email) return
        const subject = this.interpolate(step.subject || 'Message from us', context)
        const body = this.interpolate(step.body || '', context)
        await this.email.sendRaw(contact.email, subject, body)
        break
      }

      case 'update_contact': {
        if (!contact?.id) return
        const field = step.field
        const value = this.interpolate(String(step.value ?? ''), context)
        if (!['status', 'stage', 'source', 'city', 'country', 'notes', 'language', 'score'].includes(field)) break
        await this.prisma.contact.update({ where: { id: contact.id }, data: { [field]: value } })
        break
      }

      case 'add_tag': {
        if (!contact?.id || !step.tag) return
        const tag = this.interpolate(step.tag, context)
        const existing = (contact.tags as string[]) || []
        if (!existing.includes(tag)) {
          await this.prisma.contact.update({ where: { id: contact.id }, data: { tags: [...existing, tag] } })
        }
        break
      }

      case 'remove_tag': {
        if (!contact?.id || !step.tag) return
        const existing = (contact.tags as string[]) || []
        await this.prisma.contact.update({
          where: { id: contact.id },
          data: { tags: existing.filter((t: string) => t !== step.tag) },
        })
        break
      }

      case 'create_activity': {
        if (!contact?.id) return
        await this.prisma.activity.create({
          data: {
            orgId, contactId: contact.id,
            type: 'workflow',
            data: { title: this.interpolate(step.title || 'Workflow step executed', context) },
          },
        })
        break
      }

      case 'assign_to': {
        if (!contact?.id || !step.userId) return
        // Verify the assignee belongs to this org, then assign the contact's
        // most recent conversation to them.
        const member = await this.prisma.user.findFirst({ where: { id: step.userId, orgId }, select: { id: true } })
        if (!member) break
        const conv = await this.prisma.conversation.findFirst({
          where: { orgId, contactId: contact.id },
          orderBy: { lastMsgAt: 'desc' },
          select: { id: true },
        })
        if (conv) {
          await this.prisma.conversation.update({ where: { id: conv.id }, data: { assigneeId: step.userId } })
          this.audit.log({ orgId, action: 'workflow.assign_to', category: 'workflow', resource: 'conversation', resourceId: conv.id })
        }
        break
      }

      default:
        this.logger.warn(`Unknown workflow step type: ${step.type}`)
    }
  }

  // ─── Template interpolation: {{name}}, {{phone}}, {{email}} etc. ───────────

  private interpolate(template: string, context: any): string {
    const contact = context?.contact || {}
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return String(contact[key] ?? context?.extra?.[key] ?? '')
    })
  }

  // ─── Check workflow conditions against context ──────────────────────────────

  private matchesConditions(conditions: any, extra: Record<string, any>): boolean {
    if (!conditions || typeof conditions !== 'object') return true
    if (conditions.source && extra.source && conditions.source !== extra.source) return false
    if (conditions.status && extra.status && conditions.status !== extra.status) return false
    if (conditions.tag) {
      // tag_added passes the newly-added tag in extra.tag; other triggers match
      // against the contact's current tags.
      if (extra.tag != null) {
        if (extra.tag !== conditions.tag) return false
      } else if (Array.isArray(extra.tags)) {
        if (!extra.tags.includes(conditions.tag)) return false
      } else return false
    }
    // Keyword trigger: the inbound message text must contain the configured keyword.
    if (conditions.keyword) {
      const text = String(extra.text || '').toLowerCase()
      if (!text.includes(String(conditions.keyword).toLowerCase())) return false
    }
    return true
  }
}
