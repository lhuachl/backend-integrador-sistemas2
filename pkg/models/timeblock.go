package models

type CreateTimeBlockRequest struct {
	TaskID    string `json:"task_id"`
	Date      string `json:"date" binding:"required"`
	StartTime string `json:"start_time" binding:"required"`
	EndTime   string `json:"end_time" binding:"required"`
}

type UpdateTimeBlockRequest struct {
	TaskID    string `json:"task_id"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	Completed bool   `json:"completed"`
}