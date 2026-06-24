-- Feature Flags System
-- Global flag definitions + per-org overrides + plan-based gating

CREATE TABLE IF NOT EXISTS "feature_flags" (
  "id"          TEXT NOT NULL,
  "key"         TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "category"    TEXT NOT NULL DEFAULT 'general',
  "isEnabled"   BOOLEAN NOT NULL DEFAULT true,
  "minPlan"     TEXT NOT NULL DEFAULT 'STARTER',
  "isBeta"      BOOLEAN NOT NULL DEFAULT false,
  "metadata"    JSONB,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "feature_flags_key_key" ON "feature_flags"("key");

CREATE TABLE IF NOT EXISTS "org_feature_flags" (
  "id"        TEXT NOT NULL,
  "orgId"     TEXT NOT NULL,
  "flagKey"   TEXT NOT NULL,
  "isEnabled" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "org_feature_flags_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "org_feature_flags_orgId_flagKey_key" ON "org_feature_flags"("orgId", "flagKey");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'org_feature_flags_orgId_fkey') THEN
    ALTER TABLE "org_feature_flags" ADD CONSTRAINT "org_feature_flags_orgId_fkey"
      FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Seed default feature flags
INSERT INTO "feature_flags" ("id","key","name","description","category","isEnabled","minPlan","isBeta") VALUES
  (gen_random_uuid(),'ai_agents','AI Agents','Create and deploy AI agents for automated conversations','ai',true,'GROWTH',false),
  (gen_random_uuid(),'knowledge_base','Knowledge Base','RAG-powered knowledge management and AI training','ai',true,'GROWTH',false),
  (gen_random_uuid(),'ai_auto_reply','AI Auto Reply','Automatic AI replies to incoming messages','ai',true,'GROWTH',false),
  (gen_random_uuid(),'ai_lead_scoring','AI Lead Scoring','Automatically score leads using AI','ai',true,'GROWTH',false),
  (gen_random_uuid(),'ai_insights','AI Insights','AI-powered business insights and recommendations','ai',true,'ENTERPRISE',false),
  (gen_random_uuid(),'whatsapp','WhatsApp Integration','Send and receive WhatsApp messages','channels',true,'STARTER',false),
  (gen_random_uuid(),'instagram','Instagram Integration','Manage Instagram DMs','channels',true,'GROWTH',false),
  (gen_random_uuid(),'email_channel','Email Channel','Unified email inbox','channels',true,'STARTER',false),
  (gen_random_uuid(),'campaigns','Campaigns','Broadcast messaging and drip campaigns','marketing',true,'GROWTH',false),
  (gen_random_uuid(),'workflows','Workflow Automation','Visual automation builder','automation',true,'GROWTH',false),
  (gen_random_uuid(),'bookings','Booking System','Appointment scheduling and calendar','crm',true,'GROWTH',false),
  (gen_random_uuid(),'reports','Advanced Reports','Detailed analytics and custom reports','analytics',true,'GROWTH',false),
  (gen_random_uuid(),'api_access','API Access','Programmatic access via REST API','platform',true,'ENTERPRISE',false),
  (gen_random_uuid(),'white_label','White Label','Custom branding and domain','platform',true,'ENTERPRISE',false),
  (gen_random_uuid(),'multi_branch','Multi Branch','Manage multiple locations','crm',true,'ENTERPRISE',false),
  (gen_random_uuid(),'agency_mode','Agency Mode','Manage multiple client organizations','platform',true,'ENTERPRISE',false),
  (gen_random_uuid(),'voice_ai','Voice AI','AI-powered voice calls','ai',false,'ENTERPRISE',true),
  (gen_random_uuid(),'marketplace','Marketplace','Templates and integrations marketplace','platform',false,'GROWTH',true)
ON CONFLICT ("key") DO NOTHING;