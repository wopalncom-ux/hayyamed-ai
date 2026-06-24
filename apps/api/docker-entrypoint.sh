#!/bin/sh
set -e

echo "[startup] Running Prisma migrations..."
npx prisma migrate deploy --schema=prisma/schema.prisma

echo "[startup] Seeding database..."
node prisma/seed.js || echo "[startup] Seed skipped"

echo "[startup] Starting API server..."
exec node dist/main
