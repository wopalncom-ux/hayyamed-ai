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
    try {
      // Client-portal role (ADD VALUE can't run in a tx; IF NOT EXISTS is idempotent)
      await this.$executeRawUnsafe(`ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CLIENT'`)
    } catch {
      // already exists / older PG — best effort
    }
    try {
      // Client-portal team: sub-role + permissions on users, seat cap on orgs.
      await this.$executeRawUnsafe('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "clientRole" TEXT')
      await this.$executeRawUnsafe('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "permissions" JSONB')
      await this.$executeRawUnsafe('ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "maxSeats" INTEGER DEFAULT 5')
    } catch {
      // best effort
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect()
    } catch {}
  }
}
