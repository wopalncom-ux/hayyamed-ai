-- Storage meter: bytes per knowledge source (sum vs the client's storageLimitMb).
ALTER TABLE "knowledge_sources" ADD COLUMN IF NOT EXISTS "sizeBytes" INTEGER NOT NULL DEFAULT 0;
