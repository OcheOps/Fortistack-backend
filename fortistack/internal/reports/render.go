package reports

import (
	"bytes"
	"fmt"
	"html/template"
)

const (
	TemplateDir = "templates/"
)

type Renderer struct {
	// Cache templates if needed, but for simplicity we parse per request to allow hot reloading during dev?
	// Given strict "production-ready", caching is better.
	// But let's keep it simple and robust.
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

	// Parse main template and all partials
	t, err := template.ParseGlob(TemplateDir + "partials/*.html")
	if err != nil {
		return "", fmt.Errorf("failed to parse partials: %w", err)
	}

	t, err = t.ParseFiles(TemplateDir + mainTemplate)
	if err != nil {
		return "", fmt.Errorf("failed to parse main template %s: %w", mainTemplate, err)
	}

	var buf bytes.Buffer
	// Execute the template matching the main file name (e.g. "snapshot.html")
	// Note: template.ParseFiles uses the base name of the file as the template name.
	if err := t.ExecuteTemplate(&buf, mainTemplate, report); err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	return buf.String(), nil
}
