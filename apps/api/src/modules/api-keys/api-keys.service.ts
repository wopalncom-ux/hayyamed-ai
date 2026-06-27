import { Injectable } from '@nestjs/common'
import { randomUUID, randomBytes } from 'crypto'
import { PrismaService } from '../../database/prisma.service'

// Per-org API keys for the public inbound API. Keys are high-entropy random
// tokens (shown in full once on creation, masked thereafter).
@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  private mask(key: string) {
    return key.length > 12 ? `${key.slice(0, 7)}…${key.slice(-4)}` : key
  }

  async list(orgId: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT "id","name","key","lastUsedAt","createdAt" FROM "api_keys"
      WHERE "orgId" = ${orgId} ORDER BY "createdAt" DESC
    `
    return rows.map(r => ({ ...r, key: this.mask(r.key) }))
  }

  async create(orgId: string, name?: string) {
    const key = 'hk_' + randomBytes(24).toString('hex')
    const id = randomUUID()
    await this.prisma.$executeRaw`
      INSERT INTO "api_keys" ("id","orgId","name","key","createdAt")
      VALUES (${id}, ${orgId}, ${(name || 'API key').slice(0, 60)}, ${key}, NOW())
    `
    // Full key returned once; the client must store it now.
    return { id, name: name || 'API key', key }
  }

  async remove(orgId: string, id: string) {
    await this.prisma.$executeRaw`DELETE FROM "api_keys" WHERE "id" = ${id} AND "orgId" = ${orgId}`
    return { ok: true }
  }

  // Used by the API-key guard: resolve a key to its org and touch lastUsedAt.
  async resolveOrg(key: string): Promise<string | null> {
    if (!key) return null
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT "id","orgId" FROM "api_keys" WHERE "key" = ${key} LIMIT 1
    `
    if (!rows.length) return null
    this.prisma.$executeRaw`UPDATE "api_keys" SET "lastUsedAt" = NOW() WHERE "id" = ${rows[0].id}`.catch(() => {})
    return rows[0].orgId
  }
}
