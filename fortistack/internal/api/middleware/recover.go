package middleware

import (
	"fmt"
	"fortistack/internal/api/responses"
	"log/slog"
	"net/http"
	"runtime/debug"
)

func Recover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rvr := recover(); rvr != nil {
				var err error
				if e, ok := rvr.(error); ok {
					err = e
				} else {
					err = fmt.Errorf("%v", rvr)
				}

				slog.Error("Panic recovered", "error", err, "stack", string(debug.Stack()))

				responses.ErrorJSON(w, http.StatusInternalServerError, err)
			}
		}()
		next.ServeHTTP(w, r)
	})
}
