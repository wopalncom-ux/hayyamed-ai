import { Injectable, BadRequestException } from '@nestjs/common'
import axios from 'axios'
import { PrismaService } from '../../database/prisma.service'
import { encryptJson, decryptJson } from '../../common/crypto/crypto.util'

@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  // Verify credentials against the provider so we never report a "connected"
  // integration that doesn't actually work. Returns true when verified, false
  // when we can't verify server-side (e.g. OAuth-only providers) — those are
  // saved as "configured" rather than claimed as verified. Throws on a real
  // auth failure so the UI shows the error instead of a fake success.
  private async verifyCredentials(type: string, c: Record<string, string>): Promise<boolean> {
    try {
      if (type === 'calendly') {
        if (!c.calendly_token) throw new Error('Personal access token is required')
        await axios.get('https://api.calendly.com/users/me', { headers: { Authorization: `Bearer ${c.calendly_token}` }, timeout: 12000 })
        return true
      }
      if (type === 'openai') {
        if (!c.openai_key) throw new Error('API key is required')
        await axios.get('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${c.openai_key}` }, timeout: 12000 })
        return true
      }
      if (type === 'sendgrid') {
        if (!c.sendgrid_key) throw new Error('API key is required')
        await axios.get('https://api.sendgrid.com/v3/scopes', { headers: { Authorization: `Bearer ${c.sendgrid_key}` }, timeout: 12000 })
        return true
      }
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 401 || status === 403) throw new BadRequestException('Those credentials were rejected by the provider — please check and try again.')
      throw new BadRequestException(e?.message?.includes('required') ? e.message : 'Could not verify the credentials with the provider. Check them and retry.')
    }
    return false // provider we don't verify server-side
  }

  async list(orgId: string) {
    const rows = await this.prisma.integration.findMany({
      where: { orgId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, type: true, name: true, status: true, config: true, lastSyncAt: true, updatedAt: true },
    })
    // Decrypt credentials for the owner UI (tolerant of legacy plaintext rows).
    return rows.map(r => ({ ...r, config: decryptJson(r.config) }))
  }

  async upsert(orgId: string, type: string, dto: { name: string; credentials: Record<string, string> }) {
    // Verify against the provider first — throws on bad credentials.
    const verified = await this.verifyCredentials(type, dto.credentials || {})
    const status = verified ? 'active' : 'configured'
    const encrypted = encryptJson(dto.credentials) as any // { _enc: "..." }
    const existing = await this.prisma.integration.findFirst({ where: { orgId, type } })
    if (existing) {
      return this.prisma.integration.update({
        where: { id: existing.id },
        data: { name: dto.name, config: encrypted, status, lastSyncAt: new Date() },
      })
    }
    return this.prisma.integration.create({
      data: { orgId, type, name: dto.name, config: encrypted, status, lastSyncAt: new Date() },
    })
  }

  async disconnect(orgId: string, type: string) {
    const existing = await this.prisma.integration.findFirst({ where: { orgId, type } })
    if (!existing) return { type, status: 'disconnected' }
    return this.prisma.integration.update({
      where: { id: existing.id },
      data: { status: 'disconnected' },
    })
  }
}
