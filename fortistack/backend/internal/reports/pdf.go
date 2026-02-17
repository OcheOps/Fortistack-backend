package reports

import (
	"bytes"
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

type PDFGenerator struct {
	WorkDir string
}

func NewPDFGenerator() *PDFGenerator {
	dir := os.Getenv("REPORT_WORKDIR")
	if dir == "" {
		dir = "/tmp/reports"
	}
	return &PDFGenerator{WorkDir: dir}
}

func (g *PDFGenerator) Generate(ctx context.Context, htmlContent string, reportID string) (string, error) {
	// Ensure workdir exists
	if err := os.MkdirAll(g.WorkDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create report directory: %w", err)
	}

	filename := fmt.Sprintf("%s.pdf", reportID)
	outputPath := filepath.Join(g.WorkDir, filename)

	// Context with timeout (as per requirements)
	// "Context timeouts on all external calls"
	// Caller should provide context with timeout, but we can enforce safety.
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "wkhtmltopdf",
		"--enable-local-file-access",
		"--quiet",
		"-", // Read HTML from stdin
		outputPath,
	)

	cmd.Stdin = bytes.NewBufferString(htmlContent)

	// Capture stderr for debugging
	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	slog.Info("Starting PDF generation", "report_id", reportID, "output_path", outputPath)

	if err := cmd.Run(); err != nil {
		slog.Error("wkhtmltopdf failed", "error", err, "stderr", stderr.String())
		return "", fmt.Errorf("wkhtmltopdf failed: %v, stderr: %s", err, stderr.String())
	}

	slog.Info("PDF generation successful", "path", outputPath)
	return outputPath, nil
}
