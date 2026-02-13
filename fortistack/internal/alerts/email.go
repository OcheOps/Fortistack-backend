package alerts

import (
	"context"
	"fmt"
	"net/smtp"
	"os"
	"strconv"
)

func SendEmail(ctx context.Context, recipients []string, tenantName, reportType string, score int, downloadURL string) error {
	host := os.Getenv("SMTP_HOST")
	portStr := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")
	from := os.Getenv("SMTP_FROM")

	if host == "" || len(recipients) == 0 {
		return nil // Skip if not configured or no recipients
	}

	port, _ := strconv.Atoi(portStr)
	addr := fmt.Sprintf("%s:%d", host, port)

	auth := smtp.PlainAuth("", user, pass, host)

	subject := fmt.Sprintf("Subject: FortiStack Report for %s\r\n", tenantName)
	body := fmt.Sprintf("From: %s\r\nTo: %s\r\n%s\r\n\r\n", from, recipients[0], subject) // Simplification for To header
	body += fmt.Sprintf("A new report is available for %s.\n\nType: %s\nGlobal Score: %d\n\nDownload: %s", tenantName, reportType, score, downloadURL)

	msg := []byte(body)

	// Context support for smtp is not direct in standard lib without wrapper, but we check ctx before sending.
	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
	}

	return smtp.SendMail(addr, auth, from, recipients, msg)
}
