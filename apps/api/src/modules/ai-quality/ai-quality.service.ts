import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

export interface AIQualityScore {
  orgId: string
  orgName: string
  totalCalls: number
  successRate: number        // % calls that succeeded
  escalationRate: number     // % calls that were escalated to human
  positiveFeedbackRate: number // % of rated calls with positive feedback
  negativeFeedbackRate: number
  avgLatencyMs: number
  feedbackCoverage: number   // % of calls that have feedback
  qualityScore: number       // 0-100 composite
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  byModule: { module: string; calls: number; successRate: number; escalationRate: number }[]
  topErrors: { errorType: string; count: number }[]
}

@Injectable()
export class AIQualityService {
  constructor(private prisma: PrismaService) {}

  async getOrgQuality(orgId: string, days = 30): Promise<AIQualityScore> {
    const scores = await this.computeScores(days)
    const found = scores.find(s => s.orgId === orgId)
    if (!found) return this.emptyScore(orgId, '')
    return found
  }

  async getAllQuality(days = 30): Promise<AIQualityScore[]> {
    return this.computeScores(days)
  }

  async getPlatformQuality(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const [totals, byModule, byModel, topErrors, feedbackDist, dailyTrend] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT
          COUNT(*) as "totalCalls",
          COUNT(*) FILTER (WHERE success = true) as "successCalls",
          COUNT(*) FILTER (WHERE escalated = true) as "escalations",
          COUNT(*) FILTER (WHERE "userFeedback" = 'positive') as "positive",
          COUNT(*) FILTER (WHERE "userFeedback" = 'negative') as "negative",
          COUNT(*) FILTER (WHERE "userFeedback" IS NOT NULL) as "rated",
          AVG("latencyMs") as "avgLatency",
          AVG("totalTokens") as "avgTokens"
        FROM ai_usage_logs WHERE "createdAt" >= ${since}::timestamp
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT module,
          COUNT(*) as calls,
          COUNT(*) FILTER (WHERE success = true) as "successCalls",
          COUNT(*) FILTER (WHERE escalated = true) as escalations,
          AVG("latencyMs") as "avgLatency",
          SUM("costUsd") as cost
        FROM ai_usage_logs WHERE "createdAt" >= ${since}::timestamp
        GROUP BY module ORDER BY calls DESC
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT model, provider,
          COUNT(*) as calls,
          COUNT(*) FILTER (WHERE success = true) as "successCalls",
          AVG("latencyMs") as "avgLatency"
        FROM ai_usage_logs WHERE "createdAt" >= ${since}::timestamp
        GROUP BY model, provider ORDER BY calls DESC
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT "errorType", COUNT(*) as count
        FROM ai_usage_logs
        WHERE "createdAt" >= ${since}::timestamp AND "errorType" IS NOT NULL
        GROUP BY "errorType" ORDER BY count DESC LIMIT 10
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT "userFeedback", COUNT(*) as count
        FROM ai_usage_logs
        WHERE "createdAt" >= ${since}::timestamp AND "userFeedback" IS NOT NULL
        GROUP BY "userFeedback"
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT DATE("createdAt") as date,
          COUNT(*) as calls,
          COUNT(*) FILTER (WHERE success = true) as "successCalls",
          COUNT(*) FILTER (WHERE escalated = true) as escalations
        FROM ai_usage_logs WHERE "createdAt" >= ${since}::timestamp
        GROUP BY DATE("createdAt") ORDER BY date ASC
      `,
    ])

    const t = totals[0] || {}
    const total = Number(t.totalCalls || 0)
    const successRate = total > 0 ? (Number(t.successCalls) / total) * 100 : 100
    const escalationRate = total > 0 ? (Number(t.escalations) / total) * 100 : 0
    const rated = Number(t.rated || 0)
    const posRate = rated > 0 ? (Number(t.positive) / rated) * 100 : 0
    const negRate = rated > 0 ? (Number(t.negative) / rated) * 100 : 0
    const qualityScore = this.calcQualityScore(successRate, escalationRate, posRate, negRate)

    return {
      platform: {
        totalCalls: total,
        successRate: parseFloat(successRate.toFixed(1)),
        escalationRate: parseFloat(escalationRate.toFixed(1)),
        positiveFeedbackRate: parseFloat(posRate.toFixed(1)),
        negativeFeedbackRate: parseFloat(negRate.toFixed(1)),
        avgLatencyMs: Math.round(Number(t.avgLatency || 0)),
        avgTokens: Math.round(Number(t.avgTokens || 0)),
        feedbackCoverage: total > 0 ? parseFloat(((rated / total) * 100).toFixed(1)) : 0,
        qualityScore,
        grade: this.grade(qualityScore),
      },
      byModule: byModule.map(m => ({
        module: m.module,
        calls: Number(m.calls),
        successRate: Number(m.calls) > 0 ? parseFloat(((Number(m.successCalls) / Number(m.calls)) * 100).toFixed(1)) : 100,
        escalationRate: Number(m.calls) > 0 ? parseFloat(((Number(m.escalations) / Number(m.calls)) * 100).toFixed(1)) : 0,
        avgLatency: Math.round(Number(m.avgLatency || 0)),
        cost: parseFloat(Number(m.cost || 0).toFixed(4)),
      })),
      byModel: byModel.map(m => ({
        model: m.model, provider: m.provider,
        calls: Number(m.calls),
        successRate: Number(m.calls) > 0 ? parseFloat(((Number(m.successCalls) / Number(m.calls)) * 100).toFixed(1)) : 100,
        avgLatency: Math.round(Number(m.avgLatency || 0)),
      })),
      topErrors: topErrors.map(e => ({ errorType: e.errorType, count: Number(e.count) })),
      feedbackDistribution: feedbackDist.map(f => ({ feedback: f.userFeedback, count: Number(f.count) })),
      dailyTrend: dailyTrend.map(d => ({
        date: d.date,
        calls: Number(d.calls),
        successRate: Number(d.calls) > 0 ? parseFloat(((Number(d.successCalls) / Number(d.calls)) * 100).toFixed(1)) : 100,
        escalations: Number(d.escalations),
      })),
    }
  }

  private async computeScores(days: number): Promise<AIQualityScore[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const [orgsData, byModule] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT l."orgId", o.name as "orgName",
          COUNT(*) as "totalCalls",
          COUNT(*) FILTER (WHERE l.success = true) as "successCalls",
          COUNT(*) FILTER (WHERE l.escalated = true) as escalations,
          COUNT(*) FILTER (WHERE l."userFeedback" = 'positive') as positive,
          COUNT(*) FILTER (WHERE l."userFeedback" = 'negative') as negative,
          COUNT(*) FILTER (WHERE l."userFeedback" IS NOT NULL) as rated,
          AVG(l."latencyMs") as "avgLatency"
        FROM ai_usage_logs l
        JOIN organizations o ON o.id = l."orgId"
        WHERE l."createdAt" >= ${since}::timestamp
        GROUP BY l."orgId", o.name
        ORDER BY "totalCalls" DESC
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT "orgId", module,
          COUNT(*) as calls,
          COUNT(*) FILTER (WHERE success = true) as "successCalls",
          COUNT(*) FILTER (WHERE escalated = true) as escalations
        FROM ai_usage_logs WHERE "createdAt" >= ${since}::timestamp
        GROUP BY "orgId", module
      `,
    ])

    const moduleMap = new Map<string, any[]>()
    byModule.forEach(r => {
      if (!moduleMap.has(r.orgId)) moduleMap.set(r.orgId, [])
      moduleMap.get(r.orgId)!.push(r)
    })

    return orgsData.map(org => {
      const total = Number(org.totalCalls)
      const successRate = total > 0 ? (Number(org.successCalls) / total) * 100 : 100
      const escalationRate = total > 0 ? (Number(org.escalations) / total) * 100 : 0
      const rated = Number(org.rated)
      const posRate = rated > 0 ? (Number(org.positive) / rated) * 100 : 0
      const negRate = rated > 0 ? (Number(org.negative) / rated) * 100 : 0
      const qualityScore = this.calcQualityScore(successRate, escalationRate, posRate, negRate)
      const modules = (moduleMap.get(org.orgId) || []).map(m => ({
        module: m.module,
        calls: Number(m.calls),
        successRate: Number(m.calls) > 0 ? parseFloat(((Number(m.successCalls) / Number(m.calls)) * 100).toFixed(1)) : 100,
        escalationRate: Number(m.calls) > 0 ? parseFloat(((Number(m.escalations) / Number(m.calls)) * 100).toFixed(1)) : 0,
      }))

      return {
        orgId: org.orgId,
        orgName: org.orgName,
        totalCalls: total,
        successRate: parseFloat(successRate.toFixed(1)),
        escalationRate: parseFloat(escalationRate.toFixed(1)),
        positiveFeedbackRate: parseFloat(posRate.toFixed(1)),
        negativeFeedbackRate: parseFloat(negRate.toFixed(1)),
        avgLatencyMs: Math.round(Number(org.avgLatency || 0)),
        feedbackCoverage: total > 0 ? parseFloat(((rated / total) * 100).toFixed(1)) : 0,
        qualityScore,
        grade: this.grade(qualityScore),
        byModule: modules,
        topErrors: [],
      }
    })
  }

  private calcQualityScore(successRate: number, escalationRate: number, posRate: number, negRate: number): number {
    const successComponent = successRate * 0.40
    const escalationComponent = Math.max(0, (100 - escalationRate * 5)) * 0.30
    const feedbackComponent = posRate > 0 ? (posRate - negRate * 0.5) * 0.30 : 70 * 0.30
    return Math.min(100, Math.max(0, Math.round(successComponent + escalationComponent + feedbackComponent)))
  }

  private grade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A'
    if (score >= 75) return 'B'
    if (score >= 60) return 'C'
    if (score >= 40) return 'D'
    return 'F'
  }

  private emptyScore(orgId: string, orgName: string): AIQualityScore {
    return {
      orgId, orgName, totalCalls: 0, successRate: 0, escalationRate: 0,
      positiveFeedbackRate: 0, negativeFeedbackRate: 0, avgLatencyMs: 0,
      feedbackCoverage: 0, qualityScore: 0, grade: 'F', byModule: [], topErrors: [],
    }
  }
}
