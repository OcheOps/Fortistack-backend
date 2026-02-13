package auth

import (
	"time"
)

type Role string

const (
	RoleAdmin       Role = "admin"
	RoleTenantAdmin Role = "tenant_admin"
	RoleViewer      Role = "viewer"
)

type User struct {
	ID           string    `json:"id"`
	TenantID     *string   `json:"tenant_id,omitempty"` // nil for platform admin
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         Role      `json:"role"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}
