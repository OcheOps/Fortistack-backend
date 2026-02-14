package middleware

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"fortistack/internal/api/responses"

	"golang.org/x/time/rate"
)

var visitors = make(map[string]*rate.Limiter)
var cleanupVisitors = make(map[string]time.Time)
var mu sync.Mutex

func init() {
	go cleanupLoop()
}

func getLimiter(ip string) *rate.Limiter {
	mu.Lock()
	defer mu.Unlock()

	limiter, exists := visitors[ip]
	if !exists {
		// New limiter: 10 requests per second with burst of 30
		limiter = rate.NewLimiter(rate.Limit(10), 30)
		visitors[ip] = limiter
	}
	cleanupVisitors[ip] = time.Now()
	return limiter
}

func cleanupLoop() {
	for {
		time.Sleep(1 * time.Minute)
		mu.Lock()
		for ip, lastSeen := range cleanupVisitors {
			if time.Since(lastSeen) > 3*time.Minute {
				delete(visitors, ip)
				delete(cleanupVisitors, ip)
			}
		}
		mu.Unlock()
	}
}

func RateLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := ""
		// If behind proxy (Standard approach uses X-Forwarded-For)
		if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
			parts := strings.Split(forwarded, ",")
			ip = strings.TrimSpace(parts[0])
		}

		if ip == "" {
			host, _, err := net.SplitHostPort(r.RemoteAddr)
			if err != nil {
				// Fallback if RemoteAddr is not host:port (e.g. pipe)
				ip = r.RemoteAddr
			} else {
				ip = host
			}
		}

		limiter := getLimiter(ip)
		if !limiter.Allow() {
			responses.ErrorJSON(w, http.StatusTooManyRequests, http.ErrHandlerTimeout) // Or custom error
			return
		}
		next.ServeHTTP(w, r)
	})
}
