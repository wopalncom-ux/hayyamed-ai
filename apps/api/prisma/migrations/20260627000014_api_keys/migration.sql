-- API keys — per-org secrets for the public inbound API (push leads, etc.).
CREATE TABLE IF NOT EXISTS "api_keys" (
  "id"         TEXT NOT NULL,
  "orgId"      TEXT NOT NULL,
  "name"       TEXT NOT NULL DEFAULT 'API key',
  "key"        TEXT NOT NULL,
  "lastUsedAt" TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_key_key" ON "api_keys"("key");
CREATE INDEX IF NOT EXISTS "api_keys_orgId_idx" ON "api_keys"("orgId");
