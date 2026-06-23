package handler

import (
	"flowstate/api/internal/middleware"
	"flowstate/api/internal/model"
	"flowstate/api/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type TeamHandler struct {
	svc      *service.TeamService
	validate *validator.Validate
}

func NewTeamHandler(svc *service.TeamService) *TeamHandler {
	return &TeamHandler{svc: svc, validate: validator.New()}
}

func (h *TeamHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)
	teams, err := h.svc.ListByUser(c.Request.Context(), userID)
	if err != nil {
		internalError(c)
		return
	}
	ok(c, teams)
}

func (h *TeamHandler) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)
	var req model.CreateTeamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, "invalid body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		badRequest(c, "validation failed")
		return
	}
	team, err := h.svc.Create(c.Request.Context(), userID, req)
	if err != nil {
		internalError(c)
		return
	}
	created(c, team)
}

func (h *TeamHandler) Get(c *gin.Context) {
	team, err := h.svc.GetByID(c.Request.Context(), c.Param("id"))
	if err == model.ErrNotFound {
		notFound(c)
		return
	}
	if err != nil {
		internalError(c)
		return
	}
	ok(c, team)
}

func (h *TeamHandler) ListMembers(c *gin.Context) {
	members, err := h.svc.ListMembers(c.Request.Context(), c.Param("id"))
	if err != nil {
		internalError(c)
		return
	}
	ok(c, members)
}

func (h *TeamHandler) InviteMember(c *gin.Context) {
	var req model.InviteMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, "invalid body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		badRequest(c, "validation failed")
		return
	}
	member, err := h.svc.AddMember(c.Request.Context(), c.Param("id"), req.Email, req.Role)
	if err == model.ErrNotFound {
		notFound(c)
		return
	}
	if err == model.ErrValidation {
		badRequest(c, "invalid role")
		return
	}
	if err != nil {
		internalError(c)
		return
	}
	created(c, member)
}

func (h *TeamHandler) Join(c *gin.Context) {
	var req model.JoinTeamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, "invalid body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		badRequest(c, "validation failed")
		return
	}
	userID := middleware.GetUserID(c)
	if userID == "" {
		unauthorized(c)
		return
	}
	member, err := h.svc.AddMember(c.Request.Context(), c.Param("id"), userID, "member")
	if err == model.ErrNotFound {
		notFound(c)
		return
	}
	if err != nil {
		internalError(c)
		return
	}
	created(c, member)
}
