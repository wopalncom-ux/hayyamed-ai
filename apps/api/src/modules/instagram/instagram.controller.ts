import { Controller, Get, Post, Body, Query, HttpCode, Res } from '@nestjs/common'
import { Response } from 'express'
import { InstagramService } from './instagram.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'
import { Public } from '../../common/decorators/public.decorator'

@Controller('instagram')
export class InstagramController {
  constructor(private svc: InstagramService) {}

  // Meta webhook verification (shared Meta app verify token).
  @Public()
  @Get('webhook')
  verify(@Query('hub.mode') mode: string, @Query('hub.verify_token') token: string, @Query('hub.challenge') challenge: string, @Res() res: Response) {
    const result = this.svc.verifyWebhook(mode, token, challenge)
    if (result) return res.status(200).send(result)
    return res.status(403).send('Forbidden')
  }

  // Inbound Instagram DM events — acknowledged immediately.
  @Public()
  @Post('webhook')
  @HttpCode(200)
  webhook(@Body() body: any) {
    return this.svc.processWebhook(body || {})
  }

  @Get('status')
  status(@CurrentUser() user: JwtPayload) {
    return this.svc.status(user.orgId)
  }

  @Post('connect')
  connect(@CurrentUser() user: JwtPayload, @Body() body: { igAccountId: string; accessToken: string; username?: string }) {
    return this.svc.connectChannel(user.orgId, body)
  }

  @Post('disconnect')
  disconnect(@CurrentUser() user: JwtPayload) {
    return this.svc.disconnect(user.orgId)
  }
}
