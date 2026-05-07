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