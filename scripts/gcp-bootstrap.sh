#!/usr/bin/env bash
# =============================================================================
# Hayyamed AI — GCP Bootstrap
# Run ONCE to set up Cloud Run infrastructure for the first deployment.
# PERMANENT RULE: me-central1 (Doha, Qatar) ONLY — no global/us/eu regions
# =============================================================================
set -euo pipefail

PROJECT_ID="${1:-$(gcloud config get-value project)}"
REGION="me-central1"
REPO="hayyamed-ai"

echo "============================================="
echo "Bootstrapping GCP project: $PROJECT_ID"
echo "Region: $REGION (Qatar — PDPL compliant)"
echo "============================================="

# ── 1. Enable required APIs ────────────────────────────────────────────────────
echo "[1/5] Enabling GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  --project="$PROJECT_ID"

# ── 2. Create Artifact Registry repository ────────────────────────────────────
echo "[2/5] Creating Artifact Registry: $REPO..."
gcloud artifacts repositories create "$REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="Hayyamed AI — Docker images (Qatar region)" \
  --project="$PROJECT_ID" 2>/dev/null || echo "  (already exists)"

# Configure Docker auth for this region
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet

# ── 3. Grant Cloud Build SA permissions ───────────────────────────────────────
echo "[3/5] Granting Cloud Build service account permissions..."
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

for ROLE in roles/run.admin roles/artifactregistry.writer roles/secretmanager.secretAccessor roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${CB_SA}" \
    --role="$ROLE" --quiet 2>/dev/null || true
done

# ── 4. Create secrets (all with Qatar-region replication) ─────────────────────
echo "[4/5] Creating Secret Manager secrets..."
create_secret() {
  local name="$1"
  gcloud secrets create "$name" \
    --replication-policy="user-managed" \
    --locations="$REGION" \
    --project="$PROJECT_ID" 2>/dev/null && echo "  Created: $name" || echo "  Exists:  $name"
}

# Database
create_secret "hayyamed-database-url"

# Auth
create_secret "hayyamed-jwt-secret"
create_secret "hayyamed-jwt-refresh-secret"
create_secret "hayyamed-nextauth-secret"

# AI
create_secret "hayyamed-openai-key"
create_secret "hayyamed-anthropic-key"

# WhatsApp / Meta
create_secret "hayyamed-whatsapp-token"
create_secret "hayyamed-whatsapp-webhook-token"
create_secret "hayyamed-meta-app-secret"

# Email
create_secret "hayyamed-postmark-token"

# URLs (populated after first deploy)
create_secret "hayyamed-api-url"
create_secret "hayyamed-frontend-url"

echo "[5/5] Bootstrap complete!"

# ── 5. Print next steps ───────────────────────────────────────────────────────
cat <<'INSTRUCTIONS'

=============================================================================
NEXT STEPS — run these commands to populate secrets, then trigger first build
=============================================================================

Step 1 — Database (use Neon free tier: https://neon.tech or your Postgres URL)
  echo -n 'postgresql://user:pass@host/db?sslmode=require' \
    | gcloud secrets versions add hayyamed-database-url --data-file=- --project=PROJECT_ID

Step 2 — Auth secrets
  echo -n 'your-strong-jwt-secret-min-32-chars' \
    | gcloud secrets versions add hayyamed-jwt-secret --data-file=- --project=PROJECT_ID

  echo -n 'your-strong-refresh-secret-min-32-chars' \
    | gcloud secrets versions add hayyamed-jwt-refresh-secret --data-file=- --project=PROJECT_ID

  echo -n 'your-nextauth-secret-min-32-chars' \
    | gcloud secrets versions add hayyamed-nextauth-secret --data-file=- --project=PROJECT_ID

Step 3 — AI API keys
  echo -n 'sk-proj-...' \
    | gcloud secrets versions add hayyamed-openai-key --data-file=- --project=PROJECT_ID

  echo -n 'sk-ant-...' \
    | gcloud secrets versions add hayyamed-anthropic-key --data-file=- --project=PROJECT_ID

Step 4 — WhatsApp (Meta Business Manager)
  echo -n 'your-whatsapp-cloud-api-token' \
    | gcloud secrets versions add hayyamed-whatsapp-token --data-file=- --project=PROJECT_ID

  echo -n 'hayyamed_webhook_prod' \
    | gcloud secrets versions add hayyamed-whatsapp-webhook-token --data-file=- --project=PROJECT_ID

  echo -n 'your-meta-app-secret' \
    | gcloud secrets versions add hayyamed-meta-app-secret --data-file=- --project=PROJECT_ID

Step 5 — Email (Postmark: https://account.postmarkapp.com/servers)
  echo -n 'your-postmark-server-token' \
    | gcloud secrets versions add hayyamed-postmark-token --data-file=- --project=PROJECT_ID

Step 6 — Trigger first build (builds + deploys both services)
  gcloud builds submit . \
    --config=cloudbuild.yaml \
    --region=me-central1 \
    --project=PROJECT_ID

Step 7 — After first deploy, get the API Cloud Run URL and set it:
  API_URL=$(gcloud run services describe hayyamed-api \
    --region=me-central1 --format='value(status.url)' --project=PROJECT_ID)
  echo -n "$API_URL" \
    | gcloud secrets versions add hayyamed-api-url --data-file=- --project=PROJECT_ID

  # Set FRONTEND_URL for password reset email links:
  echo -n 'https://hayyamedai.com' \
    | gcloud secrets versions add hayyamed-frontend-url --data-file=- --project=PROJECT_ID

Step 8 — Redeploy web with the now-known API URL:
  gcloud builds submit . \
    --config=cloudbuild.yaml \
    --region=me-central1 \
    --project=PROJECT_ID

Step 9 — Connect GitHub for auto-deploy on push to master:
  gcloud builds triggers create github \
    --repo-name=hayyamed-ai \
    --repo-owner=YOUR_GITHUB_ORG \
    --branch-pattern='^master$' \
    --build-config=cloudbuild.yaml \
    --region=me-central1 \
    --project=PROJECT_ID

Step 10 — (Optional) Map custom domain:
  gcloud run domain-mappings create \
    --service=hayyamed-web \
    --domain=hayyamedai.com \
    --region=me-central1 \
    --project=PROJECT_ID

  gcloud run domain-mappings create \
    --service=hayyamed-api \
    --domain=api.hayyamedai.com \
    --region=me-central1 \
    --project=PROJECT_ID

=============================================================================
NOTES
=============================================================================
- Region: me-central1 (Doha, Qatar) — PDPL compliant, never change this
- Database: Use Neon (https://neon.tech) — serverless Postgres with pgvector
- Redis: Not required (removed unused BullModule; ThrottlerModule is in-memory)
- Min instances: 1 per service to avoid cold starts for paid users
- All secrets stored in Secret Manager with Qatar-region replication
=============================================================================
INSTRUCTIONS
