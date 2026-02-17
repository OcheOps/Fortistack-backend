package scanner

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"fortistack/internal/storage"
	"log/slog"
	"os/exec"
	"strings"
	"time"
)

type Service struct {
	Repo  *Repository
	Store storage.ObjectStore
}

func NewService(repo *Repository, store storage.ObjectStore) *Service {
	return &Service{Repo: repo, Store: store}
}

// --- Target Management ---

func (s *Service) CreateTarget(ctx context.Context, tenantID, image, label string) (*ScanTarget, error) {
	t := &ScanTarget{TenantID: tenantID, Image: image, Label: label, IsActive: true}
	if err := s.Repo.CreateTarget(ctx, t); err != nil {
		return nil, fmt.Errorf("failed to create scan target: %w", err)
	}
	return t, nil
}

func (s *Service) ListTargets(ctx context.Context, tenantID string) ([]ScanTarget, error) {
	return s.Repo.ListTargets(ctx, tenantID)
}

func (s *Service) DeleteTarget(ctx context.Context, id string) error {
	return s.Repo.DeleteTarget(ctx, id)
}

// --- Scan Execution ---

func (s *Service) RunScan(ctx context.Context, tenantID, targetID string) (*ScanRun, error) {
	// 1. Get target
	target, err := s.Repo.GetTarget(ctx, targetID)
	if err != nil {
		return nil, fmt.Errorf("failed to get target: %w", err)
	}
	if target == nil {
		return nil, fmt.Errorf("scan target not found: %s", targetID)
	}
	if target.TenantID != tenantID {
		return nil, fmt.Errorf("target does not belong to tenant")
	}

	// 2. Create run record
	run := &ScanRun{
		TenantID: tenantID,
		TargetID: targetID,
		Image:    target.Image,
		Status:   "running",
	}
	if err := s.Repo.CreateRun(ctx, run); err != nil {
		return nil, fmt.Errorf("failed to create scan run: %w", err)
	}

	slog.Info("scan: starting trivy scan", "run_id", run.ID, "image", target.Image)

	// 3. Execute Trivy (synchronous for now; could be async via queue)
	go func() {
		bgCtx := context.Background()
		s.executeScan(bgCtx, run, target)
	}()

	return run, nil
}

func (s *Service) executeScan(ctx context.Context, run *ScanRun, target *ScanTarget) {
	scanCtx, cancel := context.WithTimeout(ctx, 5*time.Minute)
	defer cancel()

	now := time.Now()

	// Run trivy
	cmd := exec.CommandContext(scanCtx, "trivy", "image",
		"--format", "json",
		"--severity", "CRITICAL,HIGH,MEDIUM,LOW",
		"--quiet",
		target.Image,
	)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		// Trivy exits with exit code 1 if vulns found — that's OK
		// Only fail if output is empty
		if stdout.Len() == 0 {
			slog.Error("scan: trivy execution failed", "run_id", run.ID, "error", err, "stderr", stderr.String())
			run.Status = "failed"
			run.ErrorMessage = fmt.Sprintf("trivy failed: %v, stderr: %s", err, stderr.String())
			run.CompletedAt = &now
			_ = s.Repo.UpdateRun(ctx, run)
			return
		}
	}

	// Parse JSON output
	var result TrivyResult
	if err := json.Unmarshal(stdout.Bytes(), &result); err != nil {
		slog.Error("scan: failed to parse trivy JSON", "run_id", run.ID, "error", err)
		run.Status = "failed"
		run.ErrorMessage = "failed to parse trivy output"
		run.CompletedAt = &now
		_ = s.Repo.UpdateRun(ctx, run)
		return
	}

	// Store raw JSON artifact
	artifactKey := fmt.Sprintf("tenants/%s/scans/%s/trivy.json", run.TenantID, run.ID)
	if storeErr := s.Store.Put(ctx, artifactKey, "application/json", bytes.NewReader(stdout.Bytes())); storeErr != nil {
		slog.Warn("scan: failed to store trivy artifact", "run_id", run.ID, "error", storeErr)
	}
	run.ArtifactKey = artifactKey

	// Process findings
	var findings []ScanFinding
	criticals, highs, mediums, lows := 0, 0, 0, 0

	for _, target := range result.Results {
		for _, v := range target.Vulnerabilities {
			sev := strings.ToUpper(v.Severity)
			switch sev {
			case "CRITICAL":
				criticals++
			case "HIGH":
				highs++
			case "MEDIUM":
				mediums++
			case "LOW":
				lows++
			}

			// Truncate description to avoid DB bloat
			desc := v.Description
			if len(desc) > 500 {
				desc = desc[:500] + "..."
			}

			findings = append(findings, ScanFinding{
				ScanRunID:        run.ID,
				TenantID:         run.TenantID,
				VulnID:           v.VulnerabilityID,
				PkgName:          v.PkgName,
				InstalledVersion: v.InstalledVersion,
				FixedVersion:     v.FixedVersion,
				Severity:         sev,
				Title:            v.Title,
				Description:      desc,
			})
		}
	}

	totalVulns := criticals + highs + mediums + lows
	score := calculateScore(criticals, highs, mediums, lows)
	riskLevel := riskLevelFromScore(score)

	run.CriticalCount = criticals
	run.HighCount = highs
	run.MediumCount = mediums
	run.LowCount = lows
	run.TotalVulns = totalVulns
	run.Score = &score
	run.RiskLevel = riskLevel
	run.Summary = generateSummary(run.Image, score, riskLevel, criticals, highs, mediums, lows)
	run.Status = "completed"
	run.CompletedAt = &now

	// Save findings
	if err := s.Repo.BulkInsertFindings(ctx, findings); err != nil {
		slog.Error("scan: failed to insert findings", "run_id", run.ID, "error", err)
	}

	// Update run
	if err := s.Repo.UpdateRun(ctx, run); err != nil {
		slog.Error("scan: failed to update run", "run_id", run.ID, "error", err)
	}

	slog.Info("scan: completed",
		"run_id", run.ID,
		"image", run.Image,
		"score", score,
		"risk_level", riskLevel,
		"critical", criticals,
		"high", highs,
		"total", totalVulns,
	)
}

// calculateScore returns 0-100 risk score (100 = secure, 0 = critical risk).
func calculateScore(critical, high, medium, low int) int {
	// Deductions: CRITICAL=-25, HIGH=-10, MEDIUM=-3, LOW=-1
	score := 100
	score -= critical * 25
	score -= high * 10
	score -= medium * 3
	score -= low * 1
	if score < 0 {
		score = 0
	}
	return score
}

func riskLevelFromScore(score int) string {
	switch {
	case score >= 90:
		return "low"
	case score >= 70:
		return "medium"
	case score >= 40:
		return "high"
	default:
		return "critical"
	}
}

func generateSummary(image string, score int, level string, c, h, m, l int) string {
	return fmt.Sprintf(
		"Image %s scored %d/100 (%s risk). Found %d critical, %d high, %d medium, %d low vulnerabilities.",
		image, score, strings.ToUpper(level), c, h, m, l,
	)
}

// --- Query ---

func (s *Service) ListRuns(ctx context.Context, tenantID string) ([]ScanRun, error) {
	return s.Repo.ListRuns(ctx, tenantID, 50)
}

func (s *Service) GetRun(ctx context.Context, id string) (*ScanRun, error) {
	return s.Repo.GetRun(ctx, id)
}
