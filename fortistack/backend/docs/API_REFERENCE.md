# FortiStack API Reference

Base URL: `http://localhost:8080`

## 1. Health Checks

### Check Service Liveness
```bash
curl -i http://localhost:8080/healthz
```

### Check Service Readiness (DB Connectivity)
```bash
curl -i http://localhost:8080/readyz
```

---

## 2. Authentication

### Register (Admin Only - Initial Admin created via migration)
```bash
# Register a Tenant Admin
curl -X POST http://localhost:8080/auth/register \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tenant@example.com",
    "password": "password123",
    "role": "tenant_admin",
    "tenant_id": "<TENANT_UUID>"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fortistack.local",
    "password": "password123"
  }'
```
*Response includes `access_token` and `refresh_token`.*

### Refresh Token
```bash
curl -X POST http://localhost:8080/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<REFRESH_TOKEN>"
  }'
```

### Logout
```bash
curl -X POST http://localhost:8080/auth/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

## 3. Tenants

### Create Tenant (Admin Only)
```bash
curl -X POST http://localhost:8080/tenants \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Fintech",
    "region": "us-east-1"
  }'
```

### List Tenants (Admin Only)
```bash
curl -X GET http://localhost:8080/tenants \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Get Tenant Details
```bash
curl -X GET http://localhost:8080/tenants/<TENANT_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Update Alert Configuration
```bash
curl -X PUT http://localhost:8080/tenants/<TENANT_ID>/alert-config \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "slack_webhook_url": "https://hooks.slack.com/services/...",
    "teams_webhook_url": "https://outlook.office.com/webhook/...",
    "email_recipients": ["ops@acme.com", "cto@acme.com"]
  }'
```

---

## 4. Reports & Risk Assessment

### Generate Snapshot Report
Triggers an immediate risk assessment based on input metrics.

```bash
curl -X POST http://localhost:8080/tenants/<TENANT_ID>/reports/snapshot \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "UptimeMetric": 99.95,
    "LastBackupAgeDays": 0,
    "OpenPortsCount": 2,
    "PublicExposureFound": false,
    "LoggingEnabled": true,
    "AccessReviewRecent": true,
    "MonthlySpendSpikePercent": 5.0
  }'
```

### Generate Monthly Report
Generates a historical report for a specific period.

```bash
curl -X POST http://localhost:8080/tenants/<TENANT_ID>/reports/monthly \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "start": "2023-10-01T00:00:00Z",
    "end": "2023-10-31T23:59:59Z",
    "input": {
        "UptimeMetric": 99.9,
        "LastBackupAgeDays": 1,
        "OpenPortsCount": 5,
        "PublicExposureFound": false,
        "LoggingEnabled": true,
        "AccessReviewRecent": false,
        "MonthlySpendSpikePercent": 12.0
    }
  }'
```

### List Reports
```bash
curl -X GET http://localhost:8080/tenants/<TENANT_ID>/reports \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Download Report (PDF)
```bash
curl -X GET http://localhost:8080/reports/<REPORT_ID>/download \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  --output report.pdf
```
