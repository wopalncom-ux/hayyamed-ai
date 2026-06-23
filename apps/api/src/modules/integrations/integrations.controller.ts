import { Controller, Get, Patch, Post, Param, Body } from '@nestjs/common'
import { IntegrationsService } from './integrations.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

@Controller('integrations')
export class IntegrationsController {
  constructor(private svc: IntegrationsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.svc.list(user.orgId)
  }

  @Patch(':type')
  upsert(
    @CurrentUser() user: JwtPayload,
    @Param('type') type: string,
    @Body() body: { name: string; credentials: Record<string, string> },
  ) {
    return this.svc.upsert(user.orgId, type, body)
  }

  @Post(':type/disconnect')
  disconnect(@CurrentUser() user: JwtPayload, @Param('type') type: string) {
    return this.svc.disconnect(user.orgId, type)
  }
}
