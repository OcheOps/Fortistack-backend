package risk

// Default values for missing inputs (to be applied by caller)
const (
	DefaultUptimeMetric             = 99.0
	DefaultLastBackupAgeDays        = 7
	DefaultOpenPortsCount           = 0
	DefaultPublicExposureFound      = false
	DefaultLoggingEnabled           = true
	DefaultAccessReviewRecent       = false
	DefaultMonthlySpendSpikePercent = 0.0
)

// Weights for global score calculation
const (
	WeightAvailability = 0.25
	WeightBackup       = 0.25
	WeightSecurity     = 0.20
	WeightCompliance   = 0.20
	WeightCost         = 0.10
)

// Impact thresholds (example)
const (
	MaxAcceptableBackupAge = 30
	MinAcceptableUptime    = 99.0
)
