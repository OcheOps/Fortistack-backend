package scanner

import "time"

type ScanTarget struct {
	ID        string    `json:"id"`
	TenantID  string    `json:"tenant_id"`
	Image     string    `json:"image"`
	Label     string    `json:"label,omitempty"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ScanRun struct {
	ID            string     `json:"id"`
	TenantID      string     `json:"tenant_id"`
	TargetID      string     `json:"target_id"`
	Image         string     `json:"image"`
	Status        string     `json:"status"` // pending | running | completed | failed
	Score         *int       `json:"score,omitempty"`
	RiskLevel     string     `json:"risk_level,omitempty"`
	CriticalCount int        `json:"critical_count"`
	HighCount     int        `json:"high_count"`
	MediumCount   int        `json:"medium_count"`
	LowCount      int        `json:"low_count"`
	TotalVulns    int        `json:"total_vulns"`
	Summary       string     `json:"summary,omitempty"`
	ArtifactKey   string     `json:"artifact_key,omitempty"`
	ErrorMessage  string     `json:"error_message,omitempty"`
	StartedAt     *time.Time `json:"started_at,omitempty"`
	CompletedAt   *time.Time `json:"completed_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
}

type ScanFinding struct {
	ID               string    `json:"id"`
	ScanRunID        string    `json:"scan_run_id"`
	TenantID         string    `json:"tenant_id"`
	VulnID           string    `json:"vuln_id"`
	PkgName          string    `json:"pkg_name"`
	InstalledVersion string    `json:"installed_version,omitempty"`
	FixedVersion     string    `json:"fixed_version,omitempty"`
	Severity         string    `json:"severity"`
	Title            string    `json:"title,omitempty"`
	Description      string    `json:"description,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
}

// TrivyResult represents the JSON output structure of `trivy image --format json`.
type TrivyResult struct {
	Results []TrivyTarget `json:"Results"`
}

type TrivyTarget struct {
	Target          string      `json:"Target"`
	Vulnerabilities []TrivyVuln `json:"Vulnerabilities"`
}

type TrivyVuln struct {
	VulnerabilityID  string `json:"VulnerabilityID"`
	PkgName          string `json:"PkgName"`
	InstalledVersion string `json:"InstalledVersion"`
	FixedVersion     string `json:"FixedVersion"`
	Severity         string `json:"Severity"`
	Title            string `json:"Title"`
	Description      string `json:"Description"`
}
