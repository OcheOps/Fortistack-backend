package main

import (
	"context"
	"fortistack/internal/auth"
	"fortistack/internal/db"
	"fortistack/internal/tenants"
	"log/slog"
	"os"
)

func main() {
	// Logger
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// DB Connection
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		// Fallback for local dev convenience if .env not loaded by shell
		dsn = "postgres://postgres:postgres@localhost:5432/fortistack?sslmode=disable"
		slog.Warn("DB_DSN not set, using default", "dsn", dsn)
	}

	if err := db.Init(dsn); err != nil {
		slog.Error("Failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	ctx := context.Background()

	// 1. Create Super Admin Tenant (Optional? Platform admins might not need a tenant,
	// but currently the schema links users to tenants usually.
	// However, Platform Admin is a role. If TenantID is nil, they are Super Admin.)

	adminEmail := os.Getenv("ADMIN_EMAIL")
	if adminEmail == "" {
		adminEmail = "admin@fortistack.local"
	}

	adminPassword := os.Getenv("ADMIN_PASSWORD")
	if adminPassword == "" {
		adminPassword = "SafePassword123!"
	}

	slog.Info("Seeding Super Admin", "email", adminEmail)

	// Check if user exists
	var exists bool
	err := db.Pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)", adminEmail).Scan(&exists)
	if err != nil {
		slog.Error("Failed to check user existence", "error", err)
		os.Exit(1)
	}

	if exists {
		slog.Info("Admin user already exists. Skipping.")
		return
	}

	// Create Platform Admin (TenantID = NIL)
	// We can use auth.Service logic or direct DB.
	// Let's use direct code to avoid importing everything if not needed,
	// but using Service is cleaner.

	repo := tenants.NewRepository()
	authService := auth.NewService()
	// authService doesn't use repo, so it's fine.

	// Register Platform Admin
	// Register method takes Role and TenantID.
	// Role = "admin"
	// TenantID = nil
	user, err := authService.Register(ctx, adminEmail, adminPassword, auth.RoleAdmin, nil)
	if err != nil {
		slog.Error("Failed to create admin user", "error", err)
		os.Exit(1)
	}

	slog.Info("Successfully created Super Admin user", "id", user.ID)

	// 2. Create a Demo Tenant if none exist?
	// Let's create one for testing.
	demoTenantName := "Demo Corp"
	var tenantExists bool
	db.Pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM tenants WHERE name=$1)", demoTenantName).Scan(&tenantExists)

	if !tenantExists {
		t := &tenants.Tenant{
			Name:     demoTenantName,
			Region:   "us-east-1",
			IsActive: true,
		}
		if err := repo.Create(ctx, t); err != nil {
			slog.Error("Failed to create demo tenant", "error", err)
		} else {
			slog.Info("Created Demo Tenant", "id", t.ID)
		}
	}
}
