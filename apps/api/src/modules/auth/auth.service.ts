// ============================================
// AUTH MODULE — JWT + Google OAuth + 2FA
// apps/api/src/modules/auth/
// ============================================

// ----- auth.service.ts -----
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // Register new organization + admin user
  async register(dto: RegisterDto) {
    // Check email exists
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (existing) throw new ConflictException('Email already registered')

    // Hash password
    const hash = await bcrypt.hash(dto.password, 12)

    // Create org slug
    const slug = dto.orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()

    // Create org + user in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: dto.orgName,
          slug,
          industry: dto.industry,
          country: dto.country || 'QA',
          settings: {
            create: {
              language: dto.language || 'ar',
              rtlEnabled: true,
            }
          }
        }
      })

      const user = await tx.user.create({
        data: {
          orgId: org.id,
          email: dto.email,
          name: dto.name,
          phone: dto.phone,
          password: hash,
          role: 'ADMIN',
        }
      })

      return { org, user }
    })

    const tokens = await this.generateTokens(result.user.id, result.user.email, result.org.id)
    return { user: this.sanitizeUser(result.user), org: result.org, ...tokens }
  }

  // Login
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { org: true }
    })

    if (!user || !user.password) throw new UnauthorizedException('Invalid credentials')
    if (!user.isActive) throw new UnauthorizedException('Account disabled')

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) throw new UnauthorizedException('Invalid credentials')

    // Update last seen
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date() }
    })

    const tokens = await this.generateTokens(user.id, user.email, user.orgId)
    return { user: this.sanitizeUser(user), org: user.org, ...tokens }
  }

  // Refresh token
  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.refreshToken) throw new UnauthorizedException()

    const valid = await bcrypt.compare(refreshToken, user.refreshToken)
    if (!valid) throw new UnauthorizedException()

    return this.generateTokens(user.id, user.email, user.orgId)
  }

  // Generate JWT tokens
  async generateTokens(userId: string, email: string, orgId: string) {
    const payload = { sub: userId, email, orgId }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ])

    // Store hashed refresh token
    const hash = await bcrypt.hash(refreshToken, 10)
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hash }
    })

    return { accessToken, refreshToken }
  }

  // Logout
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null }
    })
  }

  sanitizeUser(user: any) {
    const { password, refreshToken, twoFASecret, ...safe } = user
    return safe
  }
}

// ----- auth.controller.ts -----
export class AuthController {
  // POST /api/v1/auth/register
  // POST /api/v1/auth/login
  // POST /api/v1/auth/logout
  // POST /api/v1/auth/refresh
  // GET  /api/v1/auth/google
  // GET  /api/v1/auth/google/callback
  // POST /api/v1/auth/2fa/enable
  // POST /api/v1/auth/2fa/verify
}

// ----- DTOs -----
interface RegisterDto {
  name: string
  email: string
  password: string
  phone?: string
  orgName: string
  industry?: string
  country?: string
  language?: string
}
