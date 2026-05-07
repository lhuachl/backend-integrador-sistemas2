package handlers

import (
	"net/http"

	"rest-api/internal/services"
	"rest-api/pkg/models"

	"github.com/gin-gonic/gin"
)

type AIHandler struct {
	svc *services.AIService
}

func NewAIHandler(svc *services.AIService) *AIHandler {
	return &AIHandler{svc: svc}
}

// @Summary Comando de IA
// @Description Envía un comando de IA (/descomponer, /estimar, /planificar)
// @Tags ai
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body models.AICommandRequest true "Comando y entrada"
// @Success 200 {object} models.AICommandResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /ai/command [post]
func (h *AIHandler) Command(c *gin.Context) {
	var req models.AICommandRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.svc.Command(c.Request.Context(), req.Command, req.Input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.AICommandResponse{
		Command: req.Command,
		Result:  result,
	})
}