-- Client AI Operating Center — extended client profile fields on organizations.
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "contactPerson" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "whatsappNumber" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "clientEmail" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "businessType" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "storageLimitMb" INTEGER NOT NULL DEFAULT 500;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "paymentResponsibility" TEXT NOT NULL DEFAULT 'client';
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "profitPercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "campaignBilling" TEXT NOT NULL DEFAULT '';
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT NOT NULL DEFAULT '';
