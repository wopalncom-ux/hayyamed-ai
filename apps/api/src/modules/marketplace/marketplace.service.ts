import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class MarketplaceService {
  constructor(private prisma: PrismaService) {}

  async list(opts: { category?: string; industry?: string; search?: string; featured?: boolean } = {}) {
    const { category, industry, search, featured } = opts
    const conditions: string[] = [`"isPublished" = true`]
    const params: any[] = []

    if (category) { params.push(category); conditions.push(`category = $${params.length}`) }
    if (industry) { params.push(industry); conditions.push(`(industry = $${params.length} OR industry IS NULL)`) }
    if (featured) conditions.push(`"isFeatured" = true`)
    if (search) {
      params.push(`%${search}%`)
      conditions.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`)
    }

    const where = conditions.join(' AND ')
    const sql = `SELECT * FROM marketplace_items WHERE ${where} ORDER BY "isFeatured" DESC, downloads DESC, "createdAt" DESC`
    return this.prisma.$queryRawUnsafe<any[]>(sql, ...params)
  }

  async getItem(id: string) {
    const items = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM marketplace_items WHERE id = ${id} AND "isPublished" = true
    `
    if (!items[0]) throw new NotFoundException('Item not found')
    return items[0]
  }

  async install(orgId: string, itemId: string) {
    const item = await this.getItem(itemId)

    // Check already installed
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM marketplace_installs WHERE "orgId" = ${orgId} AND "itemId" = ${itemId}
    `
    if (existing[0]) throw new ConflictException('Already installed')

    await this.prisma.$executeRaw`
      INSERT INTO marketplace_installs ("id","orgId","itemId","createdAt")
      VALUES (gen_random_uuid(), ${orgId}, ${itemId}, NOW())
    `

    await this.prisma.$executeRaw`
      UPDATE marketplace_items SET downloads = downloads + 1 WHERE id = ${itemId}
    `

    return { installed: true, item }
  }

  async uninstall(orgId: string, itemId: string) {
    await this.prisma.$executeRaw`
      DELETE FROM marketplace_installs WHERE "orgId" = ${orgId} AND "itemId" = ${itemId}
    `
    return { uninstalled: true }
  }

  async getInstalled(orgId: string) {
    return this.prisma.$queryRaw<any[]>`
      SELECT i.*, m.name, m.description, m.category, m.type, m."authorName", m.data, m.thumbnail
      FROM marketplace_installs i
      JOIN marketplace_items m ON m.id = i."itemId"
      WHERE i."orgId" = ${orgId}
      ORDER BY i."createdAt" DESC
    `
  }

  async rate(orgId: string, itemId: string, rating: number) {
    if (rating < 1 || rating > 5) throw new Error('Rating must be 1-5')

    // Simple average update — for production use a ratings table
    await this.prisma.$executeRaw`
      UPDATE marketplace_items
      SET rating = (rating * "ratingCount" + ${rating}) / ("ratingCount" + 1),
          "ratingCount" = "ratingCount" + 1
      WHERE id = ${itemId}
    `
    return { rated: true }
  }

  async getStats() {
    const [totals, byCategory, topDownloaded] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as items, SUM(downloads) as "totalInstalls",
          COUNT(*) FILTER (WHERE "isFeatured") as featured
        FROM marketplace_items WHERE "isPublished" = true
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT category, COUNT(*) as count, SUM(downloads) as installs
        FROM marketplace_items WHERE "isPublished" = true
        GROUP BY category ORDER BY count DESC
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT id, name, category, downloads, rating FROM marketplace_items
        WHERE "isPublished" = true ORDER BY downloads DESC LIMIT 5
      `,
    ])

    return {
      totalItems: Number(totals[0]?.items ?? 0),
      totalInstalls: Number(totals[0]?.totalInstalls ?? 0),
      featuredItems: Number(totals[0]?.featured ?? 0),
      byCategory: byCategory.map(c => ({ category: c.category, count: Number(c.count), installs: Number(c.installs) })),
      topDownloaded,
    }
  }

  // Admin: publish/unpublish, feature/unfeature
  async adminUpdate(id: string, data: { isPublished?: boolean; isFeatured?: boolean; price?: number }) {
    await this.prisma.$executeRaw`
      UPDATE marketplace_items
      SET "isPublished" = COALESCE(${data.isPublished}, "isPublished"),
          "isFeatured" = COALESCE(${data.isFeatured}, "isFeatured"),
          price = COALESCE(${data.price}, price),
          "updatedAt" = NOW()
      WHERE id = ${id}
    `
    return this.getItem(id)
  }
}
