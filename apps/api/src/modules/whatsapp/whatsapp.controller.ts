import { Controller, Get, Post, Body, Query, Res, Headers, Logger, UseGuards } from '@nestjs/common'
import { Response } from 'express'
import { WhatsAppService } from './whatsapp.service'
import { Public } from '../../common/decorators/public.decorator'
import { CurrentUser, } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'

@Controller('whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name)

  constructor(private whatsapp: WhatsAppService) {}

  // ─── WEBHOOK VERIFICATION (Meta calls this once) ─────────────────────────
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

  // ─── INCOMING MESSAGES (Meta sends messages here) ─────────────────────────
  @Public()
  @Post('webhook')
  async receive(
    @Body() body: any,
    @Headers('x-org-id') orgId: string,
  ) {
    // Always return 200 immediately — Meta will retry if we don't respond fast
    try {
      const orgIdToUse = orgId || await this.getDefaultOrgId()
      if (orgIdToUse) {
        await this.whatsapp.processWebhook(body, orgIdToUse)
      }
    } catch (err: any) {
      this.logger.error(`Webhook processing error: ${err?.message}`)
    }
    return { status: 'ok' }
  }

  // ─── SEND MESSAGE ─────────────────────────────────────────────────────────
  @Post('send')
  async send(@Body() body: {
    phoneNumberId: string
    to: string
    text: string
    token?: string
  }) {
    const token = body.token || process.env.WHATSAPP_ACCESS_TOKEN || ''
    return this.whatsapp.sendText(body.phoneNumberId, body.to, body.text, token)
  }

  // ─── GET TEMPLATES ────────────────────────────────────────────────────────
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

  private async getDefaultOrgId(): Promise<string | null> {
    // Fallback: get first org from DB
    try {
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      const org = await prisma.organization.findFirst()
      await prisma.$disconnect()
      return org?.id || null
    } catch {
      return null
    }
  }
}
