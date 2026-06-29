import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect()
      await this.applyAdditiveColumns()
    } catch {
      // ignore connection errors in lightweight dev mode
    }
  }

  // Idempotent, additive-only safeguard for columns that ship without a full
  // migration run (deploys don't auto-migrate). Safe to run on every boot.
  private async applyAdditiveColumns() {
    try {
      await this.$executeRawUnsafe(
        'ALTER TABLE "org_settings" ADD COLUMN IF NOT EXISTS "leadServices" JSONB'
      )
    } catch {
      // never block startup on a best-effort DDL
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect()
    } catch {}
  }
}
