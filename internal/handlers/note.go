package handlers

import (
	"net/http"

	"rest-api/internal/middleware"
	"rest-api/internal/services"
	"rest-api/pkg/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type NoteHandler struct {
	svc       *services.NoteService
	taskSvc   *services.TaskService
}

func NewNoteHandler(svc *services.NoteService, taskSvc *services.TaskService) *NoteHandler {
	return &NoteHandler{svc: svc, taskSvc: taskSvc}
}

func (h *NoteHandler) getUserID(c *gin.Context) (uuid.UUID, error) {
	userIDStr := middleware.GetUserID(c)
	if userIDStr == "" {
		return uuid.Nil, nil
	}
	return uuid.Parse(userIDStr)
}

func (h *NoteHandler) checkTaskOwnership(c *gin.Context, taskID uuid.UUID, userID uuid.UUID) bool {
	task, err := h.taskSvc.GetByID(c.Request.Context(), taskID)
	if err != nil || task.UserID != userID {
		return false
	}
	return true
}

// @Summary Get task note
// @Description Returns the note associated with a task (singleton per task). Returns empty note if none exists.
// @Tags notes
// @Produce json
// @Security BearerAuth
// @Param id path string true "Task ID"
// @Success 200 {object} models.Note
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /tasks/{id}/note [get]
func (h *NoteHandler) Get(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil || userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	taskID := c.Param("id")
	taskUID, err := uuid.Parse(taskID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task id"})
		return
	}

	if !h.checkTaskOwnership(c, taskUID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	note, err := h.svc.GetByTaskID(c.Request.Context(), taskUID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "note not found"})
		return
	}

	c.JSON(http.StatusOK, note)
}

// @Summary Save task note
// @Description Creates or replaces the note for a task (idempotent PUT)
// @Tags notes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Task ID"
// @Param body body models.UpdateNoteRequest true "Note content JSON"
// @Success 200 {object} models.Note
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /tasks/{id}/note [put]
func (h *NoteHandler) Save(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil || userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	taskID := c.Param("id")
	taskUID, err := uuid.Parse(taskID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task id"})
		return
	}

	if !h.checkTaskOwnership(c, taskUID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	var req models.UpdateNoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	note, err := h.svc.Update(c.Request.Context(), taskUID, req.ContentJSON)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, note)
}