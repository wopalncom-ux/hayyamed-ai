-- Per-client wallet ledger + low-balance threshold.
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "lowBalanceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 50;

CREATE TABLE IF NOT EXISTS "wallet_transactions" (
  "id"           TEXT NOT NULL,
  "orgId"        TEXT NOT NULL,
  "type"         TEXT NOT NULL,
  "amount"       DOUBLE PRECISION NOT NULL,
  "description"  TEXT NOT NULL DEFAULT '',
  "balanceAfter" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "metadata"     JSONB,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "wallet_transactions_orgId_idx" ON "wallet_transactions"("orgId");
