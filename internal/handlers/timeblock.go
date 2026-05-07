package handlers

import (
	"net/http"
	"time"

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

// @Summary List time blocks
// @Description Returns user's time blocks, optionally filtered by date
// @Tags timeblocks
// @Produce json
// @Security BearerAuth
// @Param date query string false "Filter by date (YYYY-MM-DD)"
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

// @Summary Create time block
// @Description Creates a new time block for the user
// @Tags timeblocks
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body models.CreateTimeBlockRequest true "Time block data"
// @Success 201 {object} models.TimeBlock
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
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

// @Summary Update time block
// @Description Updates an existing time block
// @Tags timeblocks
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Time block ID"
// @Param body body models.UpdateTimeBlockRequest true "Data to update"
// @Success 200 {object} models.TimeBlock
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /timeblocks/{id} [put]
func (h *TimeBlockHandler) Update(c *gin.Context) {
	userIDStr := middleware.GetUserID(c)
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	id := c.Param("id")
	blockID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	existingBlock, err := h.svc.GetByID(c.Request.Context(), blockID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "timeblock not found"})
		return
	}

	if existingBlock.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	var req models.UpdateTimeBlockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	block, err := h.svc.Update(c.Request.Context(), blockID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, block)
}

// @Summary Delete time block
// @Description Deletes a time block by ID
// @Tags timeblocks
// @Produce json
// @Security BearerAuth
// @Param id path string true "Time block ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /timeblocks/{id} [delete]
func (h *TimeBlockHandler) Delete(c *gin.Context) {
	userIDStr := middleware.GetUserID(c)
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	id := c.Param("id")
	blockID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	existingBlock, err := h.svc.GetByID(c.Request.Context(), blockID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "timeblock not found"})
		return
	}

	if existingBlock.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	if err := h.svc.Delete(c.Request.Context(), blockID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "timeblock deleted"})
}

// @Summary Start time block
// @Description Marks a time block as active (in progress)
// @Tags timeblocks
// @Produce json
// @Security BearerAuth
// @Param id path string true "Time block ID"
// @Success 200 {object} models.TimeBlock
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /timeblocks/{id}/start [post]
func (h *TimeBlockHandler) StartBlock(c *gin.Context) {
	userIDStr := middleware.GetUserID(c)
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	id := c.Param("id")
	blockID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	block, err := h.svc.GetByID(c.Request.Context(), blockID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "timeblock not found"})
		return
	}

	if block.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	updated, err := h.svc.StartBlock(c.Request.Context(), blockID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updated)
}

// @Summary Complete time block
// @Description Marks a time block as completed
// @Tags timeblocks
// @Produce json
// @Security BearerAuth
// @Param id path string true "Time block ID"
// @Success 200 {object} models.TimeBlock
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /timeblocks/{id}/complete [post]
func (h *TimeBlockHandler) CompleteBlock(c *gin.Context) {
	userIDStr := middleware.GetUserID(c)
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	id := c.Param("id")
	blockID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	block, err := h.svc.GetByID(c.Request.Context(), blockID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "timeblock not found"})
		return
	}

	if block.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	completed, err := h.svc.CompleteBlock(c.Request.Context(), blockID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, completed)
}

// @Summary Get today's time blocks
// @Description Returns today's time blocks for the authenticated user. Includes completed blocks with time metrics.
// @Tags timeblocks
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]string
// @Router /timeblocks/today [get]
func (h *TimeBlockHandler) GetToday(c *gin.Context) {
	userIDStr := middleware.GetUserID(c)
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	today := time.Now().Format("2006-01-02")

	blocks, err := h.svc.GetByUserDate(c.Request.Context(), userID, today)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"date": today, "timeblocks": blocks})
}