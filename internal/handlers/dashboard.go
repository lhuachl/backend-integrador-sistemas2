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

type DashboardHandler struct {
	taskSvc       *services.TaskService
	timeblockSvc  *services.TimeBlockService
}

func NewDashboardHandler(taskSvc *services.TaskService, timeblockSvc *services.TimeBlockService) *DashboardHandler {
	return &DashboardHandler{taskSvc: taskSvc, timeblockSvc: timeblockSvc}
}

// @Summary Kanban board overview
// @Description Returns aggregated statistics: tasks grouped by status and priority, column summaries with task counts. Use to power dashboard visualizations and productivity analytics.
// @Tags dashboard
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.DashboardStats
// @Failure 401 {object} map[string]string
// @Router /dashboard [get]
func (h *DashboardHandler) GetDashboard(c *gin.Context) {
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

	tasks, err := h.taskSvc.GetByUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	timeblocks, err := h.timeblockSvc.GetByUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	stats := h.buildDashboardStats(tasks, timeblocks)

	c.JSON(http.StatusOK, stats)
}

// @Summary Daily productivity snapshot
// @Description Returns today's tasks and time blocks for planning. Provides focus time metrics comparing planned vs completed minutes. Use this endpoint to power the daily planning view.
// @Tags planning
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.TodayView
// @Failure 401 {object} map[string]string
// @Router /today [get]
func (h *DashboardHandler) GetToday(c *gin.Context) {
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

	tasks, err := h.taskSvc.GetByColumn(c.Request.Context(), userID, "today")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	timeblocks, err := h.timeblockSvc.GetByUserDate(c.Request.Context(), userID, today)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var totalMinutes, completedMinutes int
	for _, tb := range timeblocks {
		start := parseTime(tb.StartTime)
		end := parseTime(tb.EndTime)
		minutes := int(end.Sub(start).Minutes())
		totalMinutes += minutes
		if tb.Completed {
			completedMinutes += minutes
		}
	}

	view := models.TodayView{
		Date:         today,
		Tasks:        tasks,
		TimeBlocks:   timeblocks,
		FocusSummary: models.FocusSummary{
			TotalMinutes:      totalMinutes,
			CompletedMinutes:  completedMinutes,
			RemainingMinutes:  totalMinutes - completedMinutes,
		},
	}

	c.JSON(http.StatusOK, view)
}

// @Summary Focus time metrics for today
// @Description Returns focus time analytics: total planned minutes, completed minutes, and remaining minutes. Use to display daily focus progress and productivity metrics.
// @Tags planning
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.FocusSummary
// @Failure 401 {object} map[string]string
// @Router /focus [get]
func (h *DashboardHandler) GetFocus(c *gin.Context) {
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

	timeblocks, err := h.timeblockSvc.GetByUserDate(c.Request.Context(), userID, today)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var totalMinutes, completedMinutes int
	for _, tb := range timeblocks {
		start := parseTime(tb.StartTime)
		end := parseTime(tb.EndTime)
		minutes := int(end.Sub(start).Minutes())
		totalMinutes += minutes
		if tb.Completed {
			completedMinutes += minutes
		}
	}

	c.JSON(http.StatusOK, models.FocusSummary{
		TotalMinutes:      totalMinutes,
		CompletedMinutes: completedMinutes,
		RemainingMinutes:  totalMinutes - completedMinutes,
	})
}

func (h *DashboardHandler) buildDashboardStats(tasks []*models.Task, timeblocks []*models.TimeBlock) *models.DashboardStats {
	tasksByStatus := make(map[string]int)
	tasksByPriority := make(map[string]int)
	columns := make(map[string][]uuid.UUID)
	columnCounts := make(map[string]int)

	for _, task := range tasks {
		tasksByStatus[task.Status]++
		tasksByPriority[task.Priority]++
		columns[task.ColumnName] = append(columns[task.ColumnName], task.ID)
		columnCounts[task.ColumnName]++
	}

	var columnSummaries []models.ColumnSummary
	columnOrder := []string{"backlog", "this_week", "today", "in_progress", "done"}
	columnLabels := map[string]string{
		"backlog":      "Backlog",
		"this_week":   "This Week",
		"today":        "Today",
		"in_progress": "In Progress",
		"done":        "Done",
	}

	for _, col := range columnOrder {
		if count, ok := columnCounts[col]; ok {
			columnSummaries = append(columnSummaries, models.ColumnSummary{
				Name:    columnLabels[col],
				Count:   count,
				TaskIDs: columns[col],
			})
		}
	}

	return &models.DashboardStats{
		TasksByStatus:   tasksByStatus,
		TasksByPriority: tasksByPriority,
		Columns:        columnSummaries,
	}
}

func parseTime(t string) time.Time {
	parsed, _ := time.Parse("15:04:05", t)
	if parsed.IsZero() {
		parsed, _ = time.Parse("15:04", t)
	}
	return parsed
}