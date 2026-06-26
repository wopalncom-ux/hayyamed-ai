import { Controller, Get, Post, Patch, Body, Headers, Req, RawBodyRequest, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { BillingService } from './billing.service'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { JwtPayload } from '../../common/guards/jwt.guard'
import { Public } from '../../common/decorators/public.decorator'
import { OwnerGuard } from '../../common/guards/owner.guard'

@Controller('billing')
export class BillingController {
  constructor(private billing: BillingService) {}

  @Get('plans')
  @Public()
  getPlans() {
    return this.billing.getPlans()
  }

  // Owner-only: update plan prices/names from the Master Dashboard.
  @Patch('plans')
  @UseGuards(OwnerGuard)
  updatePlans(@Body() body: { plans: { id: string; name?: string; price?: number }[] }) {
    return this.billing.updatePlanPricing(body.plans)
  }

  @Get('invoices')
  getInvoices(@CurrentUser() user: JwtPayload) {
    return this.billing.getInvoices(user.orgId)
  }

  @Get('current-plan')
  getCurrentPlan(@CurrentUser() user: JwtPayload) {
    return this.billing.getCurrentPlan(user.orgId)
  }

  @Post('checkout')
  createCheckout(
    @CurrentUser() user: JwtPayload,
    @Headers() headers: Record<string, string>,
    @Body() body: { planId: string; successUrl?: string; cancelUrl?: string },
  ) {
    const origin = headers['origin'] || 'http://localhost:3000'
    return this.billing.createCheckout(
      user.orgId,
      body.planId,
      body.successUrl || `${origin}/settings?tab=billing&success=1`,
      body.cancelUrl || `${origin}/settings?tab=billing`,
    )
  }

  @Post('webhook')
  @Public()
  async stripeWebhook(@Req() req: RawBodyRequest<Request>) {
    const sig = req.headers['stripe-signature'] as string
    await this.billing.handleStripeWebhook(req.rawBody!, sig)
    return { received: true }
  }
}
