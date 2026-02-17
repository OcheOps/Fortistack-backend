# FortiStack Gap Analysis

## Backend
1. **User Management**: 
   - Currently, `POST /auth/register` exists for Admin creation, but no UI or API to manage users within a tenant (Invite/Delete users).
   - "Super Admin" can create Tenants, but adding subsequent users to that tenant is manual (DB or API call).
2. **Tenant Deletion**:
   - `DELETE /tenants/{id}` is not implemented in UI.
   - `is_active` soft delete is available and implemented in UI.
3. **Report Deletion**:
   - No way to delete old reports.
4. **Email Sending**:
   - `AlertService` is referenced but email sending logic via SMTP needs to be verified with actual credentials.

## Frontend
1. **Edit Tenant Details**:
   - UI implements "Edit" (Name/Region/Active) via `PATCH`.
   - Full "Tenant Settings" page is missing (e.g. detailed contact info).
2. **Theme Toggle**:
   - Hardcoded to "Dark Premium" as requested. No light mode.
3. **Mobile Responsiveness**:
   - Sidebar is fixed width. Mobile menu (hamburger) not implemented.
4. **Form Validation**:
   - Basic validation present. Zod schemas could be expanded.

## Ops / Docker
1. **WKHTMLTOPDF**:
   - Installed in Docker. CSS loading fixed via embedding in `render.go`.
   - If font rendering is poor, might need to install `fonts-inter` or similar in Dockerfile.
2. **Production Build**:
   - `Dockerfile.frontend` needs to be checked if it builds for production or just runs dev.
   - Currently `docker-compose.yml` mounts code to standard node image or similar?
   - `frontend/Dockerfile` uses `npm run dev` usually for dev. For strict production, multi-stage build needed.
