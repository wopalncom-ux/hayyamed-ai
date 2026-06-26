-- Owner-editable platform settings (plan pricing, etc.)
CREATE TABLE IF NOT EXISTS "platform_settings" (
  "key"       TEXT NOT NULL,
  "value"     JSONB NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);
