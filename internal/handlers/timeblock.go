package handlers

import (
	"net/http"

	"rest-api/internal/middleware"
	"rest-api/internal/services"
	"rest-api/pkg/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type TimeBlockHandler struct {
	svc *services.TimeBlockService
}

func NewTimeBlockHandler(svc *services.TimeBlockService) *TimeBlockHandler {
	return &TimeBlockHandler{svc: svc}
}

// @Summary Listar bloques de tiempo
// @Description Obtiene los bloques de tiempo del usuario, opcionalmente filtrados por fecha
// @Tags timeblocks
// @Produce json
// @Security BearerAuth
// @Param date query string false "Filtrar por fecha (YYYY-MM-DD)"
// @Success 200 {object} map[string][]models.TimeBlock
// @Failure 401 {object} map[string]string
// @Router /timeblocks [get]
func (h *TimeBlockHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	date := c.Query("date")
	if date != "" {
		blocks, err := h.svc.GetByUserDate(c.Request.Context(), uid, date)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"timeblocks": blocks})
		return
	}

	blocks, err := h.svc.GetByUser(c.Request.Context(), uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"timeblocks": blocks})
}

// @Summary Crear bloque de tiempo
// @Description Crea un nuevo bloque de tiempo para el usuario
// @Tags timeblocks
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body models.CreateTimeBlockRequest true "Datos del bloque"
// @Success 201 {object} models.TimeBlock
// @Failure 400 {object} map[string]string
// @Router /timeblocks [post]
func (h *TimeBlockHandler) Create(c *gin.Context) {
	var req models.CreateTimeBlockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	block, err := h.svc.Create(c.Request.Context(), uid, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, block)
}

// @Summary Actualizar bloque de tiempo
// @Description Actualiza un bloque de tiempo existente
// @Tags timeblocks
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "ID del bloque"
// @Param body body models.UpdateTimeBlockRequest true "Datos a actualizar"
// @Success 200 {object} models.TimeBlock
// @Failure 400 {object} map[string]string
// @Router /timeblocks/{id} [put]
func (h *TimeBlockHandler) Update(c *gin.Context) {
	id := c.Param("id")
	uid, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req models.UpdateTimeBlockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	block, err := h.svc.Update(c.Request.Context(), uid, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, block)
}

// @Summary Eliminar bloque de tiempo
// @Description Elimina un bloque de tiempo por ID
// @Tags timeblocks
// @Produce json
// @Security BearerAuth
// @Param id path string true "ID del bloque"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Router /timeblocks/{id} [delete]
func (h *TimeBlockHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	uid, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.svc.Delete(c.Request.Context(), uid); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "timeblock deleted"})
}