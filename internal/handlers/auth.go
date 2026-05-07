package handlers

import (
	"net/http"

	"rest-api/internal/services"
	"rest-api/pkg/models"

	"github.com/gin-gonic/gin"
)

// @title FLOWSTATE API
// @version 1.0
// @description API para gestión de tareas con Kanban + Timeboxing + IA
// @host localhost:8080
// @BasePath /api
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization

type AuthHandler struct {
	svc *services.AuthService
}

func NewAuthHandler(svc *services.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

// @Summary Registro de usuario
// @Description Envía email de confirmación para registrar nuevo usuario
// @Tags auth
// @Accept json
// @Produce json
// @Param body body models.SignupRequest true "Datos de registro"
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

// @Summary Confirmar email
// @Description Confirma el email del usuario con el token recibido
// @Tags auth
// @Produce json
// @Param token query string true "Token de confirmación"
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

// @Summary Login de usuario
// @Description Inicia sesión y devuelve JWT de Supabase
// @Tags auth
// @Accept json
// @Produce json
// @Param body body models.LoginRequest true "Credenciales"
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