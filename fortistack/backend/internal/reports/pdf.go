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
	TempDir string
}

func NewPDFGenerator() *PDFGenerator {
	dir := os.Getenv("REPORT_WORKDIR")
	if dir == "" {
		dir = "/tmp/fortistack-pdf"
	}
	return &PDFGenerator{TempDir: dir}
}

// Generate renders HTML into a PDF and returns the raw PDF bytes.
// The caller is responsible for storing the bytes via the storage layer.
func (g *PDFGenerator) Generate(ctx context.Context, htmlContent string, reportID string) ([]byte, error) {
	// Ensure temp dir exists
	if err := os.MkdirAll(g.TempDir, 0755); err != nil {
		slog.Error("pdf: failed to create temp dir", "dir", g.TempDir, "error", err)
		return nil, fmt.Errorf("failed to create temp directory: %w", err)
	}

	filename := fmt.Sprintf("%s.pdf", reportID)
	outputPath := filepath.Join(g.TempDir, filename)

	slog.Info("pdf: starting generation", "report_id", reportID, "output_path", outputPath)

	ctx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "wkhtmltopdf",
		"--enable-local-file-access",
		"--quiet",
		"--page-size", "A4",
		"--margin-top", "15mm",
		"--margin-bottom", "15mm",
		"--margin-left", "10mm",
		"--margin-right", "10mm",
		"-",
		outputPath,
	)

	cmd.Stdin = bytes.NewBufferString(htmlContent)

	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		slog.Error("pdf: wkhtmltopdf failed",
			"report_id", reportID,
			"error", err,
			"stderr", stderr.String(),
		)
		return nil, fmt.Errorf("wkhtmltopdf failed: %v, stderr: %s", err, stderr.String())
	}

	// Read the generated PDF into memory
	pdfBytes, err := os.ReadFile(outputPath)
	if err != nil {
		slog.Error("pdf: failed to read generated PDF", "path", outputPath, "error", err)
		return nil, fmt.Errorf("failed to read PDF: %w", err)
	}

	// Clean up local temp file
	_ = os.Remove(outputPath)

	slog.Info("pdf: generation successful", "report_id", reportID, "size_bytes", len(pdfBytes))
	return pdfBytes, nil
}
