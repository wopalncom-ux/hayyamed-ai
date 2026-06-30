import { Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { PrismaService } from '../../database/prisma.service'

// Stores campaign media (images/short videos) as bytea in Postgres so it stays in
// me-central1 (Qatar data residency) with no extra storage infra, and is served from
// a public URL that WhatsApp/Meta can fetch when broadcasting.
@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  async save(orgId: string, filename: string, mimeType: string, data: Buffer): Promise<string> {
    const id = randomUUID()
    await this.prisma.$executeRaw`
      INSERT INTO "media_assets" ("id","orgId","filename","mimeType","data","size","createdAt")
      VALUES (${id}::uuid, ${orgId}, ${filename}, ${mimeType}, ${data}, ${data.length}, now())`
    return id
  }

  async get(id: string): Promise<{ mimeType: string; data: Buffer } | null> {
    try {
      const rows = await this.prisma.$queryRaw<Array<{ mimeType: string; data: Buffer }>>`
        SELECT "mimeType", "data" FROM "media_assets" WHERE "id" = ${id}::uuid LIMIT 1`
      return rows[0] || null
    } catch {
      return null
    }
  }
}
