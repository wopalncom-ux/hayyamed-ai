import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

export type AuditCategory = 'auth' | 'user' | 'contact' | 'conversation' | 'campaign' | 'workflow' | 'ai' | 'billing' | 'admin' | 'security' | 'api' | 'integration' | 'system'

export interface AuditEntry {
  orgId: string
  userId?: string
  action: string          // e.g. 'contact.created', 'user.login', 'campaign.sent'
  category: AuditCategory
  resource: string        // table/entity name
  resourceId?: string
  before?: Record<string, any>
  after?: Record<string, any>
  ip?: string
  userAgent?: string
  metadata?: Record<string, any>
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO audit_logs ("id","orgId","userId","action","resource","resourceId","before","after","ip","userAgent","createdAt")
        VALUES (
          gen_random_uuid(),
          ${entry.orgId},
          ${entry.userId ?? null},
          ${entry.action},
          ${entry.resource},
          ${entry.resourceId ?? null},
          ${entry.before ? JSON.stringify(entry.before) : null}::jsonb,
          ${entry.after ? JSON.stringify({ ...entry.after, ...(entry.metadata || {}) }) : entry.metadata ? JSON.stringify(entry.metadata) : null}::jsonb,
          ${entry.ip ?? null},
          ${entry.userAgent ?? null},
          NOW()
        )
      `
    } catch {
      // Audit logging must never crash the main flow
    }
  }

  async getOrgLogs(orgId: string, opts: { action?: string; category?: string; userId?: string; page?: number; limit?: number } = {}) {
    const { action, category, userId, page = 1, limit = 50 } = opts
    const offset = (page - 1) * limit
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

    const [logs, total] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT l.*, u.name as "userName", u.email as "userEmail"
        FROM audit_logs l
        LEFT JOIN users u ON u.id = l."userId"
        WHERE l."orgId" = ${orgId}
          AND l."createdAt" >= ${since}::timestamp
          ${action ? this.prisma.$queryRaw`AND l.action LIKE ${`%${action}%`}` : this.prisma.$queryRaw``}
          ${userId ? this.prisma.$queryRaw`AND l."userId" = ${userId}` : this.prisma.$queryRaw``}
        ORDER BY l."createdAt" DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as total FROM audit_logs WHERE "orgId" = ${orgId} AND "createdAt" >= ${since}::timestamp
      `,
    ])

    return { data: logs, total: Number((total[0] as any)?.total ?? 0), page, limit }
  }

  async getPlatformLogs(opts: { action?: string; orgId?: string; category?: string; page?: number; limit?: number } = {}) {
    const { action, orgId, page = 1, limit = 100 } = opts
    const offset = (page - 1) * limit
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [logs, total, stats] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT l.*, u.name as "userName", u.email as "userEmail", o.name as "orgName"
        FROM audit_logs l
        LEFT JOIN users u ON u.id = l."userId"
        LEFT JOIN organizations o ON o.id = l."orgId"
        WHERE l."createdAt" >= ${since}::timestamp
          ${orgId ? this.prisma.$queryRaw`AND l."orgId" = ${orgId}` : this.prisma.$queryRaw``}
          ${action ? this.prisma.$queryRaw`AND l.action LIKE ${`%${action}%`}` : this.prisma.$queryRaw``}
        ORDER BY l."createdAt" DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as total FROM audit_logs WHERE "createdAt" >= ${since}::timestamp
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT action, COUNT(*) as count
        FROM audit_logs WHERE "createdAt" >= ${since}::timestamp
        GROUP BY action ORDER BY count DESC LIMIT 15
      `,
    ])

    return {
      data: logs,
      total: Number((total[0] as any)?.total ?? 0),
      page, limit,
      topActions: stats.map(s => ({ action: s.action, count: Number(s.count) })),
    }
  }

  async getPlatformStats(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const [totals, byCategory, byDay, recentSecurityEvents] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT
          COUNT(*) as total,
          COUNT(DISTINCT "orgId") as orgs,
          COUNT(DISTINCT "userId") as users
        FROM audit_logs WHERE "createdAt" >= ${since}::timestamp
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT
          CASE
            WHEN action LIKE 'auth.%' THEN 'auth'
            WHEN action LIKE 'user.%' THEN 'user'
            WHEN action LIKE 'contact.%' THEN 'contact'
            WHEN action LIKE 'conversation.%' THEN 'conversation'
            WHEN action LIKE 'campaign.%' THEN 'campaign'
            WHEN action LIKE 'workflow.%' THEN 'workflow'
            WHEN action LIKE 'ai.%' THEN 'ai'
            WHEN action LIKE 'billing.%' THEN 'billing'
            WHEN action LIKE 'admin.%' THEN 'admin'
            WHEN action LIKE 'security.%' THEN 'security'
            ELSE 'other'
          END as category,
          COUNT(*) as count
        FROM audit_logs WHERE "createdAt" >= ${since}::timestamp
        GROUP BY category ORDER BY count DESC
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT DATE("createdAt") as date, COUNT(*) as count
        FROM audit_logs WHERE "createdAt" >= ${since}::timestamp
        GROUP BY DATE("createdAt") ORDER BY date ASC
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT * FROM audit_logs
        WHERE "createdAt" >= ${since}::timestamp
          AND (action LIKE 'security.%' OR action LIKE 'auth.failed%' OR action LIKE 'admin.%')
        ORDER BY "createdAt" DESC LIMIT 10
      `,
    ])

    return {
      total: Number(totals[0]?.total ?? 0),
      activeOrgs: Number(totals[0]?.orgs ?? 0),
      activeUsers: Number(totals[0]?.users ?? 0),
      byCategory: byCategory.map(c => ({ category: c.category, count: Number(c.count) })),
      dailyTrend: byDay.map(d => ({ date: d.date, count: Number(d.count) })),
      recentSecurityEvents,
    }
  }
}
