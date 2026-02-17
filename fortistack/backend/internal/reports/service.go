package reports

import (
	"bytes"
	"context"
	"fmt"
	"fortistack/internal/alerts"
	"fortistack/internal/risk"
	"fortistack/internal/storage"
	"fortistack/internal/tenants"
	"log/slog"
	"time"
)

type Service struct {
	Repo         *Repository
	TenantRepo   *tenants.Repository
	PDFGenerator *PDFGenerator
	RiskEngine   func(risk.Input) risk.Report
	AlertService *alerts.Service
	Store        storage.ObjectStore
}

func NewService(repo *Repository, tenantRepo *tenants.Repository, alerts *alerts.Service, store storage.ObjectStore) *Service {
	return &Service{
		Repo:         repo,
		TenantRepo:   tenantRepo,
		PDFGenerator: NewPDFGenerator(),
		RiskEngine:   risk.CalculateRisk,
		AlertService: alerts,
		Store:        store,
	}
}

func (s *Service) GenerateSnapshot(ctx context.Context, tenantID string, input risk.Input) (*Report, error) {
	// 1. Get Tenant
	t, err := s.TenantRepo.Get(ctx, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant: %w", err)
	}
	if t == nil {
		return nil, fmt.Errorf("tenant not found: %s", tenantID)
	}

	// 2. Calculate Risk
	slog.Info("report: calculating risk", "tenant_id", tenantID)
	riskReport := s.RiskEngine(input)

	// 3. Create Report Structure
	report := &Report{
		TenantID:    tenantID,
		TenantName:  t.Name,
		ReportType:  TypeSnapshot,
		GlobalScore: riskReport.Score.Global,
		CreatedAt:   time.Now(),
		Details:     &riskReport,
	}

	// 4. Render HTML
	slog.Info("report: rendering HTML template", "tenant_id", tenantID)
	htmlContent, err := Render(report)
	if err != nil {
		slog.Error("report: template render failed", "tenant_id", tenantID, "error", err)
		return nil, fmt.Errorf("render failed: %w", err)
	}

	// 5. Generate PDF bytes
	reportFileID := fmt.Sprintf("snap-%s-%d", tenantID, time.Now().Unix())
	slog.Info("report: generating PDF", "tenant_id", tenantID, "file_id", reportFileID)
	pdfBytes, err := s.PDFGenerator.Generate(ctx, htmlContent, reportFileID)
	if err != nil {
		slog.Error("report: PDF generation failed", "tenant_id", tenantID, "error", err)
		return nil, fmt.Errorf("pdf generation failed: %w", err)
	}

	// 6. Store PDF in object store
	storageKey := fmt.Sprintf("tenants/%s/reports/%s.pdf", tenantID, reportFileID)
	slog.Info("report: storing PDF", "key", storageKey, "size_bytes", len(pdfBytes))
	if err := s.Store.Put(ctx, storageKey, "application/pdf", bytes.NewReader(pdfBytes)); err != nil {
		slog.Error("report: storage write failed", "key", storageKey, "error", err)
		return nil, fmt.Errorf("storage write failed: %w", err)
	}

	report.StorageKey = storageKey

	// 7. Save to DB
	slog.Info("report: saving to database", "tenant_id", tenantID)
	if err := s.Repo.Save(ctx, report); err != nil {
		slog.Error("report: db save failed", "tenant_id", tenantID, "error", err)
		return nil, fmt.Errorf("db save failed: %w", err)
	}

	// 8. Send Alert (async)
	go func() {
		alertCtx, cancel := context.WithTimeout(context.Background(), 1*time.Minute)
		defer cancel()
		if err := s.AlertService.SendAlerts(alertCtx, report.TenantID, string(report.ReportType), report.GlobalScore, report.ID, riskReport.Findings); err != nil {
			slog.Error("report: alert send failed", "tenant_id", tenantID, "error", err)
		}
	}()

	slog.Info("report: snapshot generation complete", "tenant_id", tenantID, "report_id", report.ID, "score", report.GlobalScore)
	return report, nil
}

func (s *Service) GenerateMonthly(ctx context.Context, tenantID string, start, end time.Time, input risk.Input) (*Report, error) {
	t, err := s.TenantRepo.Get(ctx, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant: %w", err)
	}
	if t == nil {
		return nil, fmt.Errorf("tenant not found: %s", tenantID)
	}

	riskReport := s.RiskEngine(input)

	report := &Report{
		TenantID:          tenantID,
		TenantName:        t.Name,
		ReportType:        TypeMonthly,
		ReportPeriodStart: &start,
		ReportPeriodEnd:   &end,
		GlobalScore:       riskReport.Score.Global,
		CreatedAt:         time.Now(),
		Details:           &riskReport,
	}

	htmlContent, err := Render(report)
	if err != nil {
		return nil, fmt.Errorf("render failed: %w", err)
	}

	reportFileID := fmt.Sprintf("monthly-%s-%d", tenantID, time.Now().Unix())
	pdfBytes, err := s.PDFGenerator.Generate(ctx, htmlContent, reportFileID)
	if err != nil {
		return nil, fmt.Errorf("pdf generation failed: %w", err)
	}

	storageKey := fmt.Sprintf("tenants/%s/reports/%s.pdf", tenantID, reportFileID)
	if err := s.Store.Put(ctx, storageKey, "application/pdf", bytes.NewReader(pdfBytes)); err != nil {
		return nil, fmt.Errorf("storage write failed: %w", err)
	}
	report.StorageKey = storageKey

	if err := s.Repo.Save(ctx, report); err != nil {
		return nil, fmt.Errorf("db save failed: %w", err)
	}

	go func() {
		alertCtx, cancel := context.WithTimeout(context.Background(), 1*time.Minute)
		defer cancel()
		if err := s.AlertService.SendAlerts(alertCtx, report.TenantID, string(report.ReportType), report.GlobalScore, report.ID, riskReport.Findings); err != nil {
			slog.Error("report: alert send failed", "tenant_id", tenantID, "error", err)
		}
	}()

	return report, nil
}

func (s *Service) GetReports(ctx context.Context, tenantID string) ([]Report, error) {
	return s.Repo.GetByTenantID(ctx, tenantID, 50)
}

func (s *Service) GetReport(ctx context.Context, reportID string) (*Report, error) {
	return s.Repo.GetOne(ctx, reportID)
}
