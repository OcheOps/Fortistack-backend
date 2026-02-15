package risk

import (
	"time"
)

type Input struct {
	// Availability
	UptimeMetric float64 // Percentage like 99.9

	// Backup
	LastBackupAgeDays int

	// Security
	OpenPortsCount      int
	PublicExposureFound bool

	// Compliance
	LoggingEnabled     bool
	AccessReviewRecent bool

	// Cost
	MonthlySpendSpikePercent float64
}

type Score struct {
	Global       int
	Availability int
	Backup       int
	Security     int
	Compliance   int
	Cost         int

	CalculatedAt time.Time
}

type Finding struct {
	Severity string // CRITICAL | WARNING | INFO
	Title    string
	Detail   string
}

type Report struct {
	Score    Score
	Findings []Finding
}
