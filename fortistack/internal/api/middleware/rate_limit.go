package middleware

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

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
		ip := r.RemoteAddr
		// If behind proxy (Standard approach uses X-Forwarded-For)
		if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
			ip = forwarded
		}

		limiter := getLimiter(ip)
		if !limiter.Allow() {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			json.NewEncoder(w).Encode(map[string]string{"error": "Too many requests"})
			return
		}
		next.ServeHTTP(w, r)
	})
}
