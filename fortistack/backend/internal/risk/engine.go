package risk

import (
	"fmt"
	"math"
	"time"
)

// CalculateRisk generates a risk report based on input metrics.
// This function is deterministic.
func CalculateRisk(input Input) Report {
	report := Report{
		Score: Score{
			CalculatedAt: time.Now(),
		},
		Findings: []Finding{},
	}

	// 1. Availability (25%)
	// Input: UptimeMetric (float64)
	availScore := 0
	if input.UptimeMetric >= 99.99 {
		availScore = 100
	} else if input.UptimeMetric >= 99.9 {
		availScore = 90
		report.Findings = append(report.Findings, Finding{
			Severity: "INFO",
			Title:    "Availability could improve",
			Detail:   "Uptime is good (99.9%+) but not elite (99.99%).",
		})
	} else if input.UptimeMetric >= 99.0 {
		availScore = 70
		report.Findings = append(report.Findings, Finding{
			Severity: "WARNING",
			Title:    "Availability below target",
			Detail:   fmt.Sprintf("Uptime %.2f%% is acceptable but risks SLA breaches.", input.UptimeMetric),
		})
	} else {
		availScore = 40
		report.Findings = append(report.Findings, Finding{
			Severity: "CRITICAL",
			Title:    "Poor Availability",
			Detail:   fmt.Sprintf("Uptime %.2f%% indicates significant downtime.", input.UptimeMetric),
		})
	}
	report.Score.Availability = availScore

	// 2. Backup Integrity (25%)
	// Input: LastBackupAgeDays (int)
	backupScore := 0
	if input.LastBackupAgeDays <= 1 {
		backupScore = 100
	} else if input.LastBackupAgeDays <= 7 {
		backupScore = 80
		report.Findings = append(report.Findings, Finding{
			Severity: "INFO",
			Title:    "Backups present but not daily",
			Detail:   fmt.Sprintf("Last backup was %d days ago.", input.LastBackupAgeDays),
		})
	} else if input.LastBackupAgeDays <= 30 {
		backupScore = 40
		report.Findings = append(report.Findings, Finding{
			Severity: "WARNING",
			Title:    "Stale Backups",
			Detail:   fmt.Sprintf("Last backup is %d days old, significant data loss risk.", input.LastBackupAgeDays),
		})
	} else {
		backupScore = 10 // Heavy penalty
		report.Findings = append(report.Findings, Finding{
			Severity: "CRITICAL",
			Title:    "Dangerous Backup Gap",
			Detail:   "Backups are older than 30 days or missing.",
		})
	}
	report.Score.Backup = backupScore

	// 3. Security Posture (20%)
	// Input: OpenPortsCount (int), PublicExposureFound (bool)
	securityBase := 100
	if input.OpenPortsCount > 0 {
		securityBase -= (input.OpenPortsCount * 10)
		report.Findings = append(report.Findings, Finding{
			Severity: "WARNING",
			Title:    "Open Ports Detected",
			Detail:   fmt.Sprintf("Found %d open ports potentially exposing services.", input.OpenPortsCount),
		})
	}
	if input.PublicExposureFound {
		securityBase -= 30
		report.Findings = append(report.Findings, Finding{
			Severity: "CRITICAL",
			Title:    "Public Exposure Detected",
			Detail:   "Sensitive resources appear to be publicly accessible.",
		})
	}
	if securityBase < 0 {
		securityBase = 0
	}
	report.Score.Security = securityBase

	// 4. Compliance Readiness (20%)
	// Input: LoggingEnabled (bool), AccessReviewRecent (bool)
	compScore := 0
	if input.LoggingEnabled {
		compScore += 50
	} else {
		report.Findings = append(report.Findings, Finding{
			Severity: "CRITICAL",
			Title:    "Logging Disabled",
			Detail:   "Audit logging is not enabled.",
		})
	}
	if input.AccessReviewRecent {
		compScore += 50
	} else {
		report.Findings = append(report.Findings, Finding{
			Severity: "WARNING",
			Title:    "Access Review Overdue",
			Detail:   "No recent access review found.",
		})
	}
	report.Score.Compliance = compScore

	// 5. Cost Hygiene (10%)
	// Input: MonthlySpendSpikePercent (float64)
	costScore := 100
	if input.MonthlySpendSpikePercent > 50 {
		costScore = 20
		report.Findings = append(report.Findings, Finding{
			Severity: "WARNING",
			Title:    "Major Cost Spike",
			Detail:   fmt.Sprintf("Spend spiked by %.1f%% this month.", input.MonthlySpendSpikePercent),
		})
	} else if input.MonthlySpendSpikePercent > 20 {
		costScore = 60
		report.Findings = append(report.Findings, Finding{
			Severity: "INFO",
			Title:    "Noticeable Cost Increase",
			Detail:   fmt.Sprintf("Spend up by %.1f%%.", input.MonthlySpendSpikePercent),
		})
	}
	report.Score.Cost = costScore

	// Global Calculation (Weighted)
	// Avail 25, Backup 25, Sec 20, Comp 20, Cost 10
	global := (float64(report.Score.Availability) * 0.25) +
		(float64(report.Score.Backup) * 0.25) +
		(float64(report.Score.Security) * 0.20) +
		(float64(report.Score.Compliance) * 0.20) +
		(float64(report.Score.Cost) * 0.10)

	report.Score.Global = int(math.Round(global))

	return report
}
