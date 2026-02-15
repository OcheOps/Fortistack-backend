# FortiStack Architecture

## Design
FortiStack is a **SaaS platform** built in Go, utilizing a PostgreSQL database for state and `wkhtmltopdf` for offline report generation.

### Components
1. **API Server (`cmd/api`)**:
   - Handles REST requests.
   - Manages tenant lifecycle.
   - Triggers on-demand report generation.
   - Authentication via JWT.
2. **Worker (`cmd/worker`)**:
   - Scheduled task runner (`cron`).
   - Generates monthly reports autonomously.
   - Dispatches alerts to external channels (Slack, Teams, Email).
3. **Database (`internal/db`)**:
   - Stores tenants, users, risk scores, historical reports.
   - Uses schema versioning (`migrations/`).
4. **Risk Engine (`internal/risk`)**:
   - Deterministic logic layer.
   - Calculates weighted scores (0-100) based on inputs.
5. **Report Service (`internal/reports`)**:
   - Renders HTML templates (`templates/`).
   - Converts HTML to PDF.
   - Saves artifacts to local storage (Volume mounted in Docker).

### Data Flow
1. **Report Request**:
   - Admin/Tenant triggers API.
   - Inputs Risk Data -> Risk Engine -> Score.
   - Score + Template -> Report Service -> HTML.
   - HTML -> `wkhtmltopdf` -> PDF (Disk).
   - Metadata -> DB (`reports` table).
   - Alert -> Slack/Teams/Email.
2. **Monthly Schedule**:
   - Worker wakes up (Cron).
   - Fetches active tenants.
   - Uses default/stored inputs -> Generates PDF.
   - Sends alerts.

## Security
- **Auth**: JWT with short TTL (15m) + Long-lived Refresh Token (7d).
- **RBAC**: Admin (Platform), Tenant Admin (Organization), Viewer (Read-only).
- **Secrets**: Environment variables only. No hardcoded credentials.
- **SQL Injection**: Using parameterized queries (`pgx`).
