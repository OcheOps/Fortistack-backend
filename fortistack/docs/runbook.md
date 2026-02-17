# FortiStack Operational Runbook

## 1. Local Development Setup

### Start the Stack
```bash
docker compose up --build
```
This starts:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Postgres: localhost:5432

### Seeding the Database
To create the default super admin user (`admin@fortistack.local` / `SafePassword123!`):

```bash
cd backend
make seed
```
*Note: Ensure the database container is running first.*

---

## 2. Authentication & Onboarding Workflows

### A. Public Signup (Tenant Owner)
Create a new tenant and admin user via the API.

**Endpoint:** `POST /auth/signup`

**Curl Example:**
```bash
curl -X POST http://localhost:8080/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_name": "Acme Corp",
    "region": "us-east-1",
    "email": "owner@acme.com",
    "password": "strongpassword123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": {
    "id": "...",
    "email": "owner@acme.com",
    "role": "tenant_admin",
    "tenant_id": "..."
  }
}
```

### B. Login
**Endpoint:** `POST /auth/login`

**Curl Example:**
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fortistack.local",
    "password": "SafePassword123!"
  }'
```

### C. Create Tenant (Super Admin Only)
**Endpoint:** `POST /tenants`

**Curl Example:**
```bash
TOKEN="<your_admin_access_token>"
curl -X POST http://localhost:8080/tenants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Beta Customer",
    "region": "eu-west-1",
    "is_active": true
  }'
```

### D. Create User for Tenant (Super Admin Only)
**Endpoint:** `POST /tenants/{id}/users`

**Curl Example:**
```bash
TOKEN="<your_admin_access_token>"
TENANT_ID="<tenant_id>"
curl -X POST http://localhost:8080/tenants/$TENANT_ID/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staff@beta.com",
    "password": "welcome123",
    "role": "viewer"
  }'
```

### E. List Tenants (Super Admin Only)
**Endpoint:** `GET /tenants`

**Curl Example:**
```bash
curl -X GET http://localhost:8080/tenants \
  -H "Authorization: Bearer $TOKEN"
```

## 3. Troubleshooting

- **Database Connection Failed:** Ensure `DB_DSN` is correct in `.env` or `docker-compose.yml`.
- **Permission Denied:** Check if your user has the correct `role` ("admin" for tenant creation, "tenant_admin" for reports).
