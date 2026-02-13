package handlers

import (
	"encoding/json"
	"fortistack/internal/api/middleware"
	"fortistack/internal/api/responses"
	"fortistack/internal/auth"
	"fortistack/internal/tenants"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type TenantHandler struct {
	Service *tenants.Service
}

func NewTenantHandler(s *tenants.Service) *TenantHandler {
	return &TenantHandler{Service: s}
}

func (h *TenantHandler) Create(w http.ResponseWriter, r *http.Request) {
	var t tenants.Tenant
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		responses.ErrorJSON(w, http.StatusBadRequest, err)
		return
	}

	if err := h.Service.CreateTenant(r.Context(), &t); err != nil {
		responses.ErrorJSON(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusCreated, t)
}

func (h *TenantHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	all, err := h.Service.GetAllTenants(r.Context())
	if err != nil {
		responses.ErrorJSON(w, http.StatusInternalServerError, err)
		return
	}
	responses.JSON(w, http.StatusOK, all)
}

func (h *TenantHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	// RBAC Check
	user := middleware.GetUser(r.Context())
	if err := auth.CheckPermission(user, id, auth.RoleTenantAdmin); err != nil {
		responses.ErrorJSON(w, http.StatusForbidden, err)
		return
	}

	t, err := h.Service.GetTenant(r.Context(), id)
	if err != nil {
		responses.ErrorJSON(w, http.StatusInternalServerError, err)
		return
	}
	if t == nil {
		responses.ErrorJSON(w, http.StatusNotFound, responses.ErrNotFound)
		return
	}
	responses.JSON(w, http.StatusOK, t)
}

func (h *TenantHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var t tenants.Tenant
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		responses.ErrorJSON(w, http.StatusBadRequest, err)
		return
	}
	t.ID = id

	if err := h.Service.UpdateTenant(r.Context(), &t); err != nil {
		responses.ErrorJSON(w, http.StatusInternalServerError, err)
		return
	}
	responses.JSON(w, http.StatusOK, t)
}

func (h *TenantHandler) GetAlertConfig(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	user := middleware.GetUser(r.Context())
	if err := auth.CheckPermission(user, id, auth.RoleTenantAdmin); err != nil {
		responses.ErrorJSON(w, http.StatusForbidden, err)
		return
	}

	cfg, err := h.Service.GetAlertConfig(r.Context(), id)
	if err != nil {
		responses.ErrorJSON(w, http.StatusInternalServerError, err)
		return
	}
	responses.JSON(w, http.StatusOK, cfg) // cfg might be nil, which returns null in JSON
}

func (h *TenantHandler) UpdateAlertConfig(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	user := middleware.GetUser(r.Context())
	if err := auth.CheckPermission(user, id, auth.RoleTenantAdmin); err != nil {
		responses.ErrorJSON(w, http.StatusForbidden, err)
		return
	}

	var cfg tenants.AlertConfig
	if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
		responses.ErrorJSON(w, http.StatusBadRequest, err)
		return
	}
	cfg.TenantID = id

	if err := h.Service.UpsertAlertConfig(r.Context(), &cfg); err != nil {
		responses.ErrorJSON(w, http.StatusInternalServerError, err)
		return
	}
	responses.JSON(w, http.StatusOK, cfg)
}
