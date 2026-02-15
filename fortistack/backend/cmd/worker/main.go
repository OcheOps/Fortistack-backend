package main

import (
	"fortistack/internal/alerts"
	"fortistack/internal/db"
	"fortistack/internal/reports"
	"fortistack/internal/scheduler"
	"fortistack/internal/tenants"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
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

	// 3. Initialize Shared Services
	// Worker needs Reports + Tenants + Alerts services
	tenantRepo := tenants.NewRepository()
	reportRepo := reports.NewRepository()

	tenantService := tenants.NewService(tenantRepo)
	alertService := alerts.NewService(tenantRepo)
	reportService := reports.NewService(reportRepo, tenantRepo, alertService)

	// 4. Initialize Scheduler
	sched := scheduler.NewScheduler(reportService, tenantService)

	// 5. Start Scheduler
	sched.Start()

	// 6. Wait for Signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	slog.Info("Shutting down worker...")
	sched.Stop()

	slog.Info("Worker exiting")
}
