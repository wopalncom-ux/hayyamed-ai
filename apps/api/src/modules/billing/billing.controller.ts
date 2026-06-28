import { Controller, Get, Post, Patch, Body, Headers, Req, RawBodyRequest, UseGuards, Query } from '@nestjs/common'
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

  // Owner-only: update plan name/price/limits from the Master Dashboard.
  @Patch('plans')
  @UseGuards(OwnerGuard)
  updatePlans(@Body() body: { plans: any[] }) {
    return this.billing.updatePlanPricing(body.plans)
  }

  // Owner-only: plans annotated with estimated platform cost + margin.
  @Get('plans-cost')
  @UseGuards(OwnerGuard)
  getPlansWithCost() {
    return this.billing.getPlansWithCost()
  }

  // Owner-only: read/update the cost assumptions used for margin estimates.
  @Patch('cost-model')
  @UseGuards(OwnerGuard)
  updateCostModel(@Body() body: any) {
    return this.billing.updateCostModel(body || {})
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
    // For MyFatoorah, the callback hits /billing/success which verifies + activates.
    return this.billing.createCheckout(
      user.orgId,
      body.planId,
      body.successUrl || `${origin}/billing/success`,
      body.cancelUrl || `${origin}/settings?tab=billing`,
    )
  }

  // Called by the success page after a MyFatoorah redirect (?paymentId=…).
  @Get('verify')
  verifySubscription(@CurrentUser() user: JwtPayload, @Query('paymentId') paymentId: string) {
    return this.billing.verifySubscription(user.orgId, paymentId)
  }

  @Post('webhook')
  @Public()
  async stripeWebhook(@Req() req: RawBodyRequest<Request>) {
    const sig = req.headers['stripe-signature'] as string
    await this.billing.handleStripeWebhook(req.rawBody!, sig)
    return { received: true }
  }
}
