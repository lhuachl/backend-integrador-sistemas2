package model

import "time"

type Task struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Status    string    `json:"status"`
	UserID    string    `json:"user_id"`
	GoalID    *string   `json:"goal_id,omitempty"`
	DueDate   *string   `json:"due_date,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateTaskRequest struct {
	Title   string  `json:"title" validate:"required,min=1,max=200"`
	Status  string  `json:"status" validate:"omitempty,oneof=todo in_progress done"`
	GoalID  *string `json:"goal_id,omitempty" validate:"omitempty,uuid"`
	DueDate *string `json:"due_date,omitempty"`
}

type UpdateTaskRequest struct {
	Title   *string `json:"title,omitempty" validate:"omitempty,min=1,max=200"`
	Status  *string `json:"status,omitempty" validate:"omitempty,oneof=todo in_progress done"`
	GoalID  *string `json:"goal_id,omitempty" validate:"omitempty,uuid"`
	DueDate *string `json:"due_date,omitempty"`
}
