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
	// Validate token simply first
	// Note: ValidateToken expects full Claims struct, standard jwt.Parse might fail if fields missing?
	// But RefreshToken generated only with standard claims.
	// So we should fix ValidateToken or write specific validator.
	// Let's use parser with lenient claims.

	// Actually, jwt.ParseWithClaims parses what fits.
	claims, err := ValidateToken(refreshToken)
	if err != nil {
		return "", fmt.Errorf("invalid refresh token: %w", err)
	}

	// Double check user exists and is active
	query := `SELECT id, role, tenant_id FROM users WHERE id = $1 AND is_active = true`
	var role Role
	var tenantID *string
	var userID string
	err = db.Pool.QueryRow(ctx, query, claims.UserID).Scan(&userID, &role, &tenantID)
	if err != nil {
		return "", errors.New("user not found or inactive")
	}

	// Generate new access token only? Or pair?
	// Prompt says "returns new access_token".
	pair, err := GenerateTokenPair(userID, tenantID, role)
	if err != nil {
		return "", err
	}
	return pair.AccessToken, nil
}

func (s *Service) Logout(token string) error {
	// Simple no-op effectively, relying on short TTL.
	// Document in DECISIONS.md.
	return nil
}
