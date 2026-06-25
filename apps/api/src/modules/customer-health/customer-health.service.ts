import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

export interface HealthScore {
  orgId: string
  orgName: string
  plan: string
  engagementScore: number    // 0-100: login frequency, active users
  adoptionScore: number      // 0-100: features used / total features
  automationScore: number    // 0-100: workflows + chatbot usage
  aiUsageScore: number       // 0-100: AI calls relative to contacts
  churnRiskScore: number     // 0-100: HIGH = at risk (inverted)
  overallScore: number       // weighted average
  churnRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  signals: string[]          // human-readable risk signals
  lastActivity: string | null
}

@Injectable()
export class CustomerHealthService {
  constructor(private prisma: PrismaService) {}

  async getOrgHealth(orgId: string): Promise<HealthScore> {
    const scores = await this.computeScores()
    return scores.find(s => s.orgId === orgId) || this.emptyScore(orgId)
  }

  async getAllHealth(): Promise<HealthScore[]> {
    return this.computeScores()
  }

  private async computeScores(): Promise<HealthScore[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [orgs, recentActivity] = await Promise.all([
      // All orgs with counts
      this.prisma.$queryRaw<any[]>`
        SELECT
          o.id, o.name, o.plan, o."createdAt",
          (SELECT COUNT(*) FROM users u WHERE u."orgId" = o.id) as "userCount",
          (SELECT COUNT(*) FROM contacts c WHERE c."orgId" = o.id) as "contactCount",
          (SELECT COUNT(*) FROM conversations cv WHERE cv."orgId" = o.id) as "conversationCount",
          (SELECT COUNT(*) FROM campaigns ca WHERE ca."orgId" = o.id) as "campaignCount",
          (SELECT COUNT(*) FROM workflows w WHERE w."orgId" = o.id AND w."isActive" = true) as "activeWorkflows",
          (SELECT COUNT(*) FROM "ai_agents" a WHERE a."orgId" = o.id AND a."isActive" = true) as "activeAgents",
          (SELECT COUNT(*) FROM messages m
           JOIN conversations cv2 ON cv2.id = m."conversationId"
           WHERE cv2."orgId" = o.id AND m."createdAt" >= ${thirtyDaysAgo}::timestamp) as "recentMessages",
          (SELECT MAX(m2."createdAt") FROM messages m2
           JOIN conversations cv3 ON cv3.id = m2."conversationId"
           WHERE cv3."orgId" = o.id) as "lastActivity"
        FROM organizations o
        WHERE o."isActive" = true
        ORDER BY o."createdAt" DESC
      `,

      // AI usage in last 30 days
      this.prisma.$queryRaw<any[]>`
        SELECT "orgId", COUNT(*) as "aiCalls"
        FROM ai_usage_logs
        WHERE "createdAt" >= ${thirtyDaysAgo}::timestamp
        GROUP BY "orgId"
      `.catch(() => [] as any[]),
    ])

    const aiMap = new Map((recentActivity as any[]).map(r => [r.orgId, Number(r.aiCalls)]))

    return orgs.map(org => {
      const aiCalls = aiMap.get(org.id) || 0
      const contacts = Number(org.contactCount)
      const conversations = Number(org.conversationCount)
      const users = Number(org.userCount)
      const workflows = Number(org.activeWorkflows)
      const agents = Number(org.activeAgents)
      const campaigns = Number(org.campaignCount)
      const recentMessages = Number(org.recentMessages)
      const lastActivity = org.lastActivity ? new Date(org.lastActivity).toISOString() : null

      // Days since last activity
      const daysSinceActivity = lastActivity
        ? (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
        : 999

      // Engagement score (0-100): based on contacts, conversations, recent messages
      const engagementScore = Math.min(100, Math.round(
        (Math.min(contacts, 100) / 100) * 30 +
        (Math.min(conversations, 50) / 50) * 30 +
        (Math.min(recentMessages, 200) / 200) * 40
      ))

      // Adoption score (0-100): how many platform areas are being used
      const featuresUsed = [
        contacts > 0,
        conversations > 0,
        campaigns > 0,
        workflows > 0,
        agents > 0,
        aiCalls > 0,
      ].filter(Boolean).length
      const adoptionScore = Math.round((featuresUsed / 6) * 100)

      // Automation score (0-100): workflows + active agents
      const automationScore = Math.min(100, Math.round(
        (Math.min(workflows, 5) / 5) * 50 +
        (Math.min(agents, 3) / 3) * 50
      ))

      // AI usage score (0-100): AI calls relative to contact count
      const aiRatio = contacts > 0 ? aiCalls / contacts : 0
      const aiUsageScore = Math.min(100, Math.round(aiRatio * 50))

      // Overall score (weighted)
      const overallScore = Math.round(
        engagementScore * 0.35 +
        adoptionScore * 0.25 +
        automationScore * 0.20 +
        aiUsageScore * 0.20
      )

      // Churn risk signals
      const signals: string[] = []
      if (daysSinceActivity > 14) signals.push('No activity in 14+ days')
      if (daysSinceActivity > 7) signals.push('Low recent activity')
      if (contacts < 5) signals.push('Very few contacts')
      if (adoptionScore < 30) signals.push('Low feature adoption')
      if (automationScore === 0) signals.push('No automation set up')
      if (campaigns === 0) signals.push('No campaigns created')
      if (recentMessages === 0) signals.push('No messages in 30 days')

      // Churn risk: HIGH if overall < 30, MEDIUM if < 60
      const churnRiskScore = Math.max(0, 100 - overallScore)
      const churnRisk: 'LOW' | 'MEDIUM' | 'HIGH' =
        overallScore < 30 ? 'HIGH' :
        overallScore < 60 ? 'MEDIUM' : 'LOW'

      return {
        orgId: org.id,
        orgName: org.name,
        plan: org.plan,
        engagementScore,
        adoptionScore,
        automationScore,
        aiUsageScore,
        churnRiskScore,
        overallScore,
        churnRisk,
        signals,
        lastActivity,
      }
    })
  }

  async getSummary() {
    const scores = await this.computeScores()
    const total = scores.length
    const high = scores.filter(s => s.churnRisk === 'HIGH').length
    const medium = scores.filter(s => s.churnRisk === 'MEDIUM').length
    const low = scores.filter(s => s.churnRisk === 'LOW').length
    const avgScore = total > 0 ? Math.round(scores.reduce((sum, s) => sum + s.overallScore, 0) / total) : 0

    return {
      total, high, medium, low, avgScore,
      atRisk: scores.filter(s => s.churnRisk !== 'LOW').sort((a, b) => a.overallScore - b.overallScore),
      healthiest: scores.filter(s => s.churnRisk === 'LOW').sort((a, b) => b.overallScore - a.overallScore).slice(0, 5),
    }
  }

  private emptyScore(orgId: string): HealthScore {
    return {
      orgId, orgName: 'Unknown', plan: 'STARTER',
      engagementScore: 0, adoptionScore: 0, automationScore: 0, aiUsageScore: 0,
      churnRiskScore: 100, overallScore: 0, churnRisk: 'HIGH', signals: ['No data'], lastActivity: null,
    }
  }
}
