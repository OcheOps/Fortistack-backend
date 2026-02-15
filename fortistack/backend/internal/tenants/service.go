package tenants

import (
	"context"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) CreateTenant(ctx context.Context, t *Tenant) error {
	return s.repo.Create(ctx, t)
}

func (s *Service) GetTenant(ctx context.Context, id string) (*Tenant, error) {
	return s.repo.Get(ctx, id)
}

func (s *Service) GetAllTenants(ctx context.Context) ([]Tenant, error) {
	return s.repo.GetAll(ctx)
}

func (s *Service) UpdateTenant(ctx context.Context, t *Tenant) error {
	return s.repo.Update(ctx, t)
}

func (s *Service) GetAlertConfig(ctx context.Context, tenantID string) (*AlertConfig, error) {
	return s.repo.GetAlertConfig(ctx, tenantID)
}

func (s *Service) UpsertAlertConfig(ctx context.Context, config *AlertConfig) error {
	return s.repo.UpsertAlertConfig(ctx, config)
}
