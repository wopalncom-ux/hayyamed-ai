import { Controller, Get, Post, Delete, Body, Param, Query, Res, Logger } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import { Response } from 'express'
import { WhatsAppService } from './whatsapp.service'
import { Public } from '../../common/decorators/public.decorator'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

// Meta webhook callbacks authenticate via HMAC, not rate-limit headers — skip throttle
@SkipThrottle()
@Controller('whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name)

  constructor(private whatsapp: WhatsAppService) {}

  // ─── WEBHOOK VERIFICATION ───────────────────────────────────────────────
  @Public()
  @Get('webhook')
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const result = this.whatsapp.verifyWebhook(mode, token, challenge)
    if (result) {
      this.logger.log('✅ WhatsApp webhook verified')
      return res.status(200).send(result)
    }
    return res.status(403).send('Forbidden')
  }

  // ─── INCOMING MESSAGES (Meta sends here — always 200 immediately) ───────
  @Public()
  @Post('webhook')
  async receive(@Body() body: any) {
    try {
      await this.whatsapp.processWebhook(body)
    } catch (err: any) {
      this.logger.error(`Webhook error: ${err?.message}`)
    }
    return { status: 'ok' }
  }

  // ─── CHANNEL MANAGEMENT ─────────────────────────────────────────────────
  @Get('channels')
  getChannels(@CurrentUser() user: JwtPayload) {
    return this.whatsapp.getChannels(user.orgId)
  }

  @Post('channels')
  connectChannel(@CurrentUser() user: JwtPayload, @Body() body: {
    name: string
    phoneNumberId: string
    accessToken: string
    businessId?: string
    webhookSecret?: string
  }) {
    return this.whatsapp.connectChannel(user.orgId, body)
  }

  @Delete('channels/:id')
  disconnectChannel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.whatsapp.disconnectChannel(user.orgId, id)
  }

  // ─── TEST SEND ──────────────────────────────────────────────────────────
  @Post('channels/test')
  testSend(@CurrentUser() user: JwtPayload, @Body() body: { to: string }) {
    return this.whatsapp.sendTestMessage(user.orgId, body.to)
  }

  // ─── MANUAL SEND ────────────────────────────────────────────────────────
  @Post('send')
  send(@CurrentUser() user: JwtPayload, @Body() body: { to: string; text: string }) {
    return this.whatsapp.sendFromOrg(user.orgId, body.to, body.text)
  }

  // ─── BROADCAST ──────────────────────────────────────────────────────────
  @Post('broadcast')
  broadcast(@CurrentUser() user: JwtPayload, @Body() body: { contactIds: string[]; text: string }) {
    return this.whatsapp.broadcast(user.orgId, body.contactIds, body.text)
  }

  // ─── TEMPLATES ──────────────────────────────────────────────────────────
  @Get('templates')
  async getTemplates(
    @Query('businessId') businessId: string,
    @Query('token') token: string,
  ) {
    return this.whatsapp.getTemplates(
      businessId,
      token || process.env.WHATSAPP_ACCESS_TOKEN || '',
    )
  }
}
