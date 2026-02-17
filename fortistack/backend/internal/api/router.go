package api

import (
	"fortistack/internal/api/handlers"
	"fortistack/internal/api/middleware"
	"fortistack/internal/auth"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func NewRouter(
	authHandler *handlers.AuthHandler,
	tenantHandler *handlers.TenantHandler,
	reportHandler *handlers.ReportHandler,
	scanHandler *handlers.ScanHandler,
) http.Handler {
	r := chi.NewRouter()

	// Global Middleware
	r.Use(chimiddleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(middleware.RateLimit)

	// CORS
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://*", "http://*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link", "Content-Disposition"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Public Routes
	r.Get("/healthz", handlers.Healthz)
	r.Get("/readyz", handlers.Readyz)
	r.Post("/auth/login", authHandler.Login)
	r.Post("/auth/signup", authHandler.Signup)
	r.Post("/auth/refresh", authHandler.Refresh)

	// Protected Routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth)

		r.Post("/auth/logout", authHandler.Logout)
		r.Post("/auth/register", middleware.RequireRole(auth.RoleAdmin)(http.HandlerFunc(authHandler.Register)).ServeHTTP)

		// Tenants
		r.Route("/tenants", func(r chi.Router) {
			r.Post("/", middleware.RequireRole(auth.RoleAdmin)(http.HandlerFunc(tenantHandler.Create)).ServeHTTP)
			r.Get("/", middleware.RequireRole(auth.RoleAdmin)(http.HandlerFunc(tenantHandler.GetAll)).ServeHTTP)

			r.Route("/{id}", func(r chi.Router) {
				r.Get("/", tenantHandler.Get)
				r.Patch("/", middleware.RequireRole(auth.RoleAdmin)(http.HandlerFunc(tenantHandler.Update)).ServeHTTP)

				// Admin create user for tenant
				r.Post("/users", middleware.RequireRole(auth.RoleAdmin)(http.HandlerFunc(authHandler.CreateUser)).ServeHTTP)

				r.Get("/alert-config", tenantHandler.GetAlertConfig)
				r.Put("/alert-config", tenantHandler.UpdateAlertConfig)

				// Reports
				r.Route("/reports", func(r chi.Router) {
					r.Post("/snapshot", reportHandler.CreateSnapshot)
					r.Post("/monthly", reportHandler.CreateMonthly)
					r.Get("/", reportHandler.List)
				})

				// Scan Targets
				r.Route("/scan-targets", func(r chi.Router) {
					r.Post("/", scanHandler.CreateTarget)
					r.Get("/", scanHandler.ListTargets)
					r.Delete("/{targetId}", scanHandler.DeleteTarget)
					r.Post("/{targetId}/scan", scanHandler.TriggerScan)
				})

				// Scan Runs
				r.Get("/scans", scanHandler.ListRuns)
				r.Get("/scans/{runId}", scanHandler.GetRun)
			})
		})

		// Reports Download (by report ID, not tenant-scoped URL)
		r.Get("/reports/{id}/download", reportHandler.Download)
	})

	return r
}
