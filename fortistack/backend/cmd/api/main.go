package main

import (
	"context"
	"fortistack/internal/alerts"
	"fortistack/internal/api"
	"fortistack/internal/api/handlers"
	"fortistack/internal/auth"
	"fortistack/internal/db"
	"fortistack/internal/reports"
	"fortistack/internal/scanner"
	"fortistack/internal/storage"
	"fortistack/internal/tenants"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	// 1. Logger
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// 2. Initialize DB
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		slog.Error("DB_DSN not set")
		os.Exit(1)
	}
	if err := db.Init(dsn); err != nil {
		slog.Error("Failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	// 3. Initialize Storage
	ctx := context.Background()
	store, err := storage.NewFromEnv(ctx)
	if err != nil {
		slog.Error("Failed to initialize storage", "error", err)
		os.Exit(1)
	}

	// 4. Initialize Repos
	tenantRepo := tenants.NewRepository()
	reportRepo := reports.NewRepository()
	scanRepo := scanner.NewRepository()

	// 5. Initialize Services
	authService := auth.NewService()
	tenantService := tenants.NewService(tenantRepo)
	alertService := alerts.NewService(tenantRepo)
	reportService := reports.NewService(reportRepo, tenantRepo, alertService, store)
	scanService := scanner.NewService(scanRepo, store)

	// 6. Initialize Handlers
	authHandler := handlers.NewAuthHandler(authService)
	tenantHandler := handlers.NewTenantHandler(tenantService)
	reportHandler := handlers.NewReportHandler(reportService, store)
	scanHandler := handlers.NewScanHandler(scanService)

	// 7. Router
	router := api.NewRouter(authHandler, tenantHandler, reportHandler, scanHandler)

	// 8. Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 120 * time.Second, // Increased for PDF streaming
		IdleTimeout:  120 * time.Second,
	}

	go func() {
		slog.Info("Starting server", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Server failed", "error", err)
			os.Exit(1)
		}
	}()

	// 9. Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	slog.Info("Shutting down server...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("Server forced to shutdown", "error", err)
	}

	slog.Info("Server exiting")
}
