-- Outbound webhooks — per-org HTTP endpoints notified on platform events.
CREATE TABLE IF NOT EXISTS "org_webhooks" (
  "id"        TEXT NOT NULL,
  "orgId"     TEXT NOT NULL,
  "url"       TEXT NOT NULL,
  "events"    TEXT NOT NULL DEFAULT '*',
  "secret"    TEXT,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "org_webhooks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "org_webhooks_orgId_idx" ON "org_webhooks"("orgId");
