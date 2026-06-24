-- AI Observability — tracks every AI call across all modules
CREATE TABLE IF NOT EXISTS "ai_usage_logs" (
  "id"             TEXT NOT NULL,
  "orgId"          TEXT NOT NULL,
  "userId"         TEXT,
  "module"         TEXT NOT NULL, -- 'chatbot', 'campaign', 'ai-agent', 'knowledge', 'reply', 'score', 'classify', 'translate', 'insights'
  "action"         TEXT NOT NULL, -- specific action within module
  "provider"       TEXT NOT NULL, -- 'openai', 'anthropic', 'gemini', 'groq'
  "model"          TEXT NOT NULL,
  "promptTokens"   INTEGER NOT NULL DEFAULT 0,
  "completionTokens" INTEGER NOT NULL DEFAULT 0,
  "totalTokens"    INTEGER NOT NULL DEFAULT 0,
  "costUsd"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  "latencyMs"      INTEGER NOT NULL DEFAULT 0,
  "success"        BOOLEAN NOT NULL DEFAULT true,
  "errorType"      TEXT,
  "escalated"      BOOLEAN NOT NULL DEFAULT false,
  "userFeedback"   TEXT, -- 'positive', 'negative', null
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_usage_logs_orgId_idx" ON "ai_usage_logs"("orgId");
CREATE INDEX IF NOT EXISTS "ai_usage_logs_createdAt_idx" ON "ai_usage_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "ai_usage_logs_provider_idx" ON "ai_usage_logs"("provider");
CREATE INDEX IF NOT EXISTS "ai_usage_logs_module_idx" ON "ai_usage_logs"("module");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_usage_logs_orgId_fkey') THEN
    ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_orgId_fkey"
      FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;