package alerts

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"sync"

	"fortistack/internal/risk"
	"fortistack/internal/tenants"
)

type Service struct {
	TenantRepo *tenants.Repository
	BaseURL    string
}

func NewService(repo *tenants.Repository) *Service {
	baseURL := os.Getenv("API_BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}
	return &Service{
		TenantRepo: repo,
		BaseURL:    baseURL,
	}
}

func (s *Service) SendAlerts(ctx context.Context, tenantID, reportType string, globalScore int, reportID string, findings []risk.Finding) error {
	// 1. Get Tenant & Config
	// We need tenant name for the message
	tenant, err := s.TenantRepo.Get(ctx, tenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant: %w", err)
	}
	if tenant == nil {
		return fmt.Errorf("tenant not found: %s", tenantID)
	}

	config, err := s.TenantRepo.GetAlertConfig(ctx, tenantID)
	if err != nil {
		return fmt.Errorf("failed to get alert config: %w", err)
	}
	if config == nil {
		slog.Info("No alert config found for tenant", "tenant_id", tenantID)
		return nil
	}

	// 2. Prepare Data
	downloadURL := fmt.Sprintf("%s/reports/%s/download", s.BaseURL, reportID)

	var wg sync.WaitGroup
	errs := make(chan error, 3)

	// Slack
	if config.SlackWebhook != "" {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if err := SendSlack(ctx, config.SlackWebhook, tenant.Name, reportType, globalScore, downloadURL, findings); err != nil {
				slog.Error("Failed to send Slack alert", "error", err)
				errs <- err
			}
		}()
	}

	// Teams
	if config.TeamsWebhook != "" {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if err := SendTeams(ctx, config.TeamsWebhook, tenant.Name, reportType, globalScore, downloadURL, findings); err != nil {
				slog.Error("Failed to send Teams alert", "error", err)
				errs <- err
			}
		}()
	}

	// Email
	if len(config.EmailRecipients) > 0 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if err := SendEmail(ctx, config.EmailRecipients, tenant.Name, reportType, globalScore, downloadURL); err != nil {
				slog.Error("Failed to send Email alert", "error", err)
				errs <- err
			}
		}()
	}

	wg.Wait()
	close(errs)

	// Collect errors if needed, but we logged them.
	return nil
}
