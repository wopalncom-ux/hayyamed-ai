import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../database/prisma.service'
import Stripe from 'stripe'

const PLANS = [
  { id: 'starter', name: 'Starter', price: 299, currency: 'QAR', contacts: 1000, messages: 10000, aiResponses: 5000 },
  { id: 'growth', name: 'Growth', price: 599, currency: 'QAR', contacts: 5000, messages: 50000, aiResponses: 20000 },
  { id: 'enterprise', name: 'Enterprise', price: 1299, currency: 'QAR', contacts: 999999, messages: 999999, aiResponses: 999999 },
]

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name)
  private stripe?: Stripe

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const key = this.config.get('STRIPE_SECRET_KEY')
    if (key && key !== 'your-stripe-key-here') {
      this.stripe = new Stripe(key, { apiVersion: '2024-04-10' as any })
    }
  }

  getPlans() {
    return PLANS
  }

  async getInvoices(orgId: string) {
    return this.prisma.invoice.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
  }

  async getCurrentPlan(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { plan: true, planExpiry: true },
    })
    const plan = PLANS.find(p => p.id === org?.plan?.toLowerCase()) || PLANS[0]
    return { ...plan, expiry: org?.planExpiry }
  }

  async createCheckout(orgId: string, planId: string, successUrl: string, cancelUrl: string) {
    if (!this.stripe) {
      // Stripe not configured — simulate a successful checkout for dev
      const plan = PLANS.find(p => p.id === planId)
      if (!plan) throw new Error('Invalid plan')

      await this.prisma.invoice.create({
        data: {
          orgId,
          amount: plan.price,
          currency: plan.currency,
          status: 'paid',
          description: `${plan.name} plan subscription`,
          paidAt: new Date(),
        },
      })

      await this.prisma.organization.update({
        where: { id: orgId },
        data: {
          plan: planId.toUpperCase() as any,
          planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      return { url: successUrl, simulated: true }
    }

    const plan = PLANS.find(p => p.id === planId)
    if (!plan) throw new Error('Invalid plan')

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Hayyamed AI — ${plan.name} Plan` },
          unit_amount: Math.round(plan.price * 27.5), // QAR to cents (approx)
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { orgId, planId },
    })

    return { url: session.url }
  }

  async handleStripeWebhook(payload: Buffer, sig: string) {
    if (!this.stripe) return

    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET')
    let event: Stripe.Event

    try {
      event = this.stripe.webhooks.constructEvent(payload, sig, webhookSecret || '')
    } catch {
      throw new Error('Invalid webhook signature')
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const { orgId, planId } = session.metadata || {}

      if (orgId && planId) {
        const plan = PLANS.find(p => p.id === planId)
        if (plan) {
          await this.prisma.invoice.create({
            data: {
              orgId,
              amount: plan.price,
              currency: plan.currency,
              status: 'paid',
              stripeId: session.id,
              description: `${plan.name} plan subscription`,
              paidAt: new Date(),
            },
          })

          await this.prisma.organization.update({
            where: { id: orgId },
            data: {
              plan: planId.toUpperCase() as any,
              planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          })
        }
      }
    }
  }
}
