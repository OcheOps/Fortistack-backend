-- Scan targets: container images that tenants want scanned
CREATE TABLE scan_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    image TEXT NOT NULL,             -- e.g. "nginx:1.25" or "ghcr.io/org/app:latest"
    label TEXT,                      -- friendly name
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, image)
);

CREATE INDEX idx_scan_targets_tenant ON scan_targets(tenant_id);

-- Scan runs: each invocation of the scanner
CREATE TABLE scan_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    target_id UUID NOT NULL REFERENCES scan_targets(id),
    image TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',  -- pending | running | completed | failed
    score INT,                               -- 0-100 risk score
    risk_level TEXT,                          -- critical | high | medium | low
    critical_count INT DEFAULT 0,
    high_count INT DEFAULT 0,
    medium_count INT DEFAULT 0,
    low_count INT DEFAULT 0,
    total_vulns INT DEFAULT 0,
    summary TEXT,                             -- executive summary text
    artifact_key TEXT,                        -- storage key for raw trivy JSON
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scan_runs_tenant ON scan_runs(tenant_id);
CREATE INDEX idx_scan_runs_target ON scan_runs(target_id);
CREATE INDEX idx_scan_runs_created ON scan_runs(created_at DESC);

-- Individual vulnerability findings from a scan run
CREATE TABLE scan_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_run_id UUID NOT NULL REFERENCES scan_runs(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    vuln_id TEXT NOT NULL,            -- CVE-2024-XXXXX
    pkg_name TEXT NOT NULL,
    installed_version TEXT,
    fixed_version TEXT,
    severity TEXT NOT NULL,           -- CRITICAL | HIGH | MEDIUM | LOW | UNKNOWN
    title TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scan_findings_run ON scan_findings(scan_run_id);
CREATE INDEX idx_scan_findings_tenant ON scan_findings(tenant_id);
CREATE INDEX idx_scan_findings_severity ON scan_findings(severity);
