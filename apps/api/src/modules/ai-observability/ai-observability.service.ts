import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

// Cost per 1000 tokens (input/output averaged) in USD
const MODEL_COST: Record<string, number> = {
  'gpt-4o': 0.005,
  'gpt-4o-mini': 0.00015,
  'claude-haiku-4-5-20251001': 0.00025,
  'claude-sonnet-4-6': 0.003,
  'claude-opus-4-8': 0.015,
  'gemini-1.5-flash': 0.000075,
  'gemini-2.0-flash': 0.0001,
  'llama-3.1-8b-instant': 0.00005,
}

export interface AILogEntry {
  orgId: string
  userId?: string
  module: string
  action: string
  provider: string
  model: string
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  latencyMs?: number
  success?: boolean
  errorType?: string
  escalated?: boolean
}

@Injectable()
export class AIObservabilityService {
  constructor(private prisma: PrismaService) {}

  async log(entry: AILogEntry): Promise<void> {
    const totalTokens = entry.totalTokens ?? (entry.promptTokens ?? 0) + (entry.completionTokens ?? 0)
    const costPer1k = MODEL_COST[entry.model] ?? 0.001
    const costUsd = (totalTokens / 1000) * costPer1k

    await this.prisma.$executeRaw`
      INSERT INTO ai_usage_logs (
        "id", "orgId", "userId", "module", "action", "provider", "model",
        "promptTokens", "completionTokens", "totalTokens", "costUsd",
        "latencyMs", "success", "errorType", "escalated", "createdAt"
      ) VALUES (
        gen_random_uuid(), ${entry.orgId}, ${entry.userId ?? null},
        ${entry.module}, ${entry.action}, ${entry.provider}, ${entry.model},
        ${entry.promptTokens ?? 0}, ${entry.completionTokens ?? 0}, ${totalTokens},
        ${costUsd}, ${entry.latencyMs ?? 0}, ${entry.success ?? true},
        ${entry.errorType ?? null}, ${entry.escalated ?? false}, NOW()
      )
    `
  }

  async getStats(orgId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const [totals, byProvider, byModule, byDay, recent] = await Promise.all([
      // Overall totals
      this.prisma.$queryRaw<any[]>`
        SELECT
          COUNT(*) as "totalCalls",
          SUM("totalTokens") as "totalTokens",
          SUM("costUsd") as "totalCostUsd",
          AVG("latencyMs") as "avgLatencyMs",
          COUNT(*) FILTER (WHERE success = false) as "errorCount",
          COUNT(*) FILTER (WHERE escalated = true) as "escalationCount",
          COUNT(*) FILTER (WHERE "userFeedback" = 'positive') as "positiveFeedback",
          COUNT(*) FILTER (WHERE "userFeedback" = 'negative') as "negativeFeedback"
        FROM ai_usage_logs
        WHERE "orgId" = ${orgId} AND "createdAt" >= ${since}::timestamp
      `,

      // By provider
      this.prisma.$queryRaw<any[]>`
        SELECT provider,
          COUNT(*) as calls,
          SUM("totalTokens") as tokens,
          SUM("costUsd") as cost,
          AVG("latencyMs") as "avgLatency"
        FROM ai_usage_logs
        WHERE "orgId" = ${orgId} AND "createdAt" >= ${since}::timestamp
        GROUP BY provider ORDER BY cost DESC
      `,

      // By module
      this.prisma.$queryRaw<any[]>`
        SELECT module,
          COUNT(*) as calls,
          SUM("totalTokens") as tokens,
          SUM("costUsd") as cost,
          COUNT(*) FILTER (WHERE escalated = true) as escalations
        FROM ai_usage_logs
        WHERE "orgId" = ${orgId} AND "createdAt" >= ${since}::timestamp
        GROUP BY module ORDER BY calls DESC
      `,

      // Daily cost trend
      this.prisma.$queryRaw<any[]>`
        SELECT DATE("createdAt") as date,
          COUNT(*) as calls,
          SUM("costUsd") as cost,
          SUM("totalTokens") as tokens
        FROM ai_usage_logs
        WHERE "orgId" = ${orgId} AND "createdAt" >= ${since}::timestamp
        GROUP BY DATE("createdAt") ORDER BY date ASC
      `,

      // Recent calls
      this.prisma.$queryRaw<any[]>`
        SELECT id, module, action, provider, model, "totalTokens", "costUsd",
          "latencyMs", success, escalated, "createdAt"
        FROM ai_usage_logs
        WHERE "orgId" = ${orgId}
        ORDER BY "createdAt" DESC LIMIT 20
      `,
    ])

    const t = totals[0] || {}
    const successRate = t.totalCalls > 0
      ? (((Number(t.totalCalls) - Number(t.errorCount)) / Number(t.totalCalls)) * 100).toFixed(1)
      : '100.0'
    const escalationRate = t.totalCalls > 0
      ? ((Number(t.escalationCount) / Number(t.totalCalls)) * 100).toFixed(1)
      : '0.0'

    return {
      summary: {
        totalCalls: Number(t.totalCalls ?? 0),
        totalTokens: Number(t.totalTokens ?? 0),
        totalCostUsd: parseFloat((Number(t.totalCostUsd ?? 0)).toFixed(4)),
        avgLatencyMs: Math.round(Number(t.avgLatencyMs ?? 0)),
        errorCount: Number(t.errorCount ?? 0),
        escalationCount: Number(t.escalationCount ?? 0),
        successRate: parseFloat(successRate),
        escalationRate: parseFloat(escalationRate),
        positiveFeedback: Number(t.positiveFeedback ?? 0),
        negativeFeedback: Number(t.negativeFeedback ?? 0),
      },
      byProvider: byProvider.map(r => ({
        provider: r.provider,
        calls: Number(r.calls),
        tokens: Number(r.tokens),
        cost: parseFloat(Number(r.cost).toFixed(4)),
        avgLatency: Math.round(Number(r.avgLatency)),
      })),
      byModule: byModule.map(r => ({
        module: r.module,
        calls: Number(r.calls),
        tokens: Number(r.tokens),
        cost: parseFloat(Number(r.cost).toFixed(4)),
        escalations: Number(r.escalations),
      })),
      dailyTrend: byDay.map(r => ({
        date: r.date,
        calls: Number(r.calls),
        cost: parseFloat(Number(r.cost).toFixed(4)),
        tokens: Number(r.tokens),
      })),
      recentCalls: recent,
    }
  }

  async getMasterStats(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const [totals, byOrg, byModel] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT
          COUNT(*) as "totalCalls",
          SUM("costUsd") as "totalCostUsd",
          SUM("totalTokens") as "totalTokens",
          COUNT(DISTINCT "orgId") as "activeOrgs"
        FROM ai_usage_logs WHERE "createdAt" >= ${since}::timestamp
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT o.name, l."orgId",
          COUNT(*) as calls,
          SUM(l."costUsd") as cost,
          SUM(l."totalTokens") as tokens
        FROM ai_usage_logs l
        JOIN organizations o ON o.id = l."orgId"
        WHERE l."createdAt" >= ${since}::timestamp
        GROUP BY l."orgId", o.name ORDER BY cost DESC LIMIT 20
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT model, provider,
          COUNT(*) as calls,
          SUM("costUsd") as cost
        FROM ai_usage_logs
        WHERE "createdAt" >= ${since}::timestamp
        GROUP BY model, provider ORDER BY cost DESC
      `,
    ])

    return {
      totals: {
        totalCalls: Number(totals[0]?.totalCalls ?? 0),
        totalCostUsd: parseFloat(Number(totals[0]?.totalCostUsd ?? 0).toFixed(4)),
        totalTokens: Number(totals[0]?.totalTokens ?? 0),
        activeOrgs: Number(totals[0]?.activeOrgs ?? 0),
      },
      byOrg: byOrg.map(r => ({
        name: r.name, orgId: r.orgId,
        calls: Number(r.calls),
        cost: parseFloat(Number(r.cost).toFixed(4)),
        tokens: Number(r.tokens),
      })),
      byModel: byModel.map(r => ({
        model: r.model, provider: r.provider,
        calls: Number(r.calls),
        cost: parseFloat(Number(r.cost).toFixed(4)),
      })),
    }
  }

  async recordFeedback(logId: string, feedback: 'positive' | 'negative') {
    await this.prisma.$executeRaw`
      UPDATE ai_usage_logs SET "userFeedback" = ${feedback} WHERE id = ${logId}
    `
    return { ok: true }
  }
}
