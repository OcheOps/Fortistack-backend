package tenants

import (
	"time"
)

type Tenant struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Region    string    `json:"region"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type AlertConfig struct {
	ID              string    `json:"id"`
	TenantID        string    `json:"tenant_id"`
	SlackWebhook    string    `json:"slack_webhook_url"`
	TeamsWebhook    string    `json:"teams_webhook_url"`
	EmailRecipients []string  `json:"email_recipients"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
