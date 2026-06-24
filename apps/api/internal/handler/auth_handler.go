package handler

import (
	"flowstate/api/internal/middleware"
	"flowstate/api/internal/model"
	"flowstate/api/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"go.uber.org/zap"
)

type AuthHandler struct {
	svc      *service.AuthService
	userSvc  *service.UserService
	validate *validator.Validate
	logger   *zap.Logger
}

func NewAuthHandler(svc *service.AuthService, userSvc *service.UserService, logger *zap.Logger) *AuthHandler {
	return &AuthHandler{svc: svc, userSvc: userSvc, validate: validator.New(), logger: logger}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req model.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, "invalid body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		badRequest(c, "validation failed")
		return
	}
	resp, err := h.svc.Register(c.Request.Context(), req)
	if err == model.ErrConflict {
		conflict(c)
		return
	}
	if err != nil {
		h.logger.Error("register failed", zap.Error(err), zap.String("request_id", middleware.GetRequestID(c)))
		internalError(c)
		return
	}
	created(c, resp)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req model.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, "invalid body")
		return
	}
	resp, err := h.svc.Login(c.Request.Context(), req)
	if err == model.ErrUnauthorized {
		unauthorized(c)
		return
	}
	if err != nil {
		internalError(c)
		return
	}
	if resp.RequiresVerification {
		requireVerification(c)
		return
	}
	ok(c, resp)
}

func (h *AuthHandler) GoogleAuth(c *gin.Context) {
	var req model.GoogleAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, "invalid body")
		return
	}
	resp, err := h.svc.GoogleAuth(c.Request.Context(), req)
	if err == model.ErrUnauthorized {
		unauthorized(c)
		return
	}
	if err != nil {
		h.logger.Error("google auth failed", zap.Error(err), zap.String("request_id", middleware.GetRequestID(c)))
		internalError(c)
		return
	}
	ok(c, resp)
}

func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	var req model.VerifyEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, "invalid body")
		return
	}
	userID := c.Query("user_id")
	resp, err := h.svc.VerifyEmail(c.Request.Context(), userID, req.Code)
	if err == model.ErrValidation {
		badRequest(c, "invalid code")
		return
	}
	if err == model.ErrUnauthorized {
		unauthorized(c)
		return
	}
	if err != nil {
		internalError(c)
		return
	}
	ok(c, resp)
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID := middleware.GetUserID(c)
	user, err := h.userSvc.GetByID(c.Request.Context(), userID)
	if err == model.ErrNotFound {
		unauthorized(c)
		return
	}
	if err != nil {
		internalError(c)
		return
	}
	ok(c, user)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	_ = h.svc.Logout(c.Request.Context())
	noContent(c)
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req model.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, "invalid body")
		return
	}
	tokens, err := h.svc.Refresh(c.Request.Context(), req.RefreshToken)
	if err == model.ErrUnauthorized {
		unauthorized(c)
		return
	}
	if err != nil {
		internalError(c)
		return
	}
	ok(c, tokens)
}
