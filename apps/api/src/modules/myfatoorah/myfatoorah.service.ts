import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { encryptJson, decryptJson } from '../../common/crypto/crypto.util'

// MyFatoorah — GCC/MENA payment gateway (KNET, mada, cards, Apple Pay…).
// Credentials are stored encrypted in the integrations table (type='myfatoorah').
const TYPE = 'myfatoorah'

@Injectable()
export class MyFatoorahService {
  constructor(private prisma: PrismaService) {}

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

  async saveConfig(orgId: string, dto: { apiToken: string; isTest?: boolean; country?: string }) {
    if (!dto?.apiToken) throw new BadRequestException('apiToken is required')
    const encrypted = encryptJson({ apiToken: dto.apiToken.trim(), isTest: !!dto.isTest, country: dto.country || 'QA' }) as any
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
    return { invoiceId: json.Data?.InvoiceId, paymentUrl: json.Data?.InvoiceURL }
  }

  async getPaymentStatus(orgId: string, key: string, keyType: 'InvoiceId' | 'PaymentId' = 'InvoiceId') {
    const cfg = await this.getConfig(orgId)
    if (!cfg?.apiToken) throw new BadRequestException('MyFatoorah is not configured.')
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
}
