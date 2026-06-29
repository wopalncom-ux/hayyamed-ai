import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import {
  CLIENT_ROLES, CLIENT_PERMISSIONS, ROLE_DEFAULT_PERMISSIONS,
  effectivePermissions, normalizeClientRole, hasPermission,
} from '../../common/util/permissions.util'

const bcrypt = require('bcryptjs')
const CLIENT = 'CLIENT' as any
const validPerms = (arr: any) => Array.isArray(arr) ? arr.filter((p: any) => (CLIENT_PERMISSIONS as readonly string[]).includes(p)) : undefined

@Injectable()
export class PortalService {
  constructor(private prisma: PrismaService) {}

  private async actor(userId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, orgId: true, clientRole: true, permissions: true } })
    if (!u) throw new ForbiddenException('Not a portal member')
    return u
  }
  private async assertPerm(userId: string, perm: any) {
    if (!hasPermission(await this.actor(userId), perm)) throw new ForbiddenException('You do not have permission for this action')
  }

  // The logged-in member's identity + effective permissions (drives UI gating).
  async me(userId: string) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, clientRole: true, permissions: true, org: { select: { name: true, logo: true, maxSeats: true, modules: true } } },
    })
    if (!u) throw new ForbiddenException()
    return {
      id: u.id, name: u.name, email: u.email,
      clientRole: normalizeClientRole(u.clientRole),
      permissions: effectivePermissions(u),
      org: { name: u.org?.name, logo: u.org?.logo, maxSeats: u.org?.maxSeats ?? 5, modules: u.org?.modules || {} },
    }
  }

  catalog() {
    return { roles: CLIENT_ROLES, permissions: CLIENT_PERMISSIONS, defaults: ROLE_DEFAULT_PERMISSIONS }
  }

  async listTeam(orgId: string) {
    const rows = await this.prisma.user.findMany({
      where: { orgId, role: CLIENT },
      select: { id: true, name: true, email: true, clientRole: true, permissions: true, isActive: true, lastSeen: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
    return rows.map(m => ({ ...m, clientRole: normalizeClientRole(m.clientRole), permissions: effectivePermissions(m) }))
  }

  async invite(actorId: string, orgId: string, dto: { email: string; name?: string; clientRole?: string; password?: string; permissions?: string[] }) {
    await this.assertPerm(actorId, 'manage_team')
    const email = String(dto?.email || '').trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new BadRequestException('A valid email is required')
    if (await this.prisma.user.findUnique({ where: { email } })) throw new BadRequestException('A user with that email already exists')

    const org = await this.prisma.organization.findUnique({ where: { id: orgId }, select: { maxSeats: true } })
    const cap = org?.maxSeats ?? 5
    const count = await this.prisma.user.count({ where: { orgId, role: CLIENT } })
    if (count >= cap) throw new BadRequestException(`Team seat limit reached (${cap}). Ask your provider to add more seats.`)

    const password = String(dto.password || '').trim() || Math.random().toString(36).slice(-4) + 'A' + Math.random().toString(36).slice(-3) + '!'
    const hash = await bcrypt.hash(password, 12)
    const u = await this.prisma.user.create({
      data: {
        orgId, email, password: hash, role: CLIENT, isActive: true,
        name: dto.name?.trim() || email.split('@')[0],
        clientRole: normalizeClientRole(dto.clientRole),
        permissions: validPerms(dto.permissions),
      },
      select: { id: true, email: true, name: true, clientRole: true },
    })
    return { ...u, clientRole: normalizeClientRole(u.clientRole), password }
  }

  async update(actorId: string, orgId: string, memberId: string, dto: { clientRole?: string; permissions?: string[]; isActive?: boolean }) {
    await this.assertPerm(actorId, 'manage_team')
    const target = await this.prisma.user.findFirst({ where: { id: memberId, orgId, role: CLIENT } })
    if (!target) throw new NotFoundException('Member not found')
    if (target.id === actorId && dto.isActive === false) throw new BadRequestException("You can't deactivate yourself")

    const data: any = {}
    if (dto.clientRole) data.clientRole = normalizeClientRole(dto.clientRole)
    if (Array.isArray(dto.permissions)) data.permissions = validPerms(dto.permissions)
    if (typeof dto.isActive === 'boolean') data.isActive = dto.isActive

    const u = await this.prisma.user.update({
      where: { id: memberId }, data,
      select: { id: true, name: true, email: true, clientRole: true, permissions: true, isActive: true },
    })
    return { ...u, clientRole: normalizeClientRole(u.clientRole), permissions: effectivePermissions(u) }
  }

  async remove(actorId: string, orgId: string, memberId: string) {
    await this.assertPerm(actorId, 'manage_team')
    if (memberId === actorId) throw new BadRequestException("You can't remove yourself")
    const target = await this.prisma.user.findFirst({ where: { id: memberId, orgId, role: CLIENT } })
    if (!target) throw new NotFoundException('Member not found')
    if (normalizeClientRole(target.clientRole) === 'owner') {
      const owners = await this.prisma.user.count({ where: { orgId, role: CLIENT, clientRole: 'owner' } })
      if (owners <= 1) throw new BadRequestException('Cannot remove the only Client Owner')
    }
    await this.prisma.user.delete({ where: { id: memberId } })
    return { ok: true }
  }
}
