# FortiStack Validation Runbook

## Prerequisites
- Docker & Docker Compose installed
- Ports 3000, 5432, 8080, 9000, 9001 available

## 1. Start All Services

```bash
cd fortistack
docker compose up --build
```

Wait for all services to be healthy. You should see:
- `postgres` — healthy
- `minio` — healthy, bucket auto-created
- `api` — listening on :8080
- `worker` — scheduler started
- `frontend` — listening on :3000

## 2. Run Database Migrations

```bash
cd backend
make migrate
```

This runs all SQL migration files (001_init, 002_indexes, 003_scans).

## 3. Seed Admin User

```bash
make seed
```

Or manually:
```bash
DB_DSN="postgres://fortistack:fortistaticpassword@localhost:5432/fortistack?sslmode=disable" \
  go run cmd/seed/main.go
```

## 4. Login as Admin

```bash
TOKEN=$(curl -s http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fortistack.local","password":"SafePassword123!"}' \
  | jq -r '.data.access_token')

echo "Token: $TOKEN"
```

## 5. Create a Tenant

```bash
TENANT_ID=$(curl -s http://localhost:8080/tenants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Fintech","region":"ng-west-1"}' \
  | jq -r '.data.id')

echo "Tenant ID: $TENANT_ID"
```

## 6. Create a Tenant Admin User

```bash
curl -s http://localhost:8080/tenants/$TENANT_ID/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"ops@acme.com","password":"Acme2024!","role":"tenant_admin"}'
```

## 7. Login as Tenant Admin

```bash
TTOKEN=$(curl -s http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ops@acme.com","password":"Acme2024!"}' \
  | jq -r '.data.access_token')

echo "Tenant Token: $TTOKEN"
```

## 8. Generate a Snapshot Report

```bash
REPORT_ID=$(curl -s -X POST http://localhost:8080/tenants/$TENANT_ID/reports/snapshot \
  -H "Authorization: Bearer $TTOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "UptimeMetric": 99.95,
    "LastBackupAgeDays": 2,
    "OpenPortsCount": 1,
    "PublicExposureFound": false,
    "LoggingEnabled": true,
    "AccessReviewRecent": true,
    "MonthlySpendSpikePercent": 5
  }' | jq -r '.data.id')

echo "Report ID: $REPORT_ID"
```

## 9. Verify PDF is in S3 (MinIO)

Check MinIO console at http://localhost:9001 (login: minioadmin/minioadmin).

Or via CLI:
```bash
docker compose exec minio-init mc ls local/fortistack/tenants/$TENANT_ID/reports/ --recursive
```

## 10. Download the PDF Report

```bash
curl -s http://localhost:8080/reports/$REPORT_ID/download \
  -H "Authorization: Bearer $TTOKEN" \
  -o report.pdf

file report.pdf   # Should say "PDF document"
ls -la report.pdf # Should have non-zero size
```

## 11. Restart API Container & Re-download (Persistence Test)

```bash
docker compose restart api

# Wait a few seconds for API to come back
sleep 5

# Download again — should still work (PDF is in MinIO, not container disk)
curl -s http://localhost:8080/reports/$REPORT_ID/download \
  -H "Authorization: Bearer $TTOKEN" \
  -o report-after-restart.pdf

file report-after-restart.pdf
diff report.pdf report-after-restart.pdf && echo "✅ Files match — persistence works!"
```

## 12. Create a Scan Target

```bash
TARGET_ID=$(curl -s -X POST http://localhost:8080/tenants/$TENANT_ID/scan-targets \
  -H "Authorization: Bearer $TTOKEN" \
  -H "Content-Type: application/json" \
  -d '{"image":"alpine:3.19","label":"Alpine Base"}' \
  | jq -r '.data.id')

echo "Target ID: $TARGET_ID"
```

## 13. Trigger a Vulnerability Scan

```bash
RUN_ID=$(curl -s -X POST http://localhost:8080/tenants/$TENANT_ID/scan-targets/$TARGET_ID/scan \
  -H "Authorization: Bearer $TTOKEN" \
  -H "Content-Type: application/json" \
  | jq -r '.data.id')

echo "Scan Run ID: $RUN_ID"
```

## 14. Check Scan Results (wait ~30s for Trivy to finish)

```bash
sleep 30

curl -s http://localhost:8080/tenants/$TENANT_ID/scans \
  -H "Authorization: Bearer $TTOKEN" | jq '.data'
```

Expected output includes:
- `status: "completed"`
- `score: <0-100>`
- `risk_level: "low"|"medium"|"high"|"critical"`
- `critical_count`, `high_count`, etc.
- `summary: "Image alpine:3.19 scored ..."`

## 15. Verify Trivy JSON Artifact in S3

```bash
docker compose exec minio-init mc ls local/fortistack/tenants/$TENANT_ID/scans/ --recursive
```

## 16. Browser Test

1. Open http://localhost:3000
2. Login with `admin@fortistack.local` / `SafePassword123!`
3. Navigate to **Reports** → Generate Snapshot → Click **PDF** download
4. Navigate to **Security Scans** → Add Target → Trigger Scan → See results

---

## Storage Configuration

### Dev (default): MinIO
```
STORAGE_DRIVER=s3
STORAGE_S3_ENDPOINT=http://minio:9000
STORAGE_S3_ACCESS_KEY=minioadmin
STORAGE_S3_SECRET_KEY=minioadmin
STORAGE_S3_BUCKET=fortistack
STORAGE_S3_FORCE_PATH_STYLE=true
STORAGE_S3_DISABLE_SSL=true
```

### Production: Ceph RGW
```
STORAGE_DRIVER=s3
STORAGE_S3_ENDPOINT=https://rgw.ceph.example.com
STORAGE_S3_ACCESS_KEY=<your-ceph-access-key>
STORAGE_S3_SECRET_KEY=<your-ceph-secret-key>
STORAGE_S3_BUCKET=fortistack
STORAGE_S3_REGION=us-east-1
STORAGE_S3_FORCE_PATH_STYLE=true
STORAGE_S3_DISABLE_SSL=false
```

### Local Filesystem (no S3)
```
STORAGE_DRIVER=local
STORAGE_LOCAL_DIR=/app/workdir
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| PDF download returns 404 | Check `storage_path` in `reports` table matches S3 key; verify MinIO has the object |
| wkhtmltopdf fails | Check API container has `wkhtmltopdf` installed: `docker compose exec api wkhtmltopdf --version` |
| Trivy scan fails | Check worker logs: `docker compose logs api \| grep scan` |
| MinIO bucket not created | Run `docker compose up minio-init` manually |
| CORS errors on download | Ensure `Content-Disposition` is in `ExposedHeaders` in CORS config |
