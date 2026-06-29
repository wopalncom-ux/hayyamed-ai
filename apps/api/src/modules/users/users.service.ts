import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../../database/prisma.service'
import { EmailService } from '../email/email.service'

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private email: EmailService,
  ) {}

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

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!currentPassword || !newPassword) {
      throw new BadRequestException('Current and new password are required')
    }
    if (newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters')
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    })
    if (!user?.password) throw new UnauthorizedException('User not found')

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) throw new UnauthorizedException('Current password is incorrect')

    const hash = await bcrypt.hash(newPassword, 12)
    await this.prisma.user.update({ where: { id: userId }, data: { password: hash } })

    return { message: 'Password updated successfully' }
  }

  async getOrgSettings(orgId: string) {
    return this.prisma.orgSettings.findUnique({ where: { orgId } })
  }

  async updateOrgSettings(orgId: string, dto: any) {
    // Whitelist real OrgSettings columns so unrelated keys (businessName, waToken…)
    // can't crash the upsert.
    const ALLOWED = ['aiEnabled', 'aiModel', 'autoReply', 'autoReplyMsg', 'language', 'rtlEnabled', 'workingHours', 'emailNotifs', 'pushNotifs', 'leadServices']
    const data: any = {}
    for (const k of ALLOWED) if (k in (dto || {})) data[k] = dto[k]
    if (Array.isArray(data.leadServices)) {
      // Industry-agnostic service tags, cleaned + de-duped + capped.
      data.leadServices = Array.from(new Set(
        data.leadServices.map((s: any) => String(s).trim()).filter(Boolean)
      )).slice(0, 40)
    }
    return this.prisma.orgSettings.upsert({
      where: { orgId },
      update: data,
      create: { orgId, ...data },
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

    const [user, org] = await Promise.all([
      this.prisma.user.create({
        data: { orgId, name: dto.name, email: dto.email, role: dto.role as any, password: hash },
        select: { id: true, name: true, email: true, role: true },
      }),
      this.prisma.organization.findUnique({ where: { id: orgId }, select: { name: true } }),
    ])

    const loginUrl = `${this.config.get('FRONTEND_URL') || 'http://localhost:3000'}/login`
    await this.email.sendInvite(dto.email, { inviterName: 'Admin', orgName: org?.name || 'your team', role: dto.role, acceptUrl: loginUrl })

    return user
  }
}
