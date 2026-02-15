package alerts

import (
	"time"
)

type NotificationType string

const (
	TypeSlack NotificationType = "slack"
	TypeTeams NotificationType = "teams"
	TypeEmail NotificationType = "email"
)

type NotificationLog struct {
	ID        string           `json:"id"`
	TenantID  string           `json:"tenant_id"`
	Type      NotificationType `json:"type"`
	Status    string           `json:"status"` // sent | failed
	Error     string           `json:"error,omitempty"`
	CreatedAt time.Time        `json:"created_at"`
}
