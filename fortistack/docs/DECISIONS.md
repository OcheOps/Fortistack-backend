# Design Decisions

## 1. Local PDF Generation (wkhtmltopdf)
- *Decision*: Using `wkhtmltopdf` directly in Docker image rather than external SaaS or headless Chrome.
- *Rationale*: Cost-effective, simple for MVP, no external dependencies (network-isolated PDF gen possible). `wkhtmltopdf` is mature for static HTML -> PDF.

## 2. Token Bucket Rate Limiting
- *Decision*: Simple in-memory rate limiting per IP.
- *Rationale*: Sufficient for MVP to prevent basic abuse. Production scaling would require Redis-backed distributed rate limiter.

## 3. Worker Scheduler
- *Decision*: Built-in Go `cron` library in a separate `worker` binary.
- *Rationale*: Decouples scheduled tasks from API request lifecycle. Ensures reliability even if API restarts.

## 4. Alerting Strategy
- *Decision*: Fire-and-forget async alerting in `goroutine`.
- *Rationale*: Reporting should not fail if Slack is down. Errors are logged but do not roll back the report creation.

## 5. Logout
- *Decision*: Client-side token discard.
- *Rationale*: Stateless JWTs by design. Server-side invalidation (denylist) adds state complexity (Redis) not needed for V1. Short access token TTL mitigates risk.

## 6. Default Risk Inputs
- *Decision*: Monthly reports use safe defaults if no recent data is available.
- *Rationale*: Ensures reports are generated to keep the cadence, highlighting "Missing Data" via default low/neutral scores or specific findings.
