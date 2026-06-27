import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../database/prisma.service'
import { EmailService } from '../email/email.service'
import { MyFatoorahService } from '../myfatoorah/myfatoorah.service'
import Stripe from 'stripe'

// Default plan catalog. Prices are owner-editable and stored in platform_settings.
const DEFAULT_PLANS = [
  { id: 'starter', name: 'Starter', price: 150, currency: 'QAR', contacts: 1000, messages: 10000, aiResponses: 5000 },
  { id: 'growth', name: 'Growth', price: 599, currency: 'QAR', contacts: 5000, messages: 50000, aiResponses: 20000 },
  { id: 'enterprise', name: 'Enterprise', price: 990, currency: 'QAR', contacts: 999999, messages: 999999, aiResponses: 999999 },
]

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name)
  private stripe?: Stripe

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private emailSvc: EmailService,
    private myfatoorah: MyFatoorahService,
  ) {
    const key = this.config.get('STRIPE_SECRET_KEY')
    if (key && key !== 'your-stripe-key-here') {
      this.stripe = new Stripe(key, { apiVersion: '2024-04-10' as any })
    }
  }

  // Plans with owner overrides (price/name) merged over the defaults.
  async getPlans() {
    let overrides: any[] = []
    try {
      const row = await this.prisma.platformSetting.findUnique({ where: { key: 'plan_pricing' } })
      if (row?.value && Array.isArray(row.value)) overrides = row.value as any[]
    } catch { /* table not migrated yet → defaults */ }
    return DEFAULT_PLANS.map(p => {
      const o = overrides.find(x => x.id === p.id)
      return o ? { ...p, name: o.name ?? p.name, price: o.price ?? p.price } : p
    })
  }

  // Owner-only: update plan prices/names.
  async updatePlanPricing(plans: { id: string; name?: string; price?: number }[]) {
    const clean = (plans || [])
      .filter(p => DEFAULT_PLANS.some(d => d.id === p.id))
      .map(p => ({ id: p.id, name: p.name, price: p.price != null ? Math.max(0, Number(p.price)) : undefined }))
    await this.prisma.platformSetting.upsert({
      where: { key: 'plan_pricing' },
      update: { value: clean as any },
      create: { key: 'plan_pricing', value: clean as any },
    })
    return this.getPlans()
  }

  private async findPlan(id: string) {
    return (await this.getPlans()).find(p => p.id === id)
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
    const plans = await this.getPlans()
    const plan = plans.find(p => p.id === org?.plan?.toLowerCase()) || plans[0]
    return { ...plan, expiry: org?.planExpiry }
  }

  // Activates a plan for an org: paid invoice + org plan/expiry + confirmation email.
  // Shared by the simulated path and the verified MyFatoorah subscription path.
  private async activatePlan(orgId: string, planId: string) {
    const plan = await this.findPlan(planId)
    if (!plan) throw new BadRequestException('Invalid plan')
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await this.prisma.invoice.create({
      data: { orgId, amount: plan.price, currency: plan.currency, status: 'paid', description: `${plan.name} plan subscription`, paidAt: new Date() },
    })
    await this.prisma.organization.update({
      where: { id: orgId },
      data: { plan: planId.toUpperCase() as any, planExpiry: periodEnd },
    })

    const admin = await this.prisma.user.findFirst({ where: { orgId, role: 'ADMIN' } })
    if (admin) {
      const frontendUrl = this.config.get('FRONTEND_URL') || 'https://www.hayyaai.com'
      this.emailSvc.sendSubscriptionConfirmed(admin.email, {
        name: admin.name, plan: plan.name,
        nextBillingDate: periodEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        dashboardUrl: `${frontendUrl}/dashboard`,
      }).catch(() => {})
    }
    return plan
  }

  // Verify a MyFatoorah subscription payment and activate the plan if paid.
  async verifySubscription(orgId: string, paymentId: string) {
    if (!paymentId) throw new BadRequestException('paymentId is required')
    const data: any = await this.myfatoorah.getPlatformPaymentStatus(paymentId)
    const status = data?.InvoiceStatus || 'Unknown'
    const ref: string = data?.CustomerReference || ''
    const paid = String(status).toLowerCase() === 'paid'
    if (!paid) return { activated: false, status }

    // reference format: sub:{orgId}:{planId}
    const [tag, refOrg, planId] = ref.split(':')
    if (tag !== 'sub' || !planId || (refOrg && refOrg !== orgId)) {
      return { activated: false, status, error: 'Reference mismatch' }
    }
    const plan = await this.activatePlan(orgId, planId)
    return { activated: true, status, plan: plan.name }
  }

  async createCheckout(orgId: string, planId: string, successUrl: string, cancelUrl: string) {
    const plan = await this.findPlan(planId)
    if (!plan) throw new BadRequestException('Invalid plan')

    // Prefer the platform MyFatoorah account (GCC) when configured.
    if (await this.myfatoorah.isPlatformConfigured()) {
      const r = await this.myfatoorah.createPlatformPayment(orgId, {
        amount: plan.price, currency: plan.currency,
        customerName: `${plan.name} subscription`,
        callbackUrl: successUrl, errorUrl: cancelUrl,
        reference: `sub:${orgId}:${planId}`,
      })
      return { url: r.paymentUrl, paymentUrl: r.paymentUrl, invoiceId: r.invoiceId, provider: 'myfatoorah' }
    }

    if (!this.stripe) {
      // No gateway configured — simulate activation (dev).
      await this.activatePlan(orgId, planId)
      return { url: successUrl, simulated: true }
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Hayya AI — ${plan.name} Plan` },
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
        const plan = await this.findPlan(planId)
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

          const admin = await this.prisma.user.findFirst({ where: { orgId, role: 'ADMIN' } })
          if (admin) {
            const nextDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
            const frontendUrl = this.config.get('FRONTEND_URL') || 'https://www.hayyaai.com'
            this.emailSvc.sendSubscriptionConfirmed(admin.email, {
              name: admin.name,
              plan: plan.name,
              nextBillingDate: nextDate,
              dashboardUrl: `${frontendUrl}/dashboard`,
            }).catch(() => {})
          }
        }
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice
      const sub = invoice.subscription
      if (sub) {
        const stripeSubscription = await this.stripe!.subscriptions.retrieve(sub as string)
        const orgId = stripeSubscription.metadata?.orgId
        if (orgId) {
          const admin = await this.prisma.user.findFirst({ where: { orgId, role: 'ADMIN' } })
          if (admin) {
            const frontendUrl = this.config.get('FRONTEND_URL') || 'https://www.hayyaai.com'
            this.emailSvc.sendPaymentFailed(admin.email, {
              name: admin.name,
              amount: `${(invoice.amount_due / 100).toFixed(2)} ${invoice.currency?.toUpperCase()}`,
              updateUrl: `${frontendUrl}/settings/billing`,
            }).catch(() => {})
          }
        }
      }
    }
  }
}
