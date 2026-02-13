package alerts

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"fortistack/internal/risk"
)

func SendTeams(ctx context.Context, webhookURL string, tenantName string, reportType string, score int, downloadURL string, findings []risk.Finding) error {
	// Simple Message Card format for Teams
	msg := map[string]interface{}{
		"@type":      "MessageCard",
		"@context":   "http://schema.org/extensions",
		"themeColor": "0076D7",
		"summary":    "FortiStack Report Available",
		"sections": []map[string]interface{}{
			{
				"activityTitle":    "FortiStack Risk Report",
				"activitySubtitle": fmt.Sprintf("Tenant: %s", tenantName),
				"facts": []map[string]string{
					{"name": "Report Type", "value": reportType},
					{"name": "Global Score", "value": fmt.Sprintf("%d", score)},
				},
				"markdown": true,
			},
		},
		"potentialAction": []map[string]interface{}{
			{
				"@type": "OpenUri",
				"name":  "Download Report",
				"targets": []map[string]string{
					{"os": "default", "uri": downloadURL},
				},
			},
		},
	}

	if len(findings) > 0 {
		var findingText string
		limit := 3
		if len(findings) < limit {
			limit = len(findings)
		}
		for i := 0; i < limit; i++ {
			findingText += fmt.Sprintf("- **%s**: %s\n", findings[i].Severity, findings[i].Title)
		}

		// Add to section facts or text? Text is better for list.
		sections := msg["sections"].([]map[string]interface{})
		sections[0]["text"] = "**Top Findings:**\n" + findingText
	}

	payload, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", webhookURL, bytes.NewBuffer(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("teams webhook failed with status: %d", resp.StatusCode)
	}

	return nil
}
