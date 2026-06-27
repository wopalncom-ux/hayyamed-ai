import { Injectable, BadRequestException } from '@nestjs/common'
import { randomUUID, createHmac } from 'crypto'
import axios from 'axios'
import { PrismaService } from '../../database/prisma.service'

// Outbound webhooks — per-org HTTP endpoints notified on platform events.
// Raw-SQL backed (org_webhooks, migration 20260627000013).
@Injectable()
export class WebhooksService {
  list(orgId: string) {
    return this.prisma.$queryRaw`
      SELECT "id","url","events","isActive","createdAt" FROM "org_webhooks"
      WHERE "orgId" = ${orgId} ORDER BY "createdAt" DESC
    `
  }

  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: { url: string; events?: string; secret?: string }) {
    const url = (dto?.url || '').trim()
    if (!/^https?:\/\//i.test(url)) throw new BadRequestException('A valid http(s) URL is required')
    const id = randomUUID()
    await this.prisma.$executeRaw`
      INSERT INTO "org_webhooks" ("id","orgId","url","events","secret","isActive","createdAt")
      VALUES (${id}, ${orgId}, ${url}, ${dto.events || '*'}, ${dto.secret || null}, true, NOW())
    `
    return { id, url, events: dto.events || '*', isActive: true }
  }

  async remove(orgId: string, id: string) {
    await this.prisma.$executeRaw`DELETE FROM "org_webhooks" WHERE "id" = ${id} AND "orgId" = ${orgId}`
    return { ok: true }
  }

  // Deliver a single payload to a URL, signed with the optional secret.
  private async deliver(url: string, secret: string | null, event: string, payload: any) {
    const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() })
    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'X-Hayya-Event': event }
    if (secret) headers['X-Hayya-Signature'] = createHmac('sha256', secret).update(body).digest('hex')
    const res = await axios.post(url, body, { headers, timeout: 8000, validateStatus: () => true })
    return res.status
  }

  // Fire an event to all active webhooks for an org (best-effort, non-blocking).
  async dispatch(orgId: string, event: string, payload: any) {
    try {
      const hooks = await this.prisma.$queryRaw<any[]>`
        SELECT "url","events","secret" FROM "org_webhooks" WHERE "orgId" = ${orgId} AND "isActive" = true
      `
      await Promise.all(
        hooks
          .filter(h => h.events === '*' || String(h.events).split(',').map(s => s.trim()).includes(event))
          .map(h => this.deliver(h.url, h.secret, event, payload).catch(() => null)),
      )
    } catch { /* best-effort */ }
  }

  // Send a sample payload to a URL so owners can verify their endpoint.
  async test(url: string) {
    if (!/^https?:\/\//i.test(url || '')) throw new BadRequestException('A valid http(s) URL is required')
    const status = await this.deliver(url, null, 'test', { message: 'Hayya AI test webhook' }).catch(() => 0)
    return { delivered: status >= 200 && status < 300, status }
  }
}
