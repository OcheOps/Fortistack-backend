package handlers

import (
	"context"
	"net/http"
	"time"

	"fortistack/internal/api/responses"
	"fortistack/internal/db"
)

func Healthz(w http.ResponseWriter, r *http.Request) {
	responses.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func Readyz(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if err := db.Pool.Ping(ctx); err != nil {
		responses.ErrorJSON(w, http.StatusServiceUnavailable, err)
		return
	}

	responses.JSON(w, http.StatusOK, map[string]string{"status": "ready"})
}
