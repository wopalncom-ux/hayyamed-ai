import { Controller, Get, Post, Body, HttpCode, UseGuards } from '@nestjs/common'
import { UnipileService } from './unipile.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'
import { Public } from '../../common/decorators/public.decorator'
import { OwnerGuard } from '../../common/guards/owner.guard'

@Controller('unipile')
export class UnipileController {
  constructor(private svc: UnipileService) {}

  // ── Platform Unipile account (owner only) ────────────────────────────────
  @Get('platform-status')
  platformStatus() {
    return this.svc.platformStatus()
  }

  @Post('platform-config')
  @UseGuards(OwnerGuard)
  savePlatformConfig(@Body() body: { dsn: string; apiKey: string }) {
    return this.svc.savePlatformConfig(body || ({} as any))
  }

  @Post('platform-disconnect')
  @UseGuards(OwnerGuard)
  platformDisconnect() {
    return this.svc.disconnectPlatform()
  }

  // ── Tenant WhatsApp connection ───────────────────────────────────────────
  @Get('whatsapp/status')
  status(@CurrentUser() user: JwtPayload) {
    return this.svc.status(user.orgId)
  }

  // Start a connection; returns a QR string for the user to scan with WhatsApp.
  @Post('whatsapp/connect')
  connect(@CurrentUser() user: JwtPayload, @Body() body: { pairingPhone?: string }) {
    return this.svc.connectWhatsapp(user.orgId, body?.pairingPhone)
  }

  @Post('whatsapp/disconnect')
  disconnect(@CurrentUser() user: JwtPayload) {
    return this.svc.disconnect(user.orgId)
  }

  @Post('whatsapp/send')
  send(@CurrentUser() user: JwtPayload, @Body() body: { to: string; text: string }) {
    return this.svc.sendMessage(user.orgId, body.to, body.text)
  }

  // ── Inbound webhook (Unipile → us). Acknowledged immediately. ────────────
  @Public()
  @Post('webhook')
  @HttpCode(200)
  webhook(@Body() body: any) {
    return this.svc.handleWebhook(body || {})
  }
}
