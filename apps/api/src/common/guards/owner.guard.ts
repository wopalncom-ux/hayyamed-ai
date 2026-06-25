import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { JwtPayload } from './jwt.guard'

// Platform owner emails always granted master access regardless of stored role.
// Keep in sync with the seed. Comma-separated PLATFORM_OWNER_EMAILS env overrides/extends this.
const HARDCODED_OWNER_EMAILS = ['wopalncom@gmail.com']

/**
 * Guards every `master-admin/*` surface. Runs AFTER the global JwtAuthGuard,
 * so req.user is already populated. Verifies the caller is a true platform owner —
 * role SUPER_ADMIN, or an email on the owner allowlist. Any other authenticated
 * tenant user (default role AGENT) is rejected, closing the cross-tenant data leak.
 */
@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    const jwtUser = req.user as JwtPayload | undefined
    if (!jwtUser?.sub) throw new ForbiddenException('Authentication required')

    const ownerEmails = [
      ...HARDCODED_OWNER_EMAILS,
      ...(process.env.PLATFORM_OWNER_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean),
    ]

    const user = await this.prisma.user.findUnique({
      where: { id: jwtUser.sub },
      select: { role: true, email: true },
    })
    if (!user) throw new ForbiddenException('User not found')

    const isOwner = user.role === 'SUPER_ADMIN' || ownerEmails.includes((user.email || '').toLowerCase())
    if (!isOwner) throw new ForbiddenException('Platform owner access required')

    return true
  }
}
