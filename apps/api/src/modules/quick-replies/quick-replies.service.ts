import { Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { PrismaService } from '../../database/prisma.service'

// Saved Replies (canned responses) — reusable inbox snippets, scoped per org.
// Raw-SQL backed (table created by migration 20260627000010), mirroring the
// feature_flags / marketplace pattern.
@Injectable()
export class QuickRepliesService {
  constructor(private prisma: PrismaService) {}

  list(orgId: string) {
    return this.prisma.$queryRaw`
      SELECT * FROM "quick_replies" WHERE "orgId" = ${orgId} ORDER BY "updatedAt" DESC
    `
  }

  async findOne(orgId: string, id: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM "quick_replies" WHERE "id" = ${id} AND "orgId" = ${orgId} LIMIT 1
    `
    if (!rows.length) throw new NotFoundException('Saved reply not found')
    return rows[0]
  }

  async create(orgId: string, dto: { title: string; content: string }) {
    const id = randomUUID()
    await this.prisma.$executeRaw`
      INSERT INTO "quick_replies" ("id","orgId","title","content","createdAt","updatedAt")
      VALUES (${id}, ${orgId}, ${dto.title}, ${dto.content}, NOW(), NOW())
    `
    return this.findOne(orgId, id)
  }

  async update(orgId: string, id: string, dto: { title?: string; content?: string }) {
    const existing = await this.findOne(orgId, id)
    const title = dto.title ?? existing.title
    const content = dto.content ?? existing.content
    await this.prisma.$executeRaw`
      UPDATE "quick_replies" SET "title" = ${title}, "content" = ${content}, "updatedAt" = NOW()
      WHERE "id" = ${id} AND "orgId" = ${orgId}
    `
    return this.findOne(orgId, id)
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id) // 404 if not owned by this org
    await this.prisma.$executeRaw`
      DELETE FROM "quick_replies" WHERE "id" = ${id} AND "orgId" = ${orgId}
    `
    return { ok: true }
  }
}
