package handlers

import (
	"encoding/json"
	"fortistack/internal/api/middleware"
	"fortistack/internal/api/responses"
	"fortistack/internal/auth"
	"fortistack/internal/scanner"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type ScanHandler struct {
	Service *scanner.Service
}

func NewScanHandler(s *scanner.Service) *ScanHandler {
	return &ScanHandler{Service: s}
}

// --- Scan Targets ---

func (h *ScanHandler) CreateTarget(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "id")
	user := middleware.GetUser(r.Context())
	if err := auth.CheckPermission(user, tenantID, auth.RoleTenantAdmin); err != nil {
		responses.ErrorJSON(w, http.StatusForbidden, err)
		return
	}

	var req struct {
		Image string `json:"image"`
		Label string `json:"label"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		responses.ErrorJSON(w, http.StatusBadRequest, err)
		return
	}
	if req.Image == "" {
		responses.ErrorJSON(w, http.StatusBadRequest, responses.ErrBadRequest)
		return
	}

	target, err := h.Service.CreateTarget(r.Context(), tenantID, req.Image, req.Label)
	if err != nil {
		responses.ErrorJSON(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusCreated, target)
}

func (h *ScanHandler) ListTargets(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "id")
	user := middleware.GetUser(r.Context())
	if err := auth.CheckPermission(user, tenantID, auth.RoleViewer); err != nil {
		responses.ErrorJSON(w, http.StatusForbidden, err)
		return
	}

	targets, err := h.Service.ListTargets(r.Context(), tenantID)
	if err != nil {
		responses.ErrorJSON(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusOK, targets)
}

func (h *ScanHandler) DeleteTarget(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "id")
	targetID := chi.URLParam(r, "targetId")
	user := middleware.GetUser(r.Context())
	if err := auth.CheckPermission(user, tenantID, auth.RoleTenantAdmin); err != nil {
		responses.ErrorJSON(w, http.StatusForbidden, err)
		return
	}

	if err := h.Service.DeleteTarget(r.Context(), targetID); err != nil {
		responses.ErrorJSON(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusNoContent, nil)
}

// --- Scan Runs ---

func (h *ScanHandler) TriggerScan(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "id")
	targetID := chi.URLParam(r, "targetId")
	user := middleware.GetUser(r.Context())
	if err := auth.CheckPermission(user, tenantID, auth.RoleTenantAdmin); err != nil {
		responses.ErrorJSON(w, http.StatusForbidden, err)
		return
	}

	run, err := h.Service.RunScan(r.Context(), tenantID, targetID)
	if err != nil {
		responses.ErrorJSON(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusAccepted, run)
}

func (h *ScanHandler) ListRuns(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "id")
	user := middleware.GetUser(r.Context())
	if err := auth.CheckPermission(user, tenantID, auth.RoleViewer); err != nil {
		responses.ErrorJSON(w, http.StatusForbidden, err)
		return
	}

	runs, err := h.Service.ListRuns(r.Context(), tenantID)
	if err != nil {
		responses.ErrorJSON(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusOK, runs)
}

func (h *ScanHandler) GetRun(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "id")
	runID := chi.URLParam(r, "runId")
	user := middleware.GetUser(r.Context())
	if err := auth.CheckPermission(user, tenantID, auth.RoleViewer); err != nil {
		responses.ErrorJSON(w, http.StatusForbidden, err)
		return
	}

	run, err := h.Service.GetRun(r.Context(), runID)
	if err != nil {
		responses.ErrorJSON(w, http.StatusInternalServerError, err)
		return
	}
	if run == nil {
		responses.ErrorJSON(w, http.StatusNotFound, responses.ErrNotFound)
		return
	}

	responses.JSON(w, http.StatusOK, run)
}
