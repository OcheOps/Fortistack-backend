package handlers

import (
	"encoding/json"
	"fmt"
	"fortistack/internal/api/middleware"
	"fortistack/internal/api/responses"
	"fortistack/internal/auth"
	"fortistack/internal/reports"
	"fortistack/internal/risk"
	"fortistack/internal/storage"
	"io"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
)

type ReportHandler struct {
	Service *reports.Service
	Store   storage.ObjectStore
}

func NewReportHandler(s *reports.Service, store storage.ObjectStore) *ReportHandler {
	return &ReportHandler{Service: s, Store: store}
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

	// Fetch report to get tenant_id and storage_key
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

	// Read from storage backend
	reader, contentType, err := h.Store.Get(r.Context(), report.StorageKey)
	if err != nil {
		responses.ErrorJSON(w, http.StatusNotFound, fmt.Errorf("report file not found in storage"))
		return
	}
	defer reader.Close()

	// Set response headers
	if contentType == "" {
		contentType = "application/pdf"
	}
	filename := fmt.Sprintf("fortistack-%s-%s.pdf", report.ReportType, report.CreatedAt.Format("20060102"))

	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	w.WriteHeader(http.StatusOK)

	if _, err := io.Copy(w, reader); err != nil {
		// Headers already sent, log and abort
		fmt.Printf("error streaming PDF: %v\n", err)
	}
}
