import { Controller, Get, Post, Body, Headers, UnauthorizedException, Req, RawBodyRequest } from '@nestjs/common'
import { Request } from 'express'
import { BillingService } from './billing.service'

@Controller('billing')
export class BillingController {
  constructor(private billing: BillingService) {}

  private getOrgId(headers: Record<string, string>): string {
    const orgId = headers['x-org-id']
    if (!orgId) throw new UnauthorizedException('x-org-id header required')
    return orgId
  }

  @Get('plans')
  getPlans() {
    return this.billing.getPlans()
  }

  @Get('invoices')
  getInvoices(@Headers() headers: Record<string, string>) {
    return this.billing.getInvoices(this.getOrgId(headers))
  }

  @Get('current-plan')
  getCurrentPlan(@Headers() headers: Record<string, string>) {
    return this.billing.getCurrentPlan(this.getOrgId(headers))
  }

  @Post('checkout')
  createCheckout(
    @Headers() headers: Record<string, string>,
    @Body() body: { planId: string; successUrl?: string; cancelUrl?: string },
  ) {
    const orgId = this.getOrgId(headers)
    const origin = headers['origin'] || 'http://localhost:3000'
    return this.billing.createCheckout(
      orgId,
      body.planId,
      body.successUrl || `${origin}/settings?tab=billing&success=1`,
      body.cancelUrl || `${origin}/settings?tab=billing`,
    )
  }

  @Post('webhook')
  async stripeWebhook(@Req() req: RawBodyRequest<Request>) {
    const sig = req.headers['stripe-signature'] as string
    await this.billing.handleStripeWebhook(req.rawBody!, sig)
    return { received: true }
  }
}
