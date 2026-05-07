package models

type CreateTaskRequest struct {
	Title           string `json:"title" binding:"required"`
	Description     string `json:"description"`
	Priority        string `json:"priority"`
	ColumnName      string `json:"column_name"`
	EstimatedMinutes int    `json:"estimated_minutes"`
}

type UpdateTaskRequest struct {
	Title           string `json:"title"`
	Description     string `json:"description"`
	Status          string `json:"status"`
	Priority        string `json:"priority"`
	ColumnName      string `json:"column_name"`
	EstimatedMinutes int    `json:"estimated_minutes"`
	Position        int    `json:"position"`
}

type UpdateTaskPositionRequest struct {
	ColumnName string `json:"column_name" binding:"required"`
	Position   int    `json:"position"`
}