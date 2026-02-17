# FortiStack Production Readiness Audit

## Executive Summary
**Status**: 🟡 **Beta / Pre-Production**
The core functionality (Tenants, Reports, Auth) is functional, but crucial security and persistence layers required for a real SaaS deployment are missing or insecure configuration.

---

## 1. Security Audit
| Component | Status | Issue | Location |
|-----------|--------|-------|----------|
| **CORS** | 🔴 **Critical** | `AllowedOrigins` is set to `*`. This allows any website to make requests to your API. | `backend/internal/api/router.go` |
| **Token Storage** | ⚠️ **Risky** | JWTs stored in `localStorage` are vulnerable to XSS. Standard for MVP, but switch to `HttpOnly` cookies for banking/fintech. | `frontend/src/context/auth-context.tsx` |
| **PDF Generation** | ⚠️ **Risky** | `wkhtmltopdf` is unmaintained and has known vulnerabilities. Input sanitization relies on Go templates (mostly safe), but still a risk vector. | `backend/internal/reports/pdf.go` |
| **Secret Management** | ⚠️ **Risky** | `JWT_SECRET` and `DB_DSN` are passed as plain env vars. In Prod, use Secrets Manager / SSM. | `docker-compose.yml` |
| **Rate Limiting** | ✅ **Good** | In-memory limiter implemented (10 req/s). Good for single instance, needs Redis for cluster. | `backend/internal/api/middleware/rate_limit.go` |
| **RBAC** | ✅ **Good** | `RequireRole` middleware correctly enforces Admin/TenantAdmin scopes. | `backend/internal/api/router.go` |

## 2. Infrastructure & Reliability
| Component | Status | Issue | Location |
|-----------|--------|-------|----------|
| **Report Storage** | 🔥 **Will Break** | Reports are saved to local container disk (`/app/reports`). If deployed to Fargate/Lambda/K8s without a PVC/S3, **data loss occurs on restart**. | `backend/internal/reports/service.go` |
| **Frontend Build** | ✅ **Good** | Dockerfile now uses `standalone` output and multi-stage build. Small image size. | `frontend/Dockerfile` |
| **Database** | ⚠️ **Risky** | DB migrations are copied but not auto-run. Deployment pipeline must run migrations before app start. | `backend/Dockerfile.api` |
| **Logging** | ✅ **Good** | JSON structured logging (`slog`) is present. Ready for Datadog/CloudWatch. | `backend/cmd/api/main.go` |

## 3. Developer Experience (DX) & UX
| Component | Status | Issue | Location |
|-----------|--------|-------|----------|
| **Tenant Switching** | ✅ **Good** | UI implementation handles context switching cleanly. | `frontend/src/context/auth-context.tsx` |
| **Error Handling** | ⚠️ **Weak** | Frontend `toast` shows generic errors often. Backend returns structured JSON but UI doesn't always parse `details`. | `frontend/src/lib/api.ts` |
| **Local Dev** | ✅ **Good** | `docker compose up --build` works for full stack. | `docker-compose.yml` |

---

## Prioritized Remediation Plan

### P0: Immediate Fixes (Before Public URL)
1. **Restrict CORS**:
   - Change `AllowedOrigins` in `backend/internal/api/router.go` to explicit frontend domains (e.g., `https://app.fortistack.com`).
2. **Setup S3 for Reports**:
   - Abstract `PDFGenerator` to upload to S3 instead of local disk. 
   - Update `Report` model to store S3 Key/URL instead of file path.

### P1: Stability & Compliance
1. **Migrate from wkhtmltopdf**:
   - Switch to `chromedp` (Headless Chrome) for PDF generation. Better rendering, supported, more secure.
2. **Implement Refresh Token Rotation**:
   - Current refresh logic allows reuse until expiry.

### P2: Polish
1. **User Management UI**:
   - Add UI to "Invite User" to a tenant (currently DB only).
2. **Email Notifications**:
   - Verify SMTP settings in `worker` container actually send emails.

