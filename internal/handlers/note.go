package handlers

import (
	"net/http"

	"rest-api/internal/services"
	"rest-api/pkg/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type NoteHandler struct {
	svc *services.NoteService
}

func NewNoteHandler(svc *services.NoteService) *NoteHandler {
	return &NoteHandler{svc: svc}
}

// @Summary Obtener nota
// @Description Obtiene la nota asociada a una tarea
// @Tags notes
// @Produce json
// @Security BearerAuth
// @Param id path string true "ID de la tarea"
// @Success 200 {object} models.Note
// @Failure 404 {object} map[string]string
// @Router /tasks/{id}/notes [get]
func (h *NoteHandler) Get(c *gin.Context) {
	taskID := c.Param("id")
	uid, err := uuid.Parse(taskID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task id"})
		return
	}

	note, err := h.svc.GetByTaskID(c.Request.Context(), uid)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "note not found"})
		return
	}

	c.JSON(http.StatusOK, note)
}

// @Summary Guardar nota
// @Description Guarda o actualiza el contenido de la nota de una tarea
// @Tags notes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "ID de la tarea"
// @Param body body models.UpdateNoteRequest true "Contenido JSON de la nota"
// @Success 200 {object} models.Note
// @Failure 400 {object} map[string]string
// @Router /tasks/{id}/notes [put]
func (h *NoteHandler) Save(c *gin.Context) {
	taskID := c.Param("id")
	uid, err := uuid.Parse(taskID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task id"})
		return
	}

	var req models.UpdateNoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	note, err := h.svc.Update(c.Request.Context(), uid, req.ContentJSON)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, note)
}