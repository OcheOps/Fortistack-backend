package tenants

import (
	"context"
	"errors"
	"fortistack/internal/db"

	"github.com/jackc/pgx/v5"
)

type Repository struct{}

func NewRepository() *Repository {
	return &Repository{}
}

func (r *Repository) Create(ctx context.Context, t *Tenant) error {
	query := `INSERT INTO tenants (name, region, is_active) VALUES ($1, $2, $3) RETURNING id, created_at, updated_at`
	return db.Pool.QueryRow(ctx, query, t.Name, t.Region, t.IsActive).Scan(&t.ID, &t.CreatedAt, &t.UpdatedAt)
}

func (r *Repository) Get(ctx context.Context, id string) (*Tenant, error) {
	query := `SELECT id, name, region, is_active, created_at, updated_at FROM tenants WHERE id = $1`
	var t Tenant
	err := db.Pool.QueryRow(ctx, query, id).Scan(&t.ID, &t.Name, &t.Region, &t.IsActive, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil // Return nil if not found
		}
		return nil, err
	}
	return &t, nil
}

func (r *Repository) GetAll(ctx context.Context) ([]Tenant, error) {
	query := `SELECT id, name, region, is_active, created_at, updated_at FROM tenants ORDER BY created_at DESC`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tenants []Tenant
	for rows.Next() {
		var t Tenant
		if err := rows.Scan(&t.ID, &t.Name, &t.Region, &t.IsActive, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		tenants = append(tenants, t)
	}
	return tenants, nil
}

func (r *Repository) Update(ctx context.Context, t *Tenant) error {
	query := `UPDATE tenants SET name=$1, region=$2, is_active=$3, updated_at=NOW() WHERE id=$4 RETURNING updated_at`
	return db.Pool.QueryRow(ctx, query, t.Name, t.Region, t.IsActive, t.ID).Scan(&t.UpdatedAt)
}

func (r *Repository) GetAlertConfig(ctx context.Context, tenantID string) (*AlertConfig, error) {
	query := `SELECT id, tenant_id, slack_webhook_url, teams_webhook_url, email_recipients, created_at, updated_at FROM alert_configs WHERE tenant_id = $1`
	var c AlertConfig

	var slack, teams *string

	err := db.Pool.QueryRow(ctx, query, tenantID).Scan(&c.ID, &c.TenantID, &slack, &teams, &c.EmailRecipients, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	if slack != nil {
		c.SlackWebhook = *slack
	}
	if teams != nil {
		c.TeamsWebhook = *teams
	}
	return &c, nil
}

func (r *Repository) UpsertAlertConfig(ctx context.Context, config *AlertConfig) error {
	current, err := r.GetAlertConfig(ctx, config.TenantID)
	if err != nil {
		return err
	}

	if current == nil {
		query := `INSERT INTO alert_configs (tenant_id, slack_webhook_url, teams_webhook_url, email_recipients) VALUES ($1, $2, $3, $4) RETURNING id, created_at, updated_at`
		return db.Pool.QueryRow(ctx, query, config.TenantID, config.SlackWebhook, config.TeamsWebhook, config.EmailRecipients).Scan(&config.ID, &config.CreatedAt, &config.UpdatedAt)
	} else {
		query := `UPDATE alert_configs SET slack_webhook_url=$1, teams_webhook_url=$2, email_recipients=$3, updated_at=NOW() WHERE id=$4 RETURNING updated_at`
		config.ID = current.ID // Ensure we update the correct ID
		config.CreatedAt = current.CreatedAt
		return db.Pool.QueryRow(ctx, query, config.SlackWebhook, config.TeamsWebhook, config.EmailRecipients, current.ID).Scan(&config.UpdatedAt)
	}
}
