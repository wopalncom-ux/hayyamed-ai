-- ============================================================
-- Migration: add missing tables and columns
-- These models were added to schema.prisma after the initial
-- migration was generated and applied to production.
-- ============================================================

-- Enable pgvector (may already exist)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add missing enum values (safe — IF NOT EXISTS not supported, use DO block)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BookingStatus') THEN
    CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');
  END IF;
END $$;

-- ─── Missing columns on existing tables ─────────────────────────────────────

ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "agencyBalance"   DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "agencyNotes"     TEXT NOT NULL DEFAULT '';
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "agencyStatus"    TEXT NOT NULL DEFAULT 'good';
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "agencyAiScore"   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "agencyMonthlyRev" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "agencyCustomMgn" DOUBLE PRECISION;

-- ─── Missing tables ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id"                  TEXT NOT NULL,
  "orgId"               TEXT NOT NULL,
  "plan"                "Plan" NOT NULL DEFAULT 'STARTER',
  "status"              TEXT NOT NULL DEFAULT 'active',
  "stripeSubId"         TEXT,
  "stripeCustomerId"    TEXT,
  "currentPeriodStart"  TIMESTAMP(3),
  "currentPeriodEnd"    TIMESTAMP(3),
  "cancelAtPeriodEnd"   BOOLEAN NOT NULL DEFAULT false,
  "trialEndsAt"         TIMESTAMP(3),
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_orgId_key" ON "subscriptions"("orgId");

CREATE TABLE IF NOT EXISTS "agency_packages" (
  "id"          TEXT NOT NULL,
  "orgId"       TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "price"       DOUBLE PRECISION NOT NULL,
  "margin"      DOUBLE PRECISION NOT NULL DEFAULT 25,
  "color"       TEXT NOT NULL DEFAULT '#00e5a0',
  "description" TEXT NOT NULL DEFAULT '',
  "features"    TEXT[] DEFAULT ARRAY[]::TEXT[],
  "conditions"  TEXT[] DEFAULT ARRAY[]::TEXT[],
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agency_packages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "branches" (
  "id"           TEXT NOT NULL,
  "orgId"        TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "address"      TEXT,
  "city"         TEXT,
  "country"      TEXT NOT NULL DEFAULT 'QA',
  "phone"        TEXT,
  "email"        TEXT,
  "isMain"       BOOLEAN NOT NULL DEFAULT false,
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  "timezone"     TEXT NOT NULL DEFAULT 'Asia/Qatar',
  "workingHours" JSONB,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "departments" (
  "id"        TEXT NOT NULL,
  "orgId"     TEXT NOT NULL,
  "branchId"  TEXT,
  "name"      TEXT NOT NULL,
  "headId"    TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_agents" (
  "id"              TEXT NOT NULL,
  "orgId"           TEXT NOT NULL,
  "name"            TEXT NOT NULL,
  "avatar"          TEXT,
  "role"            TEXT NOT NULL DEFAULT 'receptionist',
  "personality"     TEXT,
  "language"        TEXT NOT NULL DEFAULT 'ar',
  "objective"       TEXT,
  "isActive"        BOOLEAN NOT NULL DEFAULT false,
  "aiProvider"      TEXT NOT NULL DEFAULT 'openai',
  "aiModel"         TEXT NOT NULL DEFAULT 'gpt-4o',
  "fallbackModel"   TEXT,
  "temperature"     DOUBLE PRECISION NOT NULL DEFAULT 0.7,
  "maxTokens"       INTEGER NOT NULL DEFAULT 500,
  "costLimitDaily"  DECIMAL(10,2),
  "workingHours"    JSONB,
  "escalationRules" JSONB,
  "allowedActions"  TEXT[] DEFAULT ARRAY[]::TEXT[],
  "channels"        TEXT[] DEFAULT ARRAY[]::TEXT[],
  "knowledgeBaseId" TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_agents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "knowledge_bases" (
  "id"          TEXT NOT NULL,
  "orgId"       TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "knowledge_bases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "knowledge_sources" (
  "id"              TEXT NOT NULL,
  "knowledgeBaseId" TEXT NOT NULL,
  "type"            TEXT NOT NULL,
  "name"            TEXT NOT NULL,
  "content"         TEXT,
  "url"             TEXT,
  "filePath"        TEXT,
  "status"          TEXT NOT NULL DEFAULT 'pending',
  "chunkCount"      INTEGER NOT NULL DEFAULT 0,
  "lastIndexed"     TIMESTAMP(3),
  "metadata"        JSONB,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "knowledge_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "knowledge_chunks" (
  "id"              TEXT NOT NULL,
  "sourceId"        TEXT NOT NULL,
  "knowledgeBaseId" TEXT NOT NULL,
  "orgId"           TEXT NOT NULL,
  "content"         TEXT NOT NULL,
  "embedding"       vector(1536),
  "chunkIndex"      INTEGER NOT NULL DEFAULT 0,
  "metadata"        JSONB,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "knowledge_chunks_knowledgeBaseId_idx" ON "knowledge_chunks"("knowledgeBaseId");
CREATE INDEX IF NOT EXISTS "knowledge_chunks_orgId_idx" ON "knowledge_chunks"("orgId");

CREATE TABLE IF NOT EXISTS "bookings" (
  "id"            TEXT NOT NULL,
  "orgId"         TEXT NOT NULL,
  "contactId"     TEXT,
  "branchId"      TEXT,
  "staffId"       TEXT,
  "service"       TEXT NOT NULL,
  "notes"         TEXT,
  "status"        "BookingStatus" NOT NULL DEFAULT 'PENDING',
  "startTime"     TIMESTAMP(3) NOT NULL,
  "endTime"       TIMESTAMP(3),
  "duration"      INTEGER,
  "reminderSent"  BOOLEAN NOT NULL DEFAULT false,
  "source"        TEXT NOT NULL DEFAULT 'manual',
  "externalCalId" TEXT,
  "metadata"      JSONB,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id"         TEXT NOT NULL,
  "orgId"      TEXT NOT NULL,
  "userId"     TEXT,
  "action"     TEXT NOT NULL,
  "resource"   TEXT NOT NULL,
  "resourceId" TEXT,
  "before"     JSONB,
  "after"      JSONB,
  "ip"         TEXT,
  "userAgent"  TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "audit_logs_orgId_createdAt_idx" ON "audit_logs"("orgId", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON "audit_logs"("userId");

CREATE TABLE IF NOT EXISTS "integrations" (
  "id"         TEXT NOT NULL,
  "orgId"      TEXT NOT NULL,
  "type"       TEXT NOT NULL,
  "name"       TEXT NOT NULL,
  "config"     JSONB NOT NULL,
  "status"     TEXT NOT NULL DEFAULT 'active',
  "lastSyncAt" TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "services" (
  "id"          TEXT NOT NULL,
  "orgId"       TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "duration"    INTEGER,
  "price"       DECIMAL(10,2),
  "currency"    TEXT NOT NULL DEFAULT 'QAR',
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- ─── Foreign keys for new tables (IF NOT EXISTS via DO blocks) ───────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_orgId_fkey') THEN
    ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agency_packages_orgId_fkey') THEN
    ALTER TABLE "agency_packages" ADD CONSTRAINT "agency_packages_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'branches_orgId_fkey') THEN
    ALTER TABLE "branches" ADD CONSTRAINT "branches_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'departments_branchId_fkey') THEN
    ALTER TABLE "departments" ADD CONSTRAINT "departments_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_agents_orgId_fkey') THEN
    ALTER TABLE "ai_agents" ADD CONSTRAINT "ai_agents_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_agents_knowledgeBaseId_fkey') THEN
    ALTER TABLE "ai_agents" ADD CONSTRAINT "ai_agents_knowledgeBaseId_fkey" FOREIGN KEY ("knowledgeBaseId") REFERENCES "knowledge_bases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_bases_orgId_fkey') THEN
    ALTER TABLE "knowledge_bases" ADD CONSTRAINT "knowledge_bases_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_sources_knowledgeBaseId_fkey') THEN
    ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_knowledgeBaseId_fkey" FOREIGN KEY ("knowledgeBaseId") REFERENCES "knowledge_bases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_chunks_sourceId_fkey') THEN
    ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "knowledge_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_orgId_fkey') THEN
    ALTER TABLE "bookings" ADD CONSTRAINT "bookings_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_contactId_fkey') THEN
    ALTER TABLE "bookings" ADD CONSTRAINT "bookings_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_staffId_fkey') THEN
    ALTER TABLE "bookings" ADD CONSTRAINT "bookings_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'integrations_orgId_fkey') THEN
    ALTER TABLE "integrations" ADD CONSTRAINT "integrations_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_orgId_fkey') THEN
    ALTER TABLE "services" ADD CONSTRAINT "services_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;