# Backend Gaps & Frontend Workarounds

## 1. Reports API Response

The `GET /tenants/{id}/reports` endpoint returns a list of reports with `GlobalScore` but without the category breakdown (Availability, Security, etc.).
The frontend dashboard currently shows placeholders (`--`) for specific category scores because fetching all report details (N+1 queries) would be inefficient.
**Recommendation:** Update backend `ListReports` to include simplified category scores or create a dedicated `/dashboard` endpoint.

## 2. Alert Configuration

If a tenant has no alert configuration, the backend returns 404 or 500 (depending on implementation specifics not fully visible without runtime testing).
**Workaround:** The frontend hook `useAlertConfig` disables retries to fail fast, and the UI shows empty fields to allow creating a new config.

## 3. Test Notification Endpoint

The backend lacks an endpoint to trigger a test notification (e.g., `POST /tenants/{id}/alert-config/test`).
**Gap:** Frontend cannot verify webhook connectivity without waiting for a real alert event.
