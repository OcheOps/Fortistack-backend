package auth

import (
	"context"
	"errors"
	"fmt"
	"fortistack/internal/db"

	"github.com/jackc/pgx/v5"
)

type Service struct{}

func NewService() *Service {
	return &Service{}
}

func (s *Service) Register(ctx context.Context, email, password string, role Role, tenantID *string) (*User, error) {
	hash, err := HashPassword(password)
	if err != nil {
		return nil, err
	}

	u := &User{
		Email:        email,
		PasswordHash: hash,
		Role:         role,
		TenantID:     tenantID,
		IsActive:     true,
	}

	query := `INSERT INTO users (email, password_hash, role, tenant_id) VALUES ($1, $2, $3, $4) RETURNING id, created_at, updated_at`
	err = db.Pool.QueryRow(ctx, query, u.Email, u.PasswordHash, u.Role, u.TenantID).Scan(&u.ID, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("db error: %w", err)
	}

	return u, nil
}

func (s *Service) Login(ctx context.Context, email, password string) (*TokenPair, error) {
	query := `SELECT id, password_hash, role, tenant_id FROM users WHERE email = $1 AND is_active = true`
	var u User
	var tenantID *string
	err := db.Pool.QueryRow(ctx, query, email).Scan(&u.ID, &u.PasswordHash, &u.Role, &tenantID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("invalid credentials")
		}
		return nil, err
	}

	if !CheckPasswordHash(u.PasswordHash, password) {
		return nil, errors.New("invalid credentials")
	}

	return GenerateTokenPair(u.ID, tenantID, u.Role)
}

func (s *Service) Refresh(ctx context.Context, refreshToken string) (string, error) {
	claims, err := ValidateRefreshToken(refreshToken)
	if err != nil {
		return "", fmt.Errorf("invalid refresh token: %w", err)
	}

	query := `SELECT id, role, tenant_id FROM users WHERE id = $1 AND is_active = true`
	var role Role
	var tenantID *string
	var userID string
	err = db.Pool.QueryRow(ctx, query, claims.UserID).Scan(&userID, &role, &tenantID)
	if err != nil {
		return "", errors.New("user not found or inactive")
	}

	pair, err := GenerateTokenPair(userID, tenantID, role)
	if err != nil {
		return "", err
	}
	return pair.AccessToken, nil
}

func (s *Service) Logout(token string) error {
	return nil
}

// Signup handles the creation of a new tenant and its admin user transactionally.
func (s *Service) Signup(ctx context.Context, tenantName, region, email, password string) (*TokenPair, *User, error) {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// 1. Create Tenant
	var tenantID string
	err = tx.QueryRow(ctx, `INSERT INTO tenants (name, region, is_active) VALUES ($1, $2, true) RETURNING id`, tenantName, region).Scan(&tenantID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create tenant: %w", err)
	}

	// 2. Create User
	hash, err := HashPassword(password)
	if err != nil {
		return nil, nil, err
	}

	u := &User{
		Email:    email,
		Role:     RoleTenantAdmin,
		TenantID: &tenantID,
		IsActive: true,
	}

	err = tx.QueryRow(ctx, `INSERT INTO users (email, password_hash, role, tenant_id) VALUES ($1, $2, $3, $4) RETURNING id, created_at, updated_at`,
		u.Email, hash, u.Role, u.TenantID).Scan(&u.ID, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create user: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// 3. Generate Tokens
	tokenPair, err := GenerateTokenPair(u.ID, u.TenantID, u.Role)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	return tokenPair, u, nil
}

// CreateUserForTenant allows an admin to create a user for a specific tenant.
func (s *Service) CreateUserForTenant(ctx context.Context, tenantID, email, password string, role Role) (*User, error) {
	hash, err := HashPassword(password)
	if err != nil {
		return nil, err
	}

	u := &User{
		Email:    email,
		Role:     role,
		TenantID: &tenantID,
		IsActive: true,
	}

	query := `INSERT INTO users (email, password_hash, role, tenant_id) VALUES ($1, $2, $3, $4) RETURNING id, created_at, updated_at`
	err = db.Pool.QueryRow(ctx, query, u.Email, hash, u.Role, u.TenantID).Scan(&u.ID, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return u, nil
}
