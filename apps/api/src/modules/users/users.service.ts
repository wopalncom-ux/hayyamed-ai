import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, avatar: true, role: true, orgId: true, lastSeen: true, org: { select: { id: true, name: true, plan: true, settings: true } } },
    })
  }

  async updateMe(userId: string, dto: { name?: string; phone?: string; avatar?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: { id: true, name: true, email: true, phone: true, avatar: true, role: true },
    })
  }

  async getOrgSettings(orgId: string) {
    return this.prisma.orgSettings.findUnique({ where: { orgId } })
  }

  async updateOrgSettings(orgId: string, dto: {
    aiEnabled?: boolean
    aiModel?: string
    autoReply?: boolean
    autoReplyMsg?: string
    language?: string
    workingHours?: any
    emailNotifs?: boolean
    pushNotifs?: boolean
  }) {
    return this.prisma.orgSettings.upsert({
      where: { orgId },
      update: dto,
      create: { orgId, ...dto },
    })
  }

  async getTeam(orgId: string) {
    return this.prisma.user.findMany({
      where: { orgId, isActive: true },
      select: { id: true, name: true, email: true, role: true, lastSeen: true, avatar: true },
      orderBy: { createdAt: 'asc' },
    })
  }

  async inviteTeamMember(orgId: string, dto: { name: string; email: string; role: string }) {
    const bcrypt = require('bcryptjs')
    const tempPassword = Math.random().toString(36).slice(-8)
    const hash = await bcrypt.hash(tempPassword, 10)

    return this.prisma.user.create({
      data: {
        orgId,
        name: dto.name,
        email: dto.email,
        role: dto.role as any,
        password: hash,
      },
      select: { id: true, name: true, email: true, role: true },
    })
  }
}
