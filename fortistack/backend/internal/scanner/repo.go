package scanner

import (
	"context"
	"fortistack/internal/db"
	"time"

	"github.com/jackc/pgx/v5"
)

type Repository struct{}

func NewRepository() *Repository { return &Repository{} }

// --- Scan Targets ---

func (r *Repository) CreateTarget(ctx context.Context, t *ScanTarget) error {
	query := `INSERT INTO scan_targets (tenant_id, image, label, is_active)
		VALUES ($1, $2, $3, $4) RETURNING id, created_at, updated_at`
	return db.Pool.QueryRow(ctx, query, t.TenantID, t.Image, t.Label, true).
		Scan(&t.ID, &t.CreatedAt, &t.UpdatedAt)
}

func (r *Repository) ListTargets(ctx context.Context, tenantID string) ([]ScanTarget, error) {
	query := `SELECT id, tenant_id, image, label, is_active, created_at, updated_at
		FROM scan_targets WHERE tenant_id = $1 ORDER BY created_at DESC`
	rows, err := db.Pool.Query(ctx, query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var targets []ScanTarget
	for rows.Next() {
		var t ScanTarget
		if err := rows.Scan(&t.ID, &t.TenantID, &t.Image, &t.Label, &t.IsActive, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		targets = append(targets, t)
	}
	return targets, nil
}

func (r *Repository) GetTarget(ctx context.Context, id string) (*ScanTarget, error) {
	query := `SELECT id, tenant_id, image, label, is_active, created_at, updated_at
		FROM scan_targets WHERE id = $1`
	var t ScanTarget
	err := db.Pool.QueryRow(ctx, query, id).Scan(&t.ID, &t.TenantID, &t.Image, &t.Label, &t.IsActive, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &t, nil
}

func (r *Repository) DeleteTarget(ctx context.Context, id string) error {
	_, err := db.Pool.Exec(ctx, `DELETE FROM scan_targets WHERE id = $1`, id)
	return err
}

// --- Scan Runs ---

func (r *Repository) CreateRun(ctx context.Context, run *ScanRun) error {
	query := `INSERT INTO scan_runs (tenant_id, target_id, image, status, started_at)
		VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`
	now := time.Now()
	run.StartedAt = &now
	return db.Pool.QueryRow(ctx, query, run.TenantID, run.TargetID, run.Image, "running", run.StartedAt).
		Scan(&run.ID, &run.CreatedAt)
}

func (r *Repository) UpdateRun(ctx context.Context, run *ScanRun) error {
	query := `UPDATE scan_runs SET
		status = $2, score = $3, risk_level = $4,
		critical_count = $5, high_count = $6, medium_count = $7, low_count = $8, total_vulns = $9,
		summary = $10, artifact_key = $11, error_message = $12, completed_at = $13
		WHERE id = $1`
	_, err := db.Pool.Exec(ctx, query,
		run.ID, run.Status, run.Score, run.RiskLevel,
		run.CriticalCount, run.HighCount, run.MediumCount, run.LowCount, run.TotalVulns,
		run.Summary, run.ArtifactKey, run.ErrorMessage, run.CompletedAt,
	)
	return err
}

func (r *Repository) ListRuns(ctx context.Context, tenantID string, limit int) ([]ScanRun, error) {
	query := `SELECT id, tenant_id, target_id, image, status, score, risk_level,
		critical_count, high_count, medium_count, low_count, total_vulns,
		summary, artifact_key, error_message, started_at, completed_at, created_at
		FROM scan_runs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2`
	rows, err := db.Pool.Query(ctx, query, tenantID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var runs []ScanRun
	for rows.Next() {
		var run ScanRun
		if err := rows.Scan(
			&run.ID, &run.TenantID, &run.TargetID, &run.Image, &run.Status,
			&run.Score, &run.RiskLevel,
			&run.CriticalCount, &run.HighCount, &run.MediumCount, &run.LowCount, &run.TotalVulns,
			&run.Summary, &run.ArtifactKey, &run.ErrorMessage,
			&run.StartedAt, &run.CompletedAt, &run.CreatedAt,
		); err != nil {
			return nil, err
		}
		runs = append(runs, run)
	}
	return runs, nil
}

func (r *Repository) GetRun(ctx context.Context, id string) (*ScanRun, error) {
	query := `SELECT id, tenant_id, target_id, image, status, score, risk_level,
		critical_count, high_count, medium_count, low_count, total_vulns,
		summary, artifact_key, error_message, started_at, completed_at, created_at
		FROM scan_runs WHERE id = $1`
	var run ScanRun
	err := db.Pool.QueryRow(ctx, query, id).Scan(
		&run.ID, &run.TenantID, &run.TargetID, &run.Image, &run.Status,
		&run.Score, &run.RiskLevel,
		&run.CriticalCount, &run.HighCount, &run.MediumCount, &run.LowCount, &run.TotalVulns,
		&run.Summary, &run.ArtifactKey, &run.ErrorMessage,
		&run.StartedAt, &run.CompletedAt, &run.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &run, nil
}

// --- Findings ---

func (r *Repository) BulkInsertFindings(ctx context.Context, findings []ScanFinding) error {
	if len(findings) == 0 {
		return nil
	}
	// Use CopyFrom for efficiency
	rows := make([][]interface{}, len(findings))
	for i, f := range findings {
		rows[i] = []interface{}{f.ScanRunID, f.TenantID, f.VulnID, f.PkgName, f.InstalledVersion, f.FixedVersion, f.Severity, f.Title, f.Description}
	}

	_, err := db.Pool.CopyFrom(ctx,
		pgx.Identifier{"scan_findings"},
		[]string{"scan_run_id", "tenant_id", "vuln_id", "pkg_name", "installed_version", "fixed_version", "severity", "title", "description"},
		pgx.CopyFromRows(rows),
	)
	return err
}

func (r *Repository) GetPreviousRun(ctx context.Context, targetID string, beforeRunID string) (*ScanRun, error) {
	query := `SELECT id, score, critical_count FROM scan_runs
		WHERE target_id = $1 AND id != $2 AND status = 'completed'
		ORDER BY created_at DESC LIMIT 1`
	var run ScanRun
	err := db.Pool.QueryRow(ctx, query, targetID, beforeRunID).Scan(&run.ID, &run.Score, &run.CriticalCount)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &run, nil
}
