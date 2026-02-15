package handlers

import (
	"encoding/json"
	"fortistack/internal/api/responses"
	"fortistack/internal/auth"
	"net/http"
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
