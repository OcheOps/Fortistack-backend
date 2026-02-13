package scheduler

import (
	"fortistack/internal/reports"
	"fortistack/internal/tenants"
	"log/slog"
	"os"
	"time"

	"github.com/robfig/cron/v3"
)

type Scheduler struct {
	cron *cron.Cron
}

func NewScheduler(reportsService *reports.Service, tenantsService *tenants.Service) *Scheduler {
	tz := os.Getenv("CRON_TZ")
	if tz == "" {
		tz = "UTC"
	}

	location, err := time.LoadLocation(tz)
	if err != nil {
		slog.Warn("Failed to load CRON_TZ, defaulting to UTC", "error", err)
		location = time.UTC
	}

	c := cron.New(cron.WithLocation(location))

	// Job logic is in jobs.go, we just use the struct
	job := &MonthlyReportJob{
		ReportsService: reportsService,
		TenantsService: tenantsService,
	}

	spec := os.Getenv("MONTHLY_CRON")
	if spec == "" {
		spec = "0 9 1 * *"
	}

	_, err = c.AddJob(spec, job)
	if err != nil {
		slog.Error("Failed to add monthly job to scheduler", "error", err)
	}

	return &Scheduler{cron: c}
}

func (s *Scheduler) Start() {
	slog.Info("Starting scheduler")
	s.cron.Start()
}

func (s *Scheduler) Stop() {
	slog.Info("Stopping scheduler")
	context := s.cron.Stop()
	<-context.Done() // Wait for running jobs to complete
}
