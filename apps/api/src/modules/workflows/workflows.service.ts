import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { AIService } from '../ai/ai.service'

const WF_TRIGGERS = ['new_contact', 'keyword', 'status_changed', 'tag_added', 'time_based']
const WF_ACTIONS = ['send_whatsapp', 'send_email', 'add_tag', 'remove_tag', 'update_contact', 'create_activity', 'assign_to', 'wait', 'stop']

@Injectable()
export class WorkflowsService {
  constructor(private prisma: PrismaService, private ai: AIService) {}

  // Natural-language → workflow JSON. The owner describes the automation in plain
  // words and the AI returns a valid {name,trigger,conditions,actions} to preview.
  async generateFromDescription(orgId: string, description: string) {
    if (!description?.trim()) throw new BadRequestException('Describe the automation in a sentence.')
    const sys = [
      'You convert a plain-language automation request into a JSON workflow for a CRM.',
      'Output ONLY valid minified JSON — no markdown, no commentary — with this shape:',
      '{"name":string,"trigger":string,"conditions":object,"actions":array}',
      `trigger is one of: ${WF_TRIGGERS.join(', ')}.`,
      'conditions: keyword→{"keyword":"word"}; status_changed→{"status":"NEW|CONTACTED|QUALIFYING|QUALIFIED|NEGOTIATION|WON|LOST"}; tag_added→{"tag":"name"}; new_contact/time_based→{}.',
      'Allowed action objects:',
      '{"type":"send_whatsapp","message":"text, use {{name}} for the lead name"}',
      '{"type":"send_email","subject":"...","message":"..."}',
      '{"type":"add_tag","tag":"name"} / {"type":"remove_tag","tag":"name"}',
      '{"type":"update_contact","status":"WON"}',
      '{"type":"create_activity","title":"internal note"}',
      '{"type":"wait","seconds":86400} for delays (e.g. "after 1 day" = 86400).',
      'Keep it minimal and correct. If a delay is implied, add a wait step before the message.',
    ].join('\n')
    const raw = await this.ai.complete(
      [{ role: 'system', content: sys }, { role: 'user', content: description.trim() }],
      { maxTokens: 500, temperature: 0.2, orgId, module: 'workflow', action: 'generate' },
    )
    let parsed: any
    try { const m = raw.match(/\{[\s\S]*\}/); parsed = JSON.parse(m ? m[0] : raw) } catch { throw new BadRequestException('Could not understand that — try rephrasing the automation.') }
    const trigger = WF_TRIGGERS.includes(parsed?.trigger) ? parsed.trigger : 'new_contact'
    let actions = Array.isArray(parsed?.actions) ? parsed.actions.filter((a: any) => a && WF_ACTIONS.includes(a.type)) : []
    if (!actions.length) actions = [{ type: 'create_activity', title: 'Review this lead' }]
    return {
      name: String(parsed?.name || 'AI automation').slice(0, 80),
      trigger,
      conditions: parsed?.conditions && typeof parsed.conditions === 'object' ? parsed.conditions : {},
      actions,
    }
  }

  findAll(orgId: string) {
    return this.prisma.workflow.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string, orgId: string) {
    const wf = await this.prisma.workflow.findFirst({ where: { id, orgId } })
    if (!wf) throw new NotFoundException('Workflow not found')
    return wf
  }

  create(orgId: string, dto: { name: string; trigger: string; conditions?: any; actions: any; nodes?: any }) {
    return this.prisma.workflow.create({
      data: {
        orgId,
        name: dto.name,
        trigger: dto.trigger,
        conditions: dto.conditions,
        actions: dto.actions,
      },
    })
  }

  async update(id: string, orgId: string, dto: Partial<{ name: string; trigger: string; conditions: any; actions: any; isActive: boolean }>) {
    await this.findOne(id, orgId)
    return this.prisma.workflow.update({ where: { id }, data: dto })
  }

  async toggle(id: string, orgId: string, isActive: boolean) {
    await this.findOne(id, orgId)
    return this.prisma.workflow.update({ where: { id }, data: { isActive } })
  }

  async remove(id: string, orgId: string) {
    await this.findOne(id, orgId)
    return this.prisma.workflow.delete({ where: { id } })
  }

  async incrementRun(id: string) {
    return this.prisma.workflow.update({
      where: { id },
      data: { runCount: { increment: 1 } },
    })
  }
}
