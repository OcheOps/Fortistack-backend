package middleware

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"runtime/debug"
)

func Recover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)

				response := map[string]string{
					"error": "Internal Server Error",
				}
				json.NewEncoder(w).Encode(response)

				slog.Error("Panic recovered", "error", err, "stack", string(debug.Stack()))
			}
		}()
		next.ServeHTTP(w, r)
	})
}
