-- Knowledge gaps — substantive customer questions the AI answered with no
-- knowledge-base context, so owners know what to add to improve the AI.
CREATE TABLE IF NOT EXISTS "knowledge_gaps" (
  "id"        TEXT NOT NULL,
  "orgId"     TEXT NOT NULL,
  "question"  TEXT NOT NULL,
  "channel"   TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "knowledge_gaps_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "knowledge_gaps_orgId_idx" ON "knowledge_gaps"("orgId");
