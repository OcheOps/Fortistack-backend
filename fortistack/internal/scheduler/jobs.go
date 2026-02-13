package scheduler

import (
	"context"
	"fortistack/internal/reports"
	"fortistack/internal/risk"
	"fortistack/internal/tenants"
	"log/slog"
	"time"
)

type MonthlyReportJob struct {
	ReportsService *reports.Service
	TenantsService *tenants.Service
}

func (j *MonthlyReportJob) Run() {
	ctx := context.Background() // Or create with timeout
	slog.Info("Starting monthly report generation job")

	// 1. Get all active tenants
	allTenants, err := j.TenantsService.GetAllTenants(ctx)
	if err != nil {
		slog.Error("Failed to fetch tenants for monthly job", "error", err)
		return
	}

	// 2. Iterate and generate
	// Calculate period: last month
	now := time.Now()
	currentYear, currentMonth, _ := now.Date()
	firstOfMonth := time.Date(currentYear, currentMonth, 1, 0, 0, 0, 0, now.Location())
	endOfLastMonth := firstOfMonth.Add(-1 * time.Second)
	startOfLastMonth := firstOfMonth.AddDate(0, -1, 0)

	for _, t := range allTenants {
		if !t.IsActive {
			continue
		}

		slog.Info("Generating monthly report", "tenant_id", t.ID, "tenant_name", t.Name)

		// Create safe default input as per requirements
		// "For monthly runs, generate inputs from stored recent values or safe defaults"
		// Since we don't have stored recent values yet, use defaults.
		input := risk.Input{
			UptimeMetric:             risk.DefaultUptimeMetric,
			LastBackupAgeDays:        risk.DefaultLastBackupAgeDays,
			OpenPortsCount:           risk.DefaultOpenPortsCount,
			PublicExposureFound:      risk.DefaultPublicExposureFound,
			LoggingEnabled:           risk.DefaultLoggingEnabled,
			AccessReviewRecent:       risk.DefaultAccessReviewRecent,
			MonthlySpendSpikePercent: risk.DefaultMonthlySpendSpikePercent,
		}

		_, err := j.ReportsService.GenerateMonthly(ctx, t.ID, startOfLastMonth, endOfLastMonth, input)
		if err != nil {
			slog.Error("Failed to generate monthly report", "tenant_id", t.ID, "error", err)
			continue
		}
	}
	slog.Info("Monthly report generation job completed")
}
