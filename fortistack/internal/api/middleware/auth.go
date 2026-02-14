package middleware

import (
	"context"
	"net/http"
	"strings"

	"fortistack/internal/api/responses"
	"fortistack/internal/auth"
)

const (
	UserKey contextKey = "user"
)

func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			responses.ErrorJSON(w, http.StatusUnauthorized, responses.ErrUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			responses.ErrorJSON(w, http.StatusUnauthorized, responses.ErrUnauthorized)
			return
		}

		tokenString := parts[1]

		// Validate token
		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			responses.ErrorJSON(w, http.StatusUnauthorized, err)
			return
		}

		// Set user in context
		ctx := context.WithValue(r.Context(), UserKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func RequireRole(role auth.Role) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(UserKey).(*auth.Claims)
			if !ok {
				responses.ErrorJSON(w, http.StatusUnauthorized, responses.ErrUnauthorized)
				return
			}

			// Check if user has sufficient role
			// Logic: admin > tenant_admin > viewer
			// If required is admin, user must be admin.
			// If required is tenant_admin, user can be admin or tenant_admin.
			// If required is viewer, any valid user is OK (since they are at least viewer).

			userRole := auth.Role(claims.Role)
			allowed := false

			if userRole == auth.RoleAdmin {
				allowed = true
			} else if role == auth.RoleTenantAdmin {
				if userRole == auth.RoleTenantAdmin {
					allowed = true
				}
			} else if role == auth.RoleViewer {
				allowed = true // All roles are >= viewer
			}

			if !allowed {
				responses.ErrorJSON(w, http.StatusForbidden, responses.ErrForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func GetUser(ctx context.Context) *auth.Claims {
	if claims, ok := ctx.Value(UserKey).(*auth.Claims); ok {
		return claims
	}
	return nil
}
