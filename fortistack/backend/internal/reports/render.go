package reports

import (
	"bytes"
	"fmt"
	"html/template"
	"os"
	"path/filepath"
)

const (
	TemplateDir = "templates/"
	AssetDir    = "assets/"
)

type Renderer struct{}

type ReportData struct {
	*Report
	Styles template.HTML
}

func Render(report *Report) (string, error) {
	var mainTemplate string
	switch report.ReportType {
	case TypeSnapshot:
		mainTemplate = "snapshot.html"
	case TypeMonthly:
		mainTemplate = "full_report.html"
	default:
		return "", fmt.Errorf("unknown report type: %s", report.ReportType)
	}

	// Read CSS
	cssBytes, err := os.ReadFile(filepath.Join(AssetDir, "report.css"))
	if err != nil {
		// Fallback to empty logging or error?
		// For now log and continue or fail? Fail is better to catch issues.
		// Try absolute path if relative fails (e.g. in test vs docker)
		if os.IsNotExist(err) {
			// Try /app/assets/report.css
			cssBytes, err = os.ReadFile("/app/assets/report.css")
		}
		if err != nil {
			return "", fmt.Errorf("failed to load css: %w", err)
		}
	}

	// Parse main template and all partials
	t, err := template.ParseGlob(TemplateDir + "partials/*.html")
	if err != nil {
		return "", fmt.Errorf("failed to parse partials: %w", err)
	}

	t, err = t.ParseFiles(TemplateDir + mainTemplate)
	if err != nil {
		return "", fmt.Errorf("failed to parse main template %s: %w", mainTemplate, err)
	}

	data := ReportData{
		Report: report,
		Styles: template.HTML(fmt.Sprintf("<style>%s</style>", cssBytes)),
	}

	var buf bytes.Buffer
	if err := t.ExecuteTemplate(&buf, mainTemplate, data); err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	return buf.String(), nil
}
