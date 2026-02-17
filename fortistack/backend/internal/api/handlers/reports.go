package handlers

import (
	"encoding/json"
	"fmt"
	"fortistack/internal/api/middleware"
	"fortistack/internal/api/responses"
	"fortistack/internal/auth"
	"fortistack/internal/reports"
	"fortistack/internal/risk"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
)

type ReportHandler struct {
	Service *reports.Service
}

func NewReportHandler(s *reports.Service) *ReportHandler {
	return &ReportHandler{Service: s}
}

func (h *ReportHandler) CreateSnapshot(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "id")

	user := middleware.GetUser(r.Context())
	if err := auth.CheckPermission(user, tenantID, auth.RoleTenantAdmin); err != nil {
		responses.ErrorJSON(w, http.StatusForbidden, err)
		return
	}

	var input risk.Input
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		responses.ErrorJSON(w, http.StatusBadRequest, err)
		return
	}

	report, err := h.Service.GenerateSnapshot(r.Context(), tenantID, input)
	if err != nil {
		responses.ErrorJSON(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusCreated, report)
}

func (h *ReportHandler) CreateMonthly(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "id")

	user := middleware.GetUser(r.Context())
	if err := auth.CheckPermission(user, tenantID, auth.RoleTenantAdmin); err != nil {
		responses.ErrorJSON(w, http.StatusForbidden, err)
		return
	}

	// For monthly, we need period start/end and input
	var request struct {
		Start time.Time  `json:"start"`
		End   time.Time  `json:"end"`
		Input risk.Input `json:"input"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		responses.ErrorJSON(w, http.StatusBadRequest, err)
		return
	}

	report, err := h.Service.GenerateMonthly(r.Context(), tenantID, request.Start, request.End, request.Input)
	if err != nil {
		responses.ErrorJSON(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusCreated, report)
}

func (h *ReportHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "id")

	user := middleware.GetUser(r.Context())
	// Viewer role allowed
	if err := auth.CheckPermission(user, tenantID, auth.RoleViewer); err != nil {
		responses.ErrorJSON(w, http.StatusForbidden, err)
		return
	}

	list, err := h.Service.GetReports(r.Context(), tenantID)
	if err != nil {
		responses.ErrorJSON(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusOK, list)
}

func (h *ReportHandler) Download(w http.ResponseWriter, r *http.Request) {
	reportID := chi.URLParam(r, "id")

	// Need to check auth. But report ID doesn't tell us tenant ID easily unless we fetch it first.
	// Service.GetReport fetches report which has TenantID.

	report, err := h.Service.GetReport(r.Context(), reportID)
	if err != nil {
		responses.ErrorJSON(w, http.StatusInternalServerError, err)
		return
	}
	if report == nil {
		responses.ErrorJSON(w, http.StatusNotFound, responses.ErrNotFound)
		return
	}

	// Check permission
	user := middleware.GetUser(r.Context())
	if err := auth.CheckPermission(user, report.TenantID, auth.RoleViewer); err != nil {
		responses.ErrorJSON(w, http.StatusForbidden, err)
		return
	}

	// Get file path
	path := report.StoragePath

	// Verify file exists
	if _, err := os.Stat(path); os.IsNotExist(err) {
		responses.ErrorJSON(w, http.StatusNotFound, fmt.Errorf("report file not found on disk"))
		return
	}

	// Set headers
	w.Header().Set("Content-Type", "application/pdf")
	// Use a friendly filename
	filename := fmt.Sprintf("fortistack-%s-%s.pdf", report.ReportType, report.CreatedAt.Format("20060102"))
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))

	// Serve file
	http.ServeFile(w, r, path)
}
