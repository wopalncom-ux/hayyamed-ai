import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class WorkflowsService {
  constructor(private prisma: PrismaService) {}

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
