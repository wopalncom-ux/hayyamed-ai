import { Injectable, BadRequestException, Optional } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { PrismaService } from '../../database/prisma.service'
import { WebhooksService } from '../webhooks/webhooks.service'
import { encryptJson, decryptJson } from '../../common/crypto/crypto.util'

// MyFatoorah — GCC/MENA payment gateway (KNET, mada, cards, Apple Pay…).
// Credentials are stored encrypted in the integrations table (type='myfatoorah').
const TYPE = 'myfatoorah'

@Injectable()
export class MyFatoorahService {
  constructor(private prisma: PrismaService, @Optional() private webhooks?: WebhooksService) {}

  // Region-aware API host. Test uses the shared sandbox; live depends on the
  // MyFatoorah account country (SA/EG have dedicated hosts; the rest share api.).
  private baseUrl(cfg: { isTest?: boolean; country?: string }) {
    if (cfg.isTest) return 'https://apitest.myfatoorah.com'
    const c = String(cfg.country || '').toUpperCase()
    if (c === 'SA') return 'https://api-sa.myfatoorah.com'
    if (c === 'EG') return 'https://api-eg.myfatoorah.com'
    return 'https://api.myfatoorah.com'
  }

  private async getConfig(orgId: string) {
    const row = await this.prisma.integration.findFirst({ where: { orgId, type: TYPE } })
    if (!row) return null
    return decryptJson(row.config) as { apiToken?: string; isTest?: boolean; country?: string }
  }

  // Safe to return to the client — never exposes the API token.
  async status(orgId: string) {
    const cfg = await this.getConfig(orgId)
    return { configured: !!cfg?.apiToken, isTest: !!cfg?.isTest, country: cfg?.country || 'QA' }
  }

  // Country → ISO currency, for the verification probe below.
  private currencyFor(country?: string) {
    const map: Record<string, string> = { QA: 'QAR', SA: 'SAR', AE: 'AED', KW: 'KWD', BH: 'BHD', OM: 'OMR', EG: 'EGP' }
    return map[String(country || 'QA').toUpperCase()] || 'KWD'
  }

  // Validate the API token (and the Test/Live + country combo) against MyFatoorah
  // before we mark it active — InitiatePayment is the lightweight call MyFatoorah
  // recommends for this. Mirrors the "no fake Connected" rule used elsewhere.
  private async verifyToken(cfg: { apiToken: string; isTest?: boolean; country?: string }) {
    let res: Response
    try {
      res = await fetch(`${this.baseUrl(cfg)}/v2/InitiatePayment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiToken}` },
        body: JSON.stringify({ InvoiceAmount: 1, CurrencyIso: this.currencyFor(cfg.country) }),
      })
    } catch (err: any) {
      throw new BadRequestException('Could not reach MyFatoorah to verify the token: ' + (err?.message || 'network error'))
    }
    if (res.status === 401) throw new BadRequestException('MyFatoorah rejected this API token. Double-check the token and the Test/Live + country settings.')
    const json: any = await res.json().catch(() => null)
    if (!res.ok || !json?.IsSuccess) throw new BadRequestException(json?.Message || 'MyFatoorah could not validate this token. Check the token and the Test/Live + country settings.')
    return true
  }

  async saveConfig(orgId: string, dto: { apiToken: string; isTest?: boolean; country?: string }) {
    if (!dto?.apiToken) throw new BadRequestException('apiToken is required')
    const cleanCfg = { apiToken: dto.apiToken.trim(), isTest: !!dto.isTest, country: dto.country || 'QA' }
    await this.verifyToken(cleanCfg) // throws with a clear message if rejected
    const encrypted = encryptJson(cleanCfg) as any
    const existing = await this.prisma.integration.findFirst({ where: { orgId, type: TYPE } })
    if (existing) {
      await this.prisma.integration.update({ where: { id: existing.id }, data: { config: encrypted, status: 'active', name: 'MyFatoorah', lastSyncAt: new Date() } })
    } else {
      await this.prisma.integration.create({ data: { orgId, type: TYPE, name: 'MyFatoorah', config: encrypted, status: 'active', lastSyncAt: new Date() } })
    }
    return this.status(orgId)
  }

  async disconnect(orgId: string) {
    await this.prisma.integration.deleteMany({ where: { orgId, type: TYPE } })
    return { ok: true }
  }

  // Creates a hosted MyFatoorah payment page and returns its URL (SendPayment,
  // NotificationOption=LNK → link only, all enabled methods shown to the payer).
  async createPayment(orgId: string, dto: {
    amount: number; customerName?: string; customerEmail?: string; customerMobile?: string;
    currency?: string; callbackUrl?: string; errorUrl?: string; reference?: string; language?: string;
  }) {
    const cfg = await this.getConfig(orgId)
    if (!cfg?.apiToken) throw new BadRequestException('MyFatoorah is not configured. Add your API token first.')
    if (!dto?.amount || dto.amount <= 0) throw new BadRequestException('A positive amount is required')

    const { invoiceId, paymentUrl } = await this.sendPaymentWithConfig(cfg, dto)

    // Record the payment so the owner has visibility + can re-check its status.
    try {
      await this.prisma.$executeRaw`
        INSERT INTO "payments" ("id","orgId","provider","invoiceId","amount","currency","customerName","status","paymentUrl","reference","createdAt","updatedAt")
        VALUES (${randomUUID()}, ${orgId}, 'myfatoorah', ${invoiceId}, ${dto.amount}, ${dto.currency || 'QAR'}, ${dto.customerName || 'Customer'}, 'Pending', ${paymentUrl}, ${dto.reference || null}, NOW(), NOW())
      `
    } catch { /* recording is best-effort; never block the payment link */ }

    this.webhooks?.dispatch(orgId, 'payment.created', { invoiceId, amount: dto.amount, currency: dto.currency || 'QAR', paymentUrl, reference: dto.reference }).catch(() => {})
    return { invoiceId, paymentUrl }
  }

  listPayments(orgId: string) {
    return this.prisma.$queryRaw`
      SELECT * FROM "payments" WHERE "orgId" = ${orgId} ORDER BY "createdAt" DESC LIMIT 100
    `
  }

  // Revenue overview: counts + paid totals per currency (overall and this month).
  async summary(orgId: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT status, currency, amount, "createdAt" FROM "payments" WHERE "orgId" = ${orgId}
    `
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    let paidCount = 0, pendingCount = 0
    const paidByCurrency: Record<string, number> = {}
    const monthByCurrency: Record<string, number> = {}
    for (const r of rows) {
      const s = String(r.status || '').toLowerCase()
      if (s === 'paid') {
        paidCount++
        const amt = Number(r.amount) || 0
        paidByCurrency[r.currency] = (paidByCurrency[r.currency] || 0) + amt
        if (new Date(r.createdAt) >= monthStart) monthByCurrency[r.currency] = (monthByCurrency[r.currency] || 0) + amt
      } else if (s === 'pending') {
        pendingCount++
      }
    }
    return { total: rows.length, paidCount, pendingCount, paidByCurrency, monthByCurrency }
  }

  // Re-checks a recorded payment against MyFatoorah and updates its stored status.
  async refreshPayment(orgId: string, id: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM "payments" WHERE "id" = ${id} AND "orgId" = ${orgId} LIMIT 1
    `
    if (!rows.length) throw new BadRequestException('Payment not found')
    const payment = rows[0]
    if (!payment.invoiceId) return payment
    const data = await this.getPaymentStatus(orgId, String(payment.invoiceId), 'InvoiceId')
    const status = data?.InvoiceStatus || payment.status
    await this.prisma.$executeRaw`
      UPDATE "payments" SET "status" = ${status}, "updatedAt" = NOW() WHERE "id" = ${id} AND "orgId" = ${orgId}
    `
    return { ...payment, status }
  }

  async getPaymentStatus(orgId: string, key: string, keyType: 'InvoiceId' | 'PaymentId' = 'InvoiceId') {
    const cfg = await this.getConfig(orgId)
    if (!cfg?.apiToken) throw new BadRequestException('MyFatoorah is not configured.')
    return this.fetchStatusWithConfig(cfg, key, keyType)
  }

  // ── Config-agnostic helpers (used by both org-level and platform-level flows) ──
  private async sendPaymentWithConfig(cfg: { apiToken?: string; isTest?: boolean; country?: string }, dto: any) {
    const body: Record<string, any> = {
      CustomerName: dto.customerName || 'Customer',
      NotificationOption: 'LNK',
      InvoiceValue: dto.amount,
      DisplayCurrencyIso: dto.currency || 'QAR',
      Language: (dto.language || 'en').toLowerCase() === 'ar' ? 'ar' : 'en',
    }
    if (dto.callbackUrl) body.CallBackUrl = dto.callbackUrl
    if (dto.errorUrl || dto.callbackUrl) body.ErrorUrl = dto.errorUrl || dto.callbackUrl
    if (dto.customerEmail) body.CustomerEmail = dto.customerEmail
    if (dto.customerMobile) body.CustomerMobile = dto.customerMobile
    if (dto.reference) body.CustomerReference = dto.reference

    let json: any = {}
    try {
      const res = await fetch(`${this.baseUrl(cfg)}/v2/SendPayment`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.apiToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.IsSuccess) {
        const msg = json?.Message || json?.ValidationErrors?.[0]?.Error || `MyFatoorah request failed (${res.status})`
        throw new BadRequestException(msg)
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err
      throw new BadRequestException('Could not reach MyFatoorah: ' + (err?.message || 'network error'))
    }
    return {
      invoiceId: json.Data?.InvoiceId ? String(json.Data.InvoiceId) : null,
      paymentUrl: json.Data?.InvoiceURL || null,
    }
  }

  private async fetchStatusWithConfig(cfg: { apiToken?: string; isTest?: boolean; country?: string }, key: string, keyType: 'InvoiceId' | 'PaymentId') {
    if (!key) throw new BadRequestException('key is required')
    const res = await fetch(`${this.baseUrl(cfg)}/v2/getPaymentStatus`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.apiToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ Key: key, KeyType: keyType }),
    })
    const json: any = await res.json().catch(() => ({}))
    if (!res.ok || !json?.IsSuccess) throw new BadRequestException(json?.Message || 'Could not fetch payment status')
    return json.Data
  }

  // ── Platform-level account (collects tenant subscription payments) ──────────
  private readonly PLATFORM_KEY = 'mf_platform'

  private async getPlatformConfig() {
    const row = await this.prisma.platformSetting.findUnique({ where: { key: this.PLATFORM_KEY } })
    if (!row) return null
    return decryptJson(row.value) as { apiToken?: string; isTest?: boolean; country?: string }
  }

  async platformStatus() {
    const cfg = await this.getPlatformConfig()
    return { configured: !!cfg?.apiToken, isTest: !!cfg?.isTest, country: cfg?.country || 'QA' }
  }

  async savePlatformConfig(dto: { apiToken: string; isTest?: boolean; country?: string }) {
    if (!dto?.apiToken) throw new BadRequestException('apiToken is required')
    const value = encryptJson({ apiToken: dto.apiToken.trim(), isTest: !!dto.isTest, country: dto.country || 'QA' }) as any
    await this.prisma.platformSetting.upsert({
      where: { key: this.PLATFORM_KEY },
      create: { key: this.PLATFORM_KEY, value },
      update: { value },
    })
    return this.platformStatus()
  }

  async disconnectPlatform() {
    await this.prisma.platformSetting.deleteMany({ where: { key: this.PLATFORM_KEY } })
    return { ok: true }
  }

  isPlatformConfigured() {
    return this.getPlatformConfig().then(c => !!c?.apiToken)
  }

  // Create a subscription payment via the PLATFORM account; record it under the
  // paying tenant's org for visibility.
  async createPlatformPayment(orgId: string, dto: any) {
    const cfg = await this.getPlatformConfig()
    if (!cfg?.apiToken) throw new BadRequestException('Platform billing (MyFatoorah) is not configured.')
    if (!dto?.amount || dto.amount <= 0) throw new BadRequestException('A positive amount is required')
    const { invoiceId, paymentUrl } = await this.sendPaymentWithConfig(cfg, dto)
    try {
      await this.prisma.$executeRaw`
        INSERT INTO "payments" ("id","orgId","provider","invoiceId","amount","currency","customerName","status","paymentUrl","reference","createdAt","updatedAt")
        VALUES (${randomUUID()}, ${orgId}, 'myfatoorah', ${invoiceId}, ${dto.amount}, ${dto.currency || 'QAR'}, ${dto.customerName || 'Subscription'}, 'Pending', ${paymentUrl}, ${dto.reference || null}, NOW(), NOW())
      `
    } catch { /* best-effort */ }
    this.webhooks?.dispatch(orgId, 'payment.created', { invoiceId, amount: dto.amount, currency: dto.currency || 'QAR', paymentUrl, reference: dto.reference }).catch(() => {})
    return { invoiceId, paymentUrl }
  }

  async getPlatformPaymentStatus(invoiceId: string) {
    const cfg = await this.getPlatformConfig()
    if (!cfg?.apiToken) throw new BadRequestException('Platform billing is not configured.')
    return this.fetchStatusWithConfig(cfg, invoiceId, 'InvoiceId')
  }
}
