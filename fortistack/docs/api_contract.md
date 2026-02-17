# FortiStack API Contract (v1)

## Authentication & Onboarding

### POST /auth/signup
**Public**. Creates a new tenant and an admin user for that tenant.
**Request:**
```json
{
  "tenant_name": "Acme Corp",
  "region": "us-east-1",
  "email": "owner@acme.com",
  "password": "strongPassword123"
}
```
**Response (201 Created):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "owner@acme.com",
    "role": "tenant_admin",
    "tenant_id": "uuid"
  }
}
```

### POST /auth/login
**Public**.
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

### POST /auth/refresh
**Public**.
**Request:**
```json
{ "refresh_token": "..." }
```

## Tenants (Super Admin Only)

### POST /tenants
**Role: Admin**.
**Request:**
```json
{
  "name": "New Tenant",
  "region": "us-east-1"
}
```

### GET /tenants
**Role: Admin**. Lists all tenants.

### POST /tenants/{id}/users
**Role: Admin**. Creates a user within a specific tenant.
**Request:**
```json
{
  "email": "user@tenant.com",
  "password": "tempPassword123",
  "role": "tenant_admin"
}
```
**Response (201 Created):**
```json
{
  "id": "uuid",
  "email": "user@tenant.com",
  "role": "tenant_admin",
  "tenant_id": "uuid",
  "is_active": true
}
```

## Reports (Tenant Scope)

### POST /tenants/{id}/reports/snapshot
**Role: Tenant Admin**.
**Request:** `{ "url": "...", ... }`

### GET /tenants/{id}/reports
**Role: Viewer**. Lists reports.

### GET /reports/{id}/download
**Role: Viewer**. Downloads PDF.
