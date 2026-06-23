import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class AIAgentsService {
  constructor(private prisma: PrismaService) {}

  findAll(orgId: string) {
    return this.prisma.aIAgent.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string, orgId: string) {
    const agent = await this.prisma.aIAgent.findFirst({ where: { id, orgId } })
    if (!agent) throw new NotFoundException('Agent not found')
    return agent
  }

  create(orgId: string, dto: any) {
    return this.prisma.aIAgent.create({ data: { ...dto, orgId } })
  }

  async update(id: string, orgId: string, dto: any) {
    await this.findOne(id, orgId)
    return this.prisma.aIAgent.update({ where: { id }, data: dto })
  }

  async remove(id: string, orgId: string) {
    await this.findOne(id, orgId)
    return this.prisma.aIAgent.deleteMany({ where: { id, orgId } })
  }

  async toggle(id: string, orgId: string, isActive: boolean) {
    await this.findOne(id, orgId)
    return this.prisma.aIAgent.update({ where: { id }, data: { isActive } })
  }
}
