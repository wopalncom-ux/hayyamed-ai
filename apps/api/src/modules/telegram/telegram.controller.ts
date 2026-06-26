import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { Throttle, SkipThrottle } from '@nestjs/throttler'
import { TelegramService } from './telegram.service'
import { Public } from '../../common/decorators/public.decorator'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

@Controller('telegram')
export class TelegramController {
  constructor(private svc: TelegramService) {}

  @Post('connect')
  connect(@CurrentUser() user: JwtPayload, @Body() body: { botToken: string }) {
    return this.svc.connect(user.orgId, body.botToken)
  }

  @Get('status')
  status(@CurrentUser() user: JwtPayload) {
    return this.svc.status(user.orgId)
  }

  @Post('disconnect')
  disconnect(@CurrentUser() user: JwtPayload) {
    return this.svc.disconnect(user.orgId)
  }

  // Telegram posts updates here — must be public + always 200 fast.
  @Public()
  @SkipThrottle()
  @Post('webhook/:orgId')
  async webhook(@Param('orgId') orgId: string, @Body() update: any) {
    this.svc.handleUpdate(orgId, update).catch(() => {})
    return { ok: true }
  }
}
