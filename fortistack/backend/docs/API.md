# API Documentation

Base URL: `/` (Local: `http://localhost:8080`)

All responses follow JSON format:
```json
{
  "data": { ... },
  "error": { "message": "..." }
}
```

## Authentication

### POST `/auth/login`
- Body: `{"email": "admin@fortistack.local", "password": "password123"}`
- Response: `{"access_token": "...", "refresh_token": "..."}`

### POST `/auth/refresh`
- Body: `{"refresh_token": "..."}`
- Response: `{"access_token": "..."}`

### POST `/auth/register` (Admin Only)
- Body: `{"email": "...", "password": "...", "role": "tenant_admin", "tenant_id": "uuid"}`

## Tenants

### POST `/tenants` (Admin Only)
- Body: `{"name": "Paystack", "region": "ng"}`

### GET `/tenants` (Admin Only)
- Returns list of tenants.

### PATCH `/tenants/{id}` (Admin Only)
- Body: `{"name": "...", "is_active": true}`

### GET `/tenants/{id}/alert-config` (Tenant Admin)
- Returns alert settings.

### PUT `/tenants/{id}/alert-config` (Tenant Admin)
- Body: `{"slack_webhook_url": "...", "teams_webhook_url": "...", "email_recipients": ["foo@bar.com"]}`

## Reports

### POST `/tenants/{id}/reports/snapshot` (Tenant Admin)
- Body: `{"uptime_metric": 99.9, ...}` (See `risk.Input` structure)
- Creates snapshot and returns report data.

### POST `/tenants/{id}/reports/monthly` (Tenant Admin)
- Body: `{"start": "2026-01-01T00:00:00Z", "end": "2026-02-01T00:00:00Z", "input": {...}}`
- Creates full report.

### GET `/tenants/{id}/reports` (Viewer)
- Returns historical reports.

### GET `/reports/{id}/download` (Authorized)
- Downloads the generated PDF file.
