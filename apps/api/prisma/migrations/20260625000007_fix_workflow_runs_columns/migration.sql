-- Fix workflow_runs: migration 006 created snake_case columns but Prisma expects camelCase.
-- Drop and recreate with correct column names to match the Prisma schema.

DROP TABLE IF EXISTS workflow_runs CASCADE;

CREATE TABLE "workflow_runs" (
  "id"          TEXT NOT NULL,
  "orgId"       TEXT NOT NULL,
  "workflowId"  TEXT NOT NULL,
  "contactId"   TEXT,
  "status"      TEXT NOT NULL DEFAULT 'running',
  "currentStep" INTEGER NOT NULL DEFAULT 0,
  "context"     JSONB,
  "nextStepAt"  TIMESTAMPTZ,
  "error"       TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "workflow_runs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "workflow_runs_workflowId_fkey"
    FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "workflow_runs_orgId_idx"       ON "workflow_runs"("orgId");
CREATE INDEX IF NOT EXISTS "workflow_runs_status_idx"      ON "workflow_runs"("status", "nextStepAt");
CREATE INDEX IF NOT EXISTS "workflow_runs_contactId_idx"   ON "workflow_runs"("contactId");
