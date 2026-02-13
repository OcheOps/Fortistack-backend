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

func SendSlack(ctx context.Context, webhookURL string, tenantName string, reportType string, score int, downloadURL string, findings []risk.Finding) error {
	msg := map[string]interface{}{
		"text": fmt.Sprintf("*FortiStack Report - %s*\nTenant: %s\nGlobal Score: %d\nDownload: %s", reportType, tenantName, score, downloadURL),
		"blocks": []map[string]interface{}{
			{
				"type": "section",
				"text": map[string]string{
					"type": "mrkdwn",
					"text": fmt.Sprintf("*FortiStack Report Available*\n*Type:* %s\n*Tenant:* %s\n*Global Score:* %d", reportType, tenantName, score),
				},
			},
			{
				"type": "actions",
				"elements": []map[string]interface{}{
					{
						"type": "button",
						"text": map[string]string{
							"type": "plain_text",
							"text": "Download PDF",
						},
						"url": downloadURL,
					},
				},
			},
		},
	}

	// Add findings if crucial
	if len(findings) > 0 {
		var findingText string
		limit := 3
		if len(findings) < limit {
			limit = len(findings)
		}
		for i := 0; i < limit; i++ {
			findingText += fmt.Sprintf("• *%s*: %s\n", findings[i].Severity, findings[i].Title)
		}

		msg["blocks"] = append(msg["blocks"].([]map[string]interface{}), map[string]interface{}{
			"type": "section",
			"text": map[string]string{
				"type": "mrkdwn",
				"text": "*Top Findings:*\n" + findingText,
			},
		})
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
		return fmt.Errorf("slack webhook failed with status: %d", resp.StatusCode)
	}

	return nil
}
