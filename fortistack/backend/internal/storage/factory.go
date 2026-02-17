package storage

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"strings"
)

// NewFromEnv creates the appropriate ObjectStore based on STORAGE_DRIVER env var.
// Returns (store, nil) on success.
func NewFromEnv(ctx context.Context) (ObjectStore, error) {
	driver := strings.ToLower(os.Getenv("STORAGE_DRIVER"))
	if driver == "" {
		driver = "local"
	}

	switch driver {
	case "local":
		dir := os.Getenv("STORAGE_LOCAL_DIR")
		if dir == "" {
			dir = os.Getenv("REPORT_WORKDIR") // backward compat
		}
		if dir == "" {
			dir = "/app/workdir"
		}
		slog.Info("Using local filesystem storage", "dir", dir)
		return NewLocalFSStorage(dir), nil

	case "s3":
		cfg := S3Config{
			Endpoint:       os.Getenv("STORAGE_S3_ENDPOINT"),
			AccessKey:      os.Getenv("STORAGE_S3_ACCESS_KEY"),
			SecretKey:      os.Getenv("STORAGE_S3_SECRET_KEY"),
			Bucket:         os.Getenv("STORAGE_S3_BUCKET"),
			Region:         os.Getenv("STORAGE_S3_REGION"),
			ForcePathStyle: os.Getenv("STORAGE_S3_FORCE_PATH_STYLE") == "true",
			DisableSSL:     os.Getenv("STORAGE_S3_DISABLE_SSL") == "true",
		}
		if cfg.Bucket == "" {
			cfg.Bucket = "fortistack"
		}
		if cfg.Region == "" {
			cfg.Region = "us-east-1"
		}

		store, err := NewS3Storage(ctx, cfg)
		if err != nil {
			return nil, fmt.Errorf("failed to init S3 storage: %w", err)
		}

		// Auto-create bucket for dev convenience (MinIO, Ceph)
		if err := store.EnsureBucket(ctx); err != nil {
			slog.Warn("Could not ensure S3 bucket exists (may already exist)", "error", err)
		}

		return store, nil

	default:
		return nil, fmt.Errorf("unknown STORAGE_DRIVER: %s (expected 'local' or 's3')", driver)
	}
}
