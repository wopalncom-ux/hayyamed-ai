-- Saved Replies (canned responses) — reusable inbox message snippets, scoped per org.
CREATE TABLE IF NOT EXISTS "quick_replies" (
  "id"        TEXT NOT NULL,
  "orgId"     TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "content"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "quick_replies_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "quick_replies_orgId_idx" ON "quick_replies"("orgId");
