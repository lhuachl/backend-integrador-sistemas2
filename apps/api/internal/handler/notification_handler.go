package handler

import (
	"flowstate/api/internal/middleware"
	"flowstate/api/internal/model"
	"flowstate/api/internal/service"

	"github.com/gin-gonic/gin"
)

type NotificationHandler struct {
	svc *service.NotificationService
}

func NewNotificationHandler(svc *service.NotificationService) *NotificationHandler {
	return &NotificationHandler{svc: svc}
}

func (h *NotificationHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)
	notifs, err := h.svc.ListByUser(c.Request.Context(), userID)
	if err != nil {
		internalError(c)
		return
	}
	ok(c, notifs)
}

func (h *NotificationHandler) MarkRead(c *gin.Context) {
	userID := middleware.GetUserID(c)
	var req model.MarkNotificationsReadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, "invalid body")
		return
	}
	var err error
	if len(req.IDs) > 0 {
		err = h.svc.MarkReadByIDs(c.Request.Context(), userID, req.IDs)
	} else {
		err = h.svc.MarkAllRead(c.Request.Context(), userID)
	}
	if err != nil {
		internalError(c)
		return
	}
	noContent(c)
}
