package storage

import (
	"context"
	"io"
)

// ObjectStore is the abstraction for report/artifact storage.
// Implementations: LocalFSStorage (dev), S3Storage (Ceph RGW / MinIO / AWS).
type ObjectStore interface {
	// Put stores an object. key is like "tenants/{tid}/reports/{rid}.pdf".
	Put(ctx context.Context, key, contentType string, body io.Reader) error

	// Get retrieves an object. Caller must close the returned ReadCloser.
	Get(ctx context.Context, key string) (io.ReadCloser, string, error) // body, contentType, err

	// Delete removes an object.
	Delete(ctx context.Context, key string) error
}
