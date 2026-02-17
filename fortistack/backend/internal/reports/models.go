package reports

import (
	"time"

	"fortistack/internal/risk"
)

type ReportType string

const (
	TypeSnapshot ReportType = "snapshot"
	TypeMonthly  ReportType = "monthly"
)

type Report struct {
	ID                string     `json:"id"`
	TenantID          string     `json:"tenant_id"`
	ReportType        ReportType `json:"report_type"`
	ReportPeriodStart *time.Time `json:"report_period_start,omitempty"`
	ReportPeriodEnd   *time.Time `json:"report_period_end,omitempty"`
	GlobalScore       int        `json:"global_score"`
	StorageKey        string     `json:"storage_key"`
	CreatedAt         time.Time  `json:"created_at"`

	// Enriched data not stored in DB
	TenantName string       `json:"tenant_name,omitempty"`
	Details    *risk.Report `json:"details,omitempty"`
}
