package handler

import (
	"strconv"

	"flowstate/api/internal/middleware"
	"flowstate/api/internal/model"
	"flowstate/api/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"go.uber.org/zap"
)

type NoteHandler struct {
	svc      *service.NoteService
	validate *validator.Validate
	logger   *zap.Logger
}

func NewNoteHandler(svc *service.NoteService, logger *zap.Logger) *NoteHandler {
	return &NoteHandler{svc: svc, validate: validator.New(), logger: logger}
}

func (h *NoteHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)
	teamID := paramPtr(c.Query("team_id"))
	limit, offset := pagination(c)
	notes, err := h.svc.List(c.Request.Context(), userID, teamID, limit, offset)
	if err != nil {
		h.logger.Error("list notes failed", zap.Error(err), zap.String("request_id", middleware.GetRequestID(c)))
		internalError(c)
		return
	}
	ok(c, notes)
}

func (h *NoteHandler) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)
	var req model.CreateNoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, "invalid body")
		return
	}
	note, err := h.svc.Create(c.Request.Context(), userID, req)
	if err != nil {
		h.logger.Error("create note failed", zap.Error(err), zap.String("request_id", middleware.GetRequestID(c)))
		internalError(c)
		return
	}
	created(c, note)
}

func (h *NoteHandler) Get(c *gin.Context) {
	userID := middleware.GetUserID(c)
	note, err := h.svc.GetByID(c.Request.Context(), userID, c.Param("id"))
	if err == model.ErrNotFound {
		notFound(c)
		return
	}
	if err != nil {
		internalError(c)
		return
	}
	ok(c, note)
}

func (h *NoteHandler) Update(c *gin.Context) {
	userID := middleware.GetUserID(c)
	var req model.UpdateNoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, "invalid body")
		return
	}
	note, err := h.svc.Update(c.Request.Context(), userID, c.Param("id"), req)
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
	ok(c, note)
}

func (h *NoteHandler) Delete(c *gin.Context) {
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

func (h *NoteHandler) ListLinks(c *gin.Context) {
	links, err := h.svc.ListLinks(c.Request.Context(), c.Param("id"))
	if err != nil {
		internalError(c)
		return
	}
	ok(c, links)
}

func (h *NoteHandler) AddLink(c *gin.Context) {
	userID := middleware.GetUserID(c)
	var req model.AddNoteLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, "invalid body")
		return
	}
	err := h.svc.AddLink(c.Request.Context(), userID, c.Param("id"), req)
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
	created(c, nil)
}

func (h *NoteHandler) Share(c *gin.Context) {
	userID := middleware.GetUserID(c)
	var req model.ShareNoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, "invalid body")
		return
	}
	note, err := h.svc.ShareToTeam(c.Request.Context(), userID, c.Param("id"), req)
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
	ok(c, note)
}

func pagination(c *gin.Context) (int, int) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if limit < 1 {
		limit = 50
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}
	return limit, offset
}

func paramPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
