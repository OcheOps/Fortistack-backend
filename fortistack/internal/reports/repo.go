package reports

import (
	"context"
	"errors"
	"fortistack/internal/db"
	"time"

	"github.com/jackc/pgx/v5"
)

type Repository struct{}

func NewRepository() *Repository {
	return &Repository{}
}

func (r *Repository) Save(ctx context.Context, report *Report) error {
	query := `
		INSERT INTO reports (
			tenant_id, report_type, report_period_start, report_period_end,
			global_score, storage_path
		) VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`
	var start, end interface{}
	if report.ReportPeriodStart != nil {
		start = *report.ReportPeriodStart
	}
	if report.ReportPeriodEnd != nil {
		end = *report.ReportPeriodEnd
	}

	return db.Pool.QueryRow(ctx, query,
		report.TenantID, report.ReportType, start, end, report.GlobalScore, report.StoragePath,
	).Scan(&report.ID, &report.CreatedAt)
}

func (r *Repository) GetByTenantID(ctx context.Context, tenantID string, limit int) ([]Report, error) {
	query := `
		SELECT id, tenant_id, report_type, report_period_start, report_period_end,
		global_score, storage_path, created_at
		FROM reports
		WHERE tenant_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`
	rows, err := db.Pool.Query(ctx, query, tenantID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reports []Report
	for rows.Next() {
		var r Report
		// No, `report_period_start` is nullable. Use pointers or NullTime.
		var startPtr, endPtr *time.Time
		if err := rows.Scan(&r.ID, &r.TenantID, &r.ReportType, &startPtr, &endPtr, &r.GlobalScore, &r.StoragePath, &r.CreatedAt); err != nil {
			return nil, err
		}
		if startPtr != nil {
			r.ReportPeriodStart = startPtr
		}
		if endPtr != nil {
			r.ReportPeriodEnd = endPtr
		}
		reports = append(reports, r)
	}
	return reports, nil
}

func (r *Repository) GetOne(ctx context.Context, id string) (*Report, error) {
	query := `
		SELECT id, tenant_id, report_type, report_period_start, report_period_end,
		global_score, storage_path, created_at
		FROM reports
		WHERE id = $1
	`
	var rep Report
	var startPtr, endPtr *time.Time
	err := db.Pool.QueryRow(ctx, query, id).Scan(
		&rep.ID, &rep.TenantID, &rep.ReportType, &startPtr, &endPtr,
		&rep.GlobalScore, &rep.StoragePath, &rep.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	rep.ReportPeriodStart = startPtr
	rep.ReportPeriodEnd = endPtr
	return &rep, nil
}
