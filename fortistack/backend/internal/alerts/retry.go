package alerts

import (
	"context"
	"fmt"
	"log/slog"
	"math/rand"
	"time"
)

func retry(ctx context.Context, operation string, fn func() error) error {
	backoff := 250 * time.Millisecond
	maxRetries := 3

	for i := 0; i <= maxRetries; i++ {
		if err := fn(); err != nil {
			if i == maxRetries {
				return fmt.Errorf("failed after %d retries: %w", maxRetries, err)
			}

			// Check context before waiting
			if ctx.Err() != nil {
				return ctx.Err()
			}

			wait := backoff + time.Duration(rand.Intn(100))*time.Millisecond

			slog.Warn("Retrying operation", "op", operation, "attempt", i+1, "error", err)

			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(wait):
			}

			// Exponential backoff
			backoff *= 2
		} else {
			return nil
		}
	}
	return nil
}
