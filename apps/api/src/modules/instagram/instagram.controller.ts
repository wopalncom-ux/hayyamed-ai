import { Controller, Get, Post, Body, Query, Req, Res, Logger, RawBodyRequest } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request, Response } from 'express'
import { InstagramService } from './instagram.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'
import { Public } from '../../common/decorators/public.decorator'
import { verifyMetaSignature } from '../../common/util/meta-signature.util'

@Controller('instagram')
export class InstagramController {
  private readonly logger = new Logger(InstagramController.name)

  constructor(private svc: InstagramService, private config: ConfigService) {}

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
  webhook(@Req() req: RawBodyRequest<Request>, @Body() body: any, @Res() res: Response) {
    const signature = req.headers['x-hub-signature-256'] as string | undefined
    if (!verifyMetaSignature(req.rawBody, signature, this.config.get('META_APP_SECRET'))) {
      this.logger.warn('❌ Rejected Instagram webhook: invalid or missing X-Hub-Signature-256')
      return res.status(403).send('Forbidden')
    }
    return this.svc.processWebhook(body || {}).then(() => res.status(200).send({ status: 'ok' }))
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
