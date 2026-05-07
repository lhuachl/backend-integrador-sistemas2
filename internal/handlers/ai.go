package handlers

import (
	"net/http"

	"rest-api/internal/middleware"
	"rest-api/internal/services"
	"rest-api/pkg/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AIHandler struct {
	svc *services.AIService
}

func NewAIHandler(svc *services.AIService) *AIHandler {
	return &AIHandler{svc: svc}
}

func getUserID(c *gin.Context) (uuid.UUID, error) {
	userIDStr, exists := c.Get(middleware.UserIDKey)
	if !exists {
		return uuid.Nil, nil
	}
	userID, ok := userIDStr.(uuid.UUID)
	if !ok {
		return uuid.Nil, nil
	}
	return userID, nil
}

// @Summary AI productivity assistant
// @Description Executes AI commands for workflow automation:
// @Description - /descomponer: Break a task into subtasks
// @Description - /estimar: Estimate time for a task
// @Description - /planificar: Create a daily plan
// @Description Maintains conversation context (last 5 sessions) for personalized responses.
// @Description Auto-compacts context when 6+ sessions accumulated.
// @Tags ai
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body models.AICommandRequest true "AI command and input"
// @Success 200 {object} models.AICommandResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /ai/command [post]
func (h *AIHandler) Command(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req models.AICommandRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.svc.Command(c.Request.Context(), userID, req.Command, req.Input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// @Summary Listar sesiones de IA
// @Description Obtiene el historial de sesiones de IA del usuario
// @Tags ai
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.AISession
// @Failure 500 {object} map[string]string
// @Router /ai/sessions [get]
func (h *AIHandler) ListSessions(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	sessions, err := h.svc.GetSessions(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, sessions)
}

// @Summary Obtener sesión de IA
// @Description Obtiene una sesión específica por ID
// @Tags ai
// @Produce json
// @Security BearerAuth
// @Param id path string true "Session ID"
// @Success 200 {object} models.AISession
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /ai/sessions/{id} [get]
func (h *AIHandler) GetSession(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	sessionIDStr := c.Param("id")
	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	session, err := h.svc.GetSession(c.Request.Context(), userID, sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	c.JSON(http.StatusOK, session)
}