# FortiStack v1

Infrastructure Assurance platform for Nigerian fintech startups.
Generates executive risk PDF reports and notifies key stakeholders.

## Directory Structure

- `cmd/api`: API Server (REST)
- `cmd/worker`: Scheduled report generator
- `internal/`: Core logic (risk engine, reports, tenants, auth)
- `templates/`: HTML templates for PDF reports
- `docker/`: Deployment configurations

## Getting Started

1. **Install Dependencies**: Go 1.22+, Docker, Make.
2. **Start Services**:
   ```bash
   make run
   ```
3. **Run Migrations**:
   Wait for postgres to be ready (a few seconds).
   ```bash
   make migrate
   ```
   This creates tables and a default admin user:
   - Email: `admin@fortistack.local`
   - Password: Need to generate hash manually or use SQL in `Makefile` (password is literal hash for now, so recreate/update via `make migrate`).
   Note: `make migrate` inserts a placeholder user. The password hash in Makefile is fake.
   Use `cmd/admin` tool or manual SQL update to set a known password.
   Or use `test` / `test` hash: `$2a$10$X7...`
   
   To generate a real hash, use the Go playground or a tool.
   Example hash for "password123": `$2a$10$3Z...`
   
4. **Access API**: `http://localhost:8080`

## Development

- **Run Tests**: `make test`
- **Lint**: `make lint`

## Features

- **Risk Engine**: Deterministic scoring based on Availability, Backup, Security, Compliance, Cost.
- **Reporting**: Automated PDF generation using Go templates + wkhtmltopdf.
- **Alerts**: Slack, Teams, Email notifications on report generation.
- **Auth**: JWT-based authentication with RBAC (Admin, Tenant Admin, Viewer).
