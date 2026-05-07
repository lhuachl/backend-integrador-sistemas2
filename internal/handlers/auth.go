package handlers

import (
	"net/http"

	"rest-api/internal/services"
	"rest-api/pkg/models"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	svc *services.AuthService
}

func NewAuthHandler(svc *services.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

// @Summary Register new user
// @Description Creates a new user account and sends confirmation email
// @Tags auth
// @Accept json
// @Produce json
// @Param body body models.SignupRequest true "Registration data"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Router /auth/signup [post]
func (h *AuthHandler) Signup(c *gin.Context) {
	var req models.SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.Signup(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Check your email to confirm your account"})
}

// @Summary Confirm email
// @Description Confirms user email with the provided token
// @Tags auth
// @Produce json
// @Param token query string true "Confirmation token"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Router /auth/confirm [get]
func (h *AuthHandler) Confirm(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "token required"})
		return
	}

	if err := h.svc.Confirm(c.Request.Context(), token); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Email confirmed successfully"})
}

// @Summary User login
// @Description Authenticates user and returns Supabase JWT
// @Tags auth
// @Accept json
// @Produce json
// @Param body body models.LoginRequest true "Credentials"
// @Success 200 {object} models.AuthResponse
// @Failure 401 {object} map[string]string
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.svc.Login(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// @Summary Get current user profile
// @Description Returns the profile of the currently authenticated user based on JWT
// @Tags auth
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.User
// @Failure 401 {object} map[string]string
// @Router /auth/me [get]
func (h *AuthHandler) Me(c *gin.Context) {
	userID, err := h.svc.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := h.svc.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}