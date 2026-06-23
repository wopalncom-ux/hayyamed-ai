import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

export interface JwtPayload {
  sub: string
  email: string
  orgId: string
  iat?: number
  exp?: number
}

@Injectable()
export class JwtAuthGuard {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true
    const req = context.switchToHttp().getRequest<Request>()
    const token = this.extractToken(req)
    if (!token) throw new UnauthorizedException('Missing access token')

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.get('JWT_SECRET'),
      })
      req['user'] = payload
      return true
    } catch {
      throw new UnauthorizedException('Invalid or expired token')
    }
  }

  private extractToken(req: Request): string | undefined {
    const auth = req.headers['authorization']
    if (auth?.startsWith('Bearer ')) return auth.slice(7)
    return undefined
  }
}
