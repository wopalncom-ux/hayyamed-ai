import { Controller, Get, Post, Body, Param, Query, HttpCode, UseGuards } from '@nestjs/common'
import { MyFatoorahService } from './myfatoorah.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'
import { Public } from '../../common/decorators/public.decorator'
import { OwnerGuard } from '../../common/guards/owner.guard'

@Controller('payments/myfatoorah')
export class MyFatoorahController {
  constructor(private svc: MyFatoorahService) {}

  // Whether MyFatoorah is configured for this org (no secrets returned).
  @Get('status')
  status(@CurrentUser() user: JwtPayload) {
    return this.svc.status(user.orgId)
  }

  // Save / update the API token + mode — owner only.
  @Post('config')
  @UseGuards(OwnerGuard)
  saveConfig(@CurrentUser() user: JwtPayload, @Body() body: { apiToken: string; isTest?: boolean; country?: string }) {
    return this.svc.saveConfig(user.orgId, body || ({} as any))
  }

  @Post('disconnect')
  @UseGuards(OwnerGuard)
  disconnect(@CurrentUser() user: JwtPayload) {
    return this.svc.disconnect(user.orgId)
  }

  // ── Platform billing account (collects tenant subscription payments) ──────
  @Get('platform-status')
  platformStatus() {
    return this.svc.platformStatus()
  }

  @Post('platform-config')
  @UseGuards(OwnerGuard)
  savePlatformConfig(@Body() body: { apiToken: string; isTest?: boolean; country?: string }) {
    return this.svc.savePlatformConfig(body || ({} as any))
  }

  @Post('platform-disconnect')
  @UseGuards(OwnerGuard)
  platformDisconnect() {
    return this.svc.disconnectPlatform()
  }

  // Generate a hosted payment link for a customer.
  @Post('pay')
  pay(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.svc.createPayment(user.orgId, body || {})
  }

  // Recorded payment history for this org.
  @Get('payments')
  listPayments(@CurrentUser() user: JwtPayload) {
    return this.svc.listPayments(user.orgId)
  }

  // Re-check a recorded payment's status against MyFatoorah.
  @Post('payments/:id/refresh')
  refreshPayment(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.refreshPayment(user.orgId, id)
  }

  @Get('payment-status')
  paymentStatus(@CurrentUser() user: JwtPayload, @Query('key') key: string, @Query('keyType') keyType?: 'InvoiceId' | 'PaymentId') {
    return this.svc.getPaymentStatus(user.orgId, key, keyType || 'InvoiceId')
  }

  // Public callback/IPN target MyFatoorah can post to. We acknowledge immediately;
  // payment state is always re-verified server-side via getPaymentStatus.
  @Public()
  @Post('webhook/:orgId')
  @HttpCode(200)
  webhook(@Param('orgId') _orgId: string, @Body() _body: any) {
    return { ok: true }
  }
}
