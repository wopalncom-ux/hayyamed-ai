import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { ApiKeysService } from './api-keys.service'

// Authenticates public-API requests via the X-API-Key header and attaches the
// resolved orgId to the request as `apiOrgId`.
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiKeys: ApiKeysService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest()
    const key = req.headers['x-api-key'] || (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '')
    const orgId = await this.apiKeys.resolveOrg(String(key || ''))
    if (!orgId) throw new UnauthorizedException('Invalid or missing API key')
    req.apiOrgId = orgId
    return true
  }
}
