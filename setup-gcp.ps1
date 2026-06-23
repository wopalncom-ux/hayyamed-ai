# ============================================================
# HAYYAMED CRM — GCP Infrastructure Setup
# Run ONCE to provision all cloud resources in me-central1 (Qatar)
# ============================================================

$PROJECT_ID = "hayyamed-crm"
$REGION     = "me-central1"
$DB_PASS    = Read-Host "Enter Cloud SQL password (save this!)" -AsSecureString
$DB_PASS    = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASS))

Write-Host "`n>>> Creating GCP project..." -ForegroundColor Cyan
gcloud projects create $PROJECT_ID --name="Hayyamed CRM"
gcloud config set project $PROJECT_ID

Write-Host "`n>>> Enabling APIs..." -ForegroundColor Cyan
gcloud services enable `
  run.googleapis.com `
  sqladmin.googleapis.com `
  artifactregistry.googleapis.com `
  cloudbuild.googleapis.com `
  secretmanager.googleapis.com `
  vpcaccess.googleapis.com

Write-Host "`n>>> Creating Artifact Registry..." -ForegroundColor Cyan
gcloud artifacts repositories create hayyamed-crm `
  --repository-format=docker `
  --location=$REGION `
  --description="Hayyamed CRM Docker images"

Write-Host "`n>>> Creating Cloud SQL PostgreSQL (me-central1)..." -ForegroundColor Cyan
gcloud sql instances create hayyamed-crm-db `
  --database-version=POSTGRES_16 `
  --tier=db-f1-micro `
  --region=$REGION `
  --storage-type=SSD `
  --storage-size=10 `
  --storage-auto-increase `
  --no-backup

gcloud sql databases create hayyamed --instance=hayyamed-crm-db
gcloud sql users create hayyamed --instance=hayyamed-crm-db --password=$DB_PASS

$DB_CONNECTION_NAME = "${PROJECT_ID}:${REGION}:hayyamed-crm-db"
$DATABASE_URL = "postgresql://hayyamed:${DB_PASS}@localhost/hayyamed?host=/cloudsql/${DB_CONNECTION_NAME}"

Write-Host "`n>>> Storing secrets in Secret Manager..." -ForegroundColor Cyan
$secrets = @{
  "HAYYAMED_CRM_DATABASE_URL"        = $DATABASE_URL
  "HAYYAMED_CRM_JWT_SECRET"          = [System.Web.Security.Membership]::GeneratePassword(64, 8)
  "HAYYAMED_CRM_JWT_REFRESH_SECRET"  = [System.Web.Security.Membership]::GeneratePassword(64, 8)
  "HAYYAMED_CRM_NEXTAUTH_SECRET"     = [System.Web.Security.Membership]::GeneratePassword(64, 8)
  "HAYYAMED_CRM_FRONTEND_URL"        = "https://app.hayyamedai.com"
}

foreach ($key in $secrets.Keys) {
  $val = $secrets[$key]
  Write-Host "  Creating secret: $key"
  echo $val | gcloud secrets create $key --data-file=- --replication-policy=user-managed --locations=$REGION
}

Write-Host "`n>>> Manual secrets to add via GCP Console (Secret Manager):" -ForegroundColor Yellow
Write-Host "  HAYYAMED_CRM_OPENAI_API_KEY"
Write-Host "  HAYYAMED_CRM_RESEND_API_KEY"
Write-Host "  HAYYAMED_CRM_STRIPE_SECRET_KEY"
Write-Host "  HAYYAMED_CRM_WHATSAPP_ACCESS_TOKEN"
Write-Host "  HAYYAMED_CRM_WHATSAPP_PHONE_NUMBER_ID"
Write-Host "  HAYYAMED_CRM_WHATSAPP_WEBHOOK_TOKEN"
Write-Host "  HAYYAMED_CRM_META_APP_ID"
Write-Host "  HAYYAMED_CRM_META_APP_SECRET"
Write-Host "  HAYYAMED_CRM_REDIS_HOST       (use Upstash Redis host)"
Write-Host "  HAYYAMED_CRM_REDIS_PORT       (use 6379)"
Write-Host "  HAYYAMED_CRM_REDIS_PASSWORD   (Upstash Redis password)"

Write-Host "`n>>> Grant Cloud Build access to secrets..." -ForegroundColor Cyan
$PROJECT_NUMBER = gcloud projects describe $PROJECT_ID --format="value(projectNumber)"
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" `
  --role="roles/run.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" `
  --role="roles/iam.serviceAccountUser"

Write-Host "`n=== DONE ===" -ForegroundColor Green
Write-Host "DB Connection Name: $DB_CONNECTION_NAME" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Add the remaining secrets in GCP Console > Secret Manager"
Write-Host "2. Run the API build: gcloud builds submit --config cloudbuild-api.yaml --project $PROJECT_ID --substitutions=COMMIT_SHA=v1"
Write-Host "3. Run the Web build: gcloud builds submit --config cloudbuild-web.yaml --project $PROJECT_ID --substitutions=COMMIT_SHA=v1"
Write-Host "4. Point Cloudflare DNS: app.hayyamedai.com and api.hayyamedai.com to Cloud Run URLs"
