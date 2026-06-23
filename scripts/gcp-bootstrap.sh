#!/usr/bin/env bash
# GCP Bootstrap — run once to set up Cloud Run infrastructure
# PERMANENT RULE: me-central1 (Doha, Qatar) ONLY
set -euo pipefail

PROJECT_ID="${1:-$(gcloud config get-value project)}"
REGION="me-central1"
REPO="hayyamed-ai"

echo "Bootstrapping GCP project: $PROJECT_ID in $REGION"

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  --project="$PROJECT_ID"

# Create Artifact Registry repository
gcloud artifacts repositories create "$REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="Hayya Med AI — Docker images" \
  --project="$PROJECT_ID" || echo "Repo already exists"

# Configure Docker auth
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet

# Grant Cloud Build SA access to Cloud Run & Artifact Registry
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/iam.serviceAccountUser"

# Create secrets (populate them manually or via CI)
create_secret() {
  local name="$1"
  gcloud secrets create "$name" --replication-policy="user-managed" \
    --locations="$REGION" --project="$PROJECT_ID" 2>/dev/null || echo "Secret $name already exists"
}

create_secret "hayyamed-database-url"
create_secret "hayyamed-jwt-secret"
create_secret "hayyamed-openai-key"
create_secret "hayyamed-anthropic-key"
create_secret "hayyamed-api-url"

echo ""
echo "Bootstrap complete! Next steps:"
echo "1. Populate secrets:"
echo "   echo -n 'postgresql://...' | gcloud secrets versions add hayyamed-database-url --data-file=-"
echo "   echo -n 'your-jwt-secret'  | gcloud secrets versions add hayyamed-jwt-secret --data-file=-"
echo "   echo -n 'sk-...'           | gcloud secrets versions add hayyamed-openai-key --data-file=-"
echo "   echo -n 'sk-ant-...'       | gcloud secrets versions add hayyamed-anthropic-key --data-file=-"
echo ""
echo "2. After first Cloud Run deploy, get the API URL and populate:"
echo "   echo -n 'https://hayyamed-api-XXXX-oc.a.run.app' | gcloud secrets versions add hayyamed-api-url --data-file=-"
echo ""
echo "3. Connect a Cloud Build trigger to your GitHub repo:"
echo "   gcloud builds triggers create github \\"
echo "     --repo-name=hayyamed-ai \\"
echo "     --repo-owner=YOUR_GITHUB_ORG \\"
echo "     --branch-pattern='^master$' \\"
echo "     --build-config=cloudbuild.yaml \\"
echo "     --region=$REGION \\"
echo "     --project=$PROJECT_ID"
