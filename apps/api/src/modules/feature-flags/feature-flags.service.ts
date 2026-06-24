import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class FeatureFlagsService {
  private cache: Map<string, any> = new Map()
  private cacheExpiry = 0

  constructor(private prisma: PrismaService) {}

  private async getAll() {
    const now = Date.now()
    if (now < this.cacheExpiry && this.cache.size > 0) return this.cache

    const flags = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM feature_flags ORDER BY category, name
    `
    this.cache = new Map(flags.map(f => [f.key, f]))
    this.cacheExpiry = now + 30000 // 30s cache
    return this.cache
  }

  async getFlags() {
    const flags = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM feature_flags ORDER BY category, name
    `
    return flags
  }

  async getFlagsForOrg(orgId: string, plan: string) {
    const [flags, overrides] = await Promise.all([
      this.prisma.$queryRaw<any[]>`SELECT * FROM feature_flags ORDER BY category, name`,
      this.prisma.$queryRaw<any[]>`SELECT * FROM org_feature_flags WHERE "orgId" = ${orgId}`,
    ])

    const overrideMap = new Map(overrides.map(o => [o.flagKey, o.isEnabled]))
    const planOrder = { STARTER: 0, GROWTH: 1, ENTERPRISE: 2 }
    const orgPlanLevel = planOrder[plan] ?? 0

    return flags.map(f => {
      const flagPlanLevel = planOrder[f.minPlan] ?? 0
      const planAllowed = orgPlanLevel >= flagPlanLevel
      const override = overrideMap.get(f.key)
      const enabled = override !== undefined ? override : (f.isEnabled && planAllowed)
      return { ...f, enabled, planAllowed, hasOverride: override !== undefined }
    })
  }

  async isEnabled(key: string, orgId: string, plan: string): Promise<boolean> {
    const flags = await this.getFlagsForOrg(orgId, plan)
    const flag = flags.find(f => f.key === key)
    return flag?.enabled ?? false
  }

  async updateFlag(key: string, data: { isEnabled?: boolean; minPlan?: string; isBeta?: boolean }) {
    this.cache.clear()
    await this.prisma.$executeRaw`
      UPDATE feature_flags SET
        "isEnabled" = COALESCE(${data.isEnabled}, "isEnabled"),
        "minPlan" = COALESCE(${data.minPlan}, "minPlan"),
        "isBeta" = COALESCE(${data.isBeta}, "isBeta"),
        "updatedAt" = NOW()
      WHERE key = ${key}
    `
    return this.getFlags()
  }

  async setOrgOverride(orgId: string, flagKey: string, isEnabled: boolean) {
    this.cache.clear()
    await this.prisma.$executeRaw`
      INSERT INTO org_feature_flags ("id", "orgId", "flagKey", "isEnabled", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${orgId}, ${flagKey}, ${isEnabled}, NOW(), NOW())
      ON CONFLICT ("orgId", "flagKey") DO UPDATE SET "isEnabled" = ${isEnabled}, "updatedAt" = NOW()
    `
    return { orgId, flagKey, isEnabled }
  }

  async removeOrgOverride(orgId: string, flagKey: string) {
    this.cache.clear()
    await this.prisma.$executeRaw`
      DELETE FROM org_feature_flags WHERE "orgId" = ${orgId} AND "flagKey" = ${flagKey}
    `
    return { removed: true }
  }

  async getOrgOverrides(orgId: string) {
    return this.prisma.$queryRaw<any[]>`
      SELECT * FROM org_feature_flags WHERE "orgId" = ${orgId}
    `
  }
}
