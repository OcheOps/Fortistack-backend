package handlers

import (
	"encoding/json"
	"errors"
	"fortistack/internal/api/responses"
	"fortistack/internal/auth"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type AuthHandler struct {
	Service *auth.Service
}

func NewAuthHandler(s *auth.Service) *AuthHandler {
	return &AuthHandler{Service: s}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		responses.ErrorJSON(w, http.StatusBadRequest, err)
		return
	}

	tokenPair, err := h.Service.Login(r.Context(), input.Email, input.Password)
	if err != nil {
		responses.ErrorJSON(w, http.StatusUnauthorized, err)
		return
	}

	responses.JSON(w, http.StatusOK, map[string]string{
		"access_token":  tokenPair.AccessToken,
		"refresh_token": tokenPair.RefreshToken,
	})
}

func (h *AuthHandler) Signup(w http.ResponseWriter, r *http.Request) {
	var input struct {
		TenantName string `json:"tenant_name"`
		Region     string `json:"region"`
		Email      string `json:"email"`
		Password   string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		responses.ErrorJSON(w, http.StatusBadRequest, err)
		return
	}

	tokenPair, user, err := h.Service.Signup(r.Context(), input.TenantName, input.Region, input.Email, input.Password)
	if err != nil {
		responses.ErrorJSON(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusCreated, map[string]interface{}{
		"access_token":  tokenPair.AccessToken,
		"refresh_token": tokenPair.RefreshToken,
		"user":          user,
	})
}

// CreateUser handles creating a user within a specific tenant (Admin only)
func (h *AuthHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "id")
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		responses.ErrorJSON(w, http.StatusBadRequest, err)
		return
	}

	// Validate role
	role := auth.Role(input.Role)
	if role != auth.RoleTenantAdmin && role != auth.RoleViewer {
		responses.ErrorJSON(w, http.StatusBadRequest, errors.New("Invalid role"))
		return
	}

	user, err := h.Service.CreateUserForTenant(r.Context(), tenantID, input.Email, input.Password, role)
	if err != nil {
		responses.ErrorJSON(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusCreated, user)
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string  `json:"email"`
		Password string  `json:"password"`
		Role     string  `json:"role"`
		TenantID *string `json:"tenant_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		responses.ErrorJSON(w, http.StatusBadRequest, err)
		return
	}

	user, err := h.Service.Register(r.Context(), input.Email, input.Password, auth.Role(input.Role), input.TenantID)
	if err != nil {
		responses.ErrorJSON(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusCreated, user)
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var input struct {
		RefreshToken string `json:"refresh_token"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		responses.ErrorJSON(w, http.StatusBadRequest, err)
		return
	}

	newAccessToken, err := h.Service.Refresh(r.Context(), input.RefreshToken)
	if err != nil {
		responses.ErrorJSON(w, http.StatusUnauthorized, err)
		return
	}

	responses.JSON(w, http.StatusOK, map[string]string{
		"access_token": newAccessToken,
	})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	// For v1, simple 200 OK.
	responses.JSON(w, http.StatusOK, map[string]string{"message": "success"})
}
