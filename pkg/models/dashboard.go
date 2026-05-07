package models

import "github.com/google/uuid"

type Dashboard struct {
	TotalTasks     int `json:"total_tasks"`
	InProgress    int `json:"in_progress"`
	Completed     int `json:"completed"`
	Overdue       int `json:"overdue"`
	TotalTimeBlocks int `json:"total_timeblocks"`
	FocusMinutes   int `json:"focus_minutes"`
}

type TodayView struct {
	Date         string     `json:"date"`
	Tasks        []*Task    `json:"tasks"`
	TimeBlocks   []*TimeBlock `json:"time_blocks"`
	FocusSummary FocusSummary `json:"focus_summary"`
}

type FocusSummary struct {
	TotalMinutes  int    `json:"total_minutes"`
	CompletedMinutes int `json:"completed_minutes"`
	RemainingMinutes int `json:"remaining_minutes"`
}

type DashboardStats struct {
	TasksByStatus map[string]int `json:"tasks_by_status"`
	TasksByPriority map[string]int `json:"tasks_by_priority"`
	Columns []ColumnSummary `json:"columns"`
}

type ColumnSummary struct {
	Name      string `json:"name"`
	Count     int    `json:"count"`
	TaskIDs   []uuid.UUID `json:"task_ids"`
}