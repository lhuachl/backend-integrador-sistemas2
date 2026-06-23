package handler

import (
	"flowstate/api/internal/middleware"
	"flowstate/api/internal/model"
	"flowstate/api/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"go.uber.org/zap"
)

type TaskHandler struct {
	svc      *service.TaskService
	validate *validator.Validate
	logger   *zap.Logger
}

func NewTaskHandler(svc *service.TaskService, logger *zap.Logger) *TaskHandler {
	return &TaskHandler{svc: svc, validate: validator.New(), logger: logger}
}

func (h *TaskHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)
	goalID := paramPtr(c.Query("goal_id"))
	status := paramPtr(c.Query("status"))
	tasks, err := h.svc.List(c.Request.Context(), userID, goalID, status)
	if err != nil {
		internalError(c)
		return
	}
	ok(c, tasks)
}

func (h *TaskHandler) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)
	var req model.CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, "invalid body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		badRequest(c, "validation failed")
		return
	}
	task, err := h.svc.Create(c.Request.Context(), userID, req)
	if err != nil {
		h.logger.Error("create task failed", zap.Error(err), zap.String("request_id", middleware.GetRequestID(c)))
		internalError(c)
		return
	}
	created(c, task)
}

func (h *TaskHandler) Update(c *gin.Context) {
	userID := middleware.GetUserID(c)
	var req model.UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, "invalid body")
		return
	}
	task, err := h.svc.Update(c.Request.Context(), userID, c.Param("id"), req)
	if err == model.ErrNotFound {
		notFound(c)
		return
	}
	if err == model.ErrForbidden {
		forbidden(c)
		return
	}
	if err != nil {
		internalError(c)
		return
	}
	ok(c, task)
}

func (h *TaskHandler) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)
	err := h.svc.Delete(c.Request.Context(), userID, c.Param("id"))
	if err == model.ErrNotFound {
		notFound(c)
		return
	}
	if err == model.ErrForbidden {
		forbidden(c)
		return
	}
	if err != nil {
		internalError(c)
		return
	}
	noContent(c)
}
