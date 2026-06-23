package model

import "time"

type Goal struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description *string   `json:"description,omitempty"`
	UserID      string    `json:"user_id"`
	TeamID      *string   `json:"team_id,omitempty"`
	Current     float64   `json:"current"`
	Target      float64   `json:"target"`
	Unit        string    `json:"unit"`
	Deadline    *string   `json:"deadline,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateGoalRequest struct {
	Title       string  `json:"title" validate:"required,min=1,max=200"`
	Description *string `json:"description,omitempty"`
	TeamID      *string `json:"team_id,omitempty" validate:"omitempty,uuid"`
	Current     float64 `json:"current"`
	Target      float64 `json:"target" validate:"required,gt=0"`
	Unit        string  `json:"unit" validate:"required"`
	Deadline    *string `json:"deadline,omitempty"`
}

type UpdateGoalRequest struct {
	Title       *string  `json:"title,omitempty" validate:"omitempty,min=1,max=200"`
	Description *string  `json:"description,omitempty"`
	Target      *float64 `json:"target,omitempty" validate:"omitempty,gt=0"`
	Unit        *string  `json:"unit,omitempty"`
	Deadline    *string  `json:"deadline,omitempty"`
}

type AddProgressRequest struct {
	Amount float64 `json:"amount" validate:"required,gt=0"`
}
