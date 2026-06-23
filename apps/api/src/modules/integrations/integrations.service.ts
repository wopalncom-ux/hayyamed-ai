import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  list(orgId: string) {
    return this.prisma.integration.findMany({
      where: { orgId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, type: true, name: true, status: true, config: true, lastSyncAt: true, updatedAt: true },
    })
  }

  async upsert(orgId: string, type: string, dto: { name: string; credentials: Record<string, string> }) {
    const existing = await this.prisma.integration.findFirst({ where: { orgId, type } })
    if (existing) {
      return this.prisma.integration.update({
        where: { id: existing.id },
        data: { name: dto.name, config: dto.credentials as any, status: 'active', lastSyncAt: new Date() },
      })
    }
    return this.prisma.integration.create({
      data: { orgId, type, name: dto.name, config: dto.credentials as any, status: 'active', lastSyncAt: new Date() },
    })
  }

  async disconnect(orgId: string, type: string) {
    const existing = await this.prisma.integration.findFirst({ where: { orgId, type } })
    if (!existing) return { type, status: 'disconnected' }
    return this.prisma.integration.update({
      where: { id: existing.id },
      data: { status: 'disconnected' },
    })
  }
}
