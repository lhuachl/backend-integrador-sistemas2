package handler

import (
	"flowstate/api/internal/middleware"
	"flowstate/api/internal/model"
	"flowstate/api/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type UserHandler struct {
	svc      *service.UserService
	validate *validator.Validate
}

func NewUserHandler(svc *service.UserService) *UserHandler {
	return &UserHandler{svc: svc, validate: validator.New()}
}

func (h *UserHandler) Get(c *gin.Context) {
	user, err := h.svc.GetByID(c.Request.Context(), c.Param("id"))
	if err == model.ErrNotFound {
		notFound(c)
		return
	}
	if err != nil {
		internalError(c)
		return
	}
	ok(c, user)
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)
	var req model.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, "invalid body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		badRequest(c, "validation failed")
		return
	}
	user, err := h.svc.UpdateProfile(c.Request.Context(), userID, req)
	if err != nil {
		internalError(c)
		return
	}
	ok(c, user)
}
