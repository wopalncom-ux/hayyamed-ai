-- Payment records — every MyFatoorah payment link created, with its latest status.
CREATE TABLE IF NOT EXISTS "payments" (
  "id"           TEXT NOT NULL,
  "orgId"        TEXT NOT NULL,
  "provider"     TEXT NOT NULL DEFAULT 'myfatoorah',
  "invoiceId"    TEXT,
  "amount"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency"     TEXT NOT NULL DEFAULT 'QAR',
  "customerName" TEXT,
  "status"       TEXT NOT NULL DEFAULT 'Pending',
  "paymentUrl"   TEXT,
  "reference"    TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "payments_orgId_idx" ON "payments"("orgId");
