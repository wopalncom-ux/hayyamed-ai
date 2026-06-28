-- Per-client module enablement (internal marketplace toggles).
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "modules" JSONB;
