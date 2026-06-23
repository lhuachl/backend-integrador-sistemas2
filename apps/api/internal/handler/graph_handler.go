package handler

import (
	"flowstate/api/internal/middleware"
	"flowstate/api/internal/service"

	"github.com/gin-gonic/gin"
)

type GraphHandler struct {
	svc *service.GraphService
}

func NewGraphHandler(svc *service.GraphService) *GraphHandler {
	return &GraphHandler{svc: svc}
}

func (h *GraphHandler) GetGraph(c *gin.Context) {
	userID := middleware.GetUserID(c)
	teamID := paramPtr(c.Query("team_id"))
	data, err := h.svc.GetGraph(c.Request.Context(), userID, teamID)
	if err != nil {
		internalError(c)
		return
	}
	ok(c, data)
}
