package storage

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

// LocalFSStorage stores objects on the local filesystem.
// Suitable for local development or single-node deployments.
type LocalFSStorage struct {
	BaseDir string
}

func NewLocalFSStorage(baseDir string) *LocalFSStorage {
	return &LocalFSStorage{BaseDir: baseDir}
}

func (s *LocalFSStorage) Put(ctx context.Context, key, contentType string, body io.Reader) error {
	fullPath := filepath.Join(s.BaseDir, key)

	// Ensure parent directory exists
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("local storage: failed to create dir %s: %w", dir, err)
	}

	f, err := os.Create(fullPath)
	if err != nil {
		return fmt.Errorf("local storage: failed to create file %s: %w", fullPath, err)
	}
	defer f.Close()

	if _, err := io.Copy(f, body); err != nil {
		return fmt.Errorf("local storage: failed to write file %s: %w", fullPath, err)
	}

	return nil
}

func (s *LocalFSStorage) Get(ctx context.Context, key string) (io.ReadCloser, string, error) {
	fullPath := filepath.Join(s.BaseDir, key)

	f, err := os.Open(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, "", fmt.Errorf("local storage: object not found: %s", key)
		}
		return nil, "", fmt.Errorf("local storage: failed to open file %s: %w", fullPath, err)
	}

	// Infer content type from extension
	ct := "application/octet-stream"
	ext := filepath.Ext(key)
	switch ext {
	case ".pdf":
		ct = "application/pdf"
	case ".json":
		ct = "application/json"
	case ".html":
		ct = "text/html"
	}

	return f, ct, nil
}

func (s *LocalFSStorage) Delete(ctx context.Context, key string) error {
	fullPath := filepath.Join(s.BaseDir, key)
	if err := os.Remove(fullPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("local storage: failed to delete %s: %w", fullPath, err)
	}
	return nil
}
