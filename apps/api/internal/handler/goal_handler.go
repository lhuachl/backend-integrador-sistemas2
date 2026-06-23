package handler

import (
	"flowstate/api/internal/middleware"
	"flowstate/api/internal/model"
	"flowstate/api/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type GoalHandler struct {
	svc      *service.GoalService
	validate *validator.Validate
}

func NewGoalHandler(svc *service.GoalService) *GoalHandler {
	return &GoalHandler{svc: svc, validate: validator.New()}
}

func (h *GoalHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)
	goals, err := h.svc.ListByUser(c.Request.Context(), userID)
	if err != nil {
		internalError(c)
		return
	}
	ok(c, goals)
}

func (h *GoalHandler) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)
	var req model.CreateGoalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, "invalid body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		badRequest(c, "validation failed")
		return
	}
	goal, err := h.svc.Create(c.Request.Context(), userID, req)
	if err != nil {
		internalError(c)
		return
	}
	created(c, goal)
}

func (h *GoalHandler) Get(c *gin.Context) {
	userID := middleware.GetUserID(c)
	goal, err := h.svc.GetByID(c.Request.Context(), userID, c.Param("id"))
	if err == model.ErrNotFound {
		notFound(c)
		return
	}
	if err != nil {
		internalError(c)
		return
	}
	ok(c, goal)
}

func (h *GoalHandler) Update(c *gin.Context) {
	userID := middleware.GetUserID(c)
	var req model.UpdateGoalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, "invalid body")
		return
	}
	goal, err := h.svc.Update(c.Request.Context(), userID, c.Param("id"), req)
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
	ok(c, goal)
}

func (h *GoalHandler) Delete(c *gin.Context) {
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

func (h *GoalHandler) AddProgress(c *gin.Context) {
	userID := middleware.GetUserID(c)
	var req model.AddProgressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, "invalid body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		badRequest(c, "validation failed")
		return
	}
	goal, err := h.svc.AddProgress(c.Request.Context(), userID, c.Param("id"), req)
	if err == model.ErrNotFound {
		notFound(c)
		return
	}
	if err == model.ErrForbidden {
		forbidden(c)
		return
	}
	if err == model.ErrValidation {
		badRequest(c, "progress exceeds target")
		return
	}
	if err != nil {
		internalError(c)
		return
	}
	ok(c, goal)
}
