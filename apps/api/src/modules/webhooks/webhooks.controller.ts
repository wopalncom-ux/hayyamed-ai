import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common'
import { WebhooksService } from './webhooks.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

@Controller('webhooks')
export class WebhooksController {
  constructor(private svc: WebhooksService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.svc.list(user.orgId)
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() body: { url: string; events?: string; secret?: string }) {
    return this.svc.create(user.orgId, body || ({} as any))
  }

  @Post('test')
  test(@Body() body: { url: string }) {
    return this.svc.test((body || ({} as any)).url)
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.remove(user.orgId, id)
  }
}
