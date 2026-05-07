package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID             uuid.UUID `json:"id"`
	Email          string    `json:"email"`
	Name           string    `json:"name"`
	SupabaseID     *string   `json:"supabase_id"`
	EmailConfirmed bool      `json:"email_confirmed"`
	PasswordHash   string    `json:"-"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type Task struct {
	ID              uuid.UUID `json:"id"`
	UserID          uuid.UUID `json:"user_id"`
	Title           string    `json:"title"`
	Description     *string   `json:"description"`
	Status          string    `json:"status"`
	Priority        string    `json:"priority"`
	EstimatedMinutes *int     `json:"estimated_minutes"`
	ColumnName      string    `json:"column_name"`
	Position        int       `json:"position"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type Note struct {
	ID         uuid.UUID `json:"id"`
	TaskID     uuid.UUID `json:"task_id"`
	ContentJSON string    `json:"content_json"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type TimeBlock struct {
	ID        uuid.UUID  `json:"id"`
	UserID    uuid.UUID   `json:"user_id"`
	TaskID    *uuid.UUID  `json:"task_id"`
	Date      string      `json:"date"`
	StartTime string      `json:"start_time"`
	EndTime   string      `json:"end_time"`
	Completed bool        `json:"completed"`
	CreatedAt time.Time   `json:"created_at"`
}

type AISession struct {
	ID           uuid.UUID `json:"id"`
	UserID       uuid.UUID `json:"user_id"`
	Command      string    `json:"command"`
	InputSummary *string   `json:"input_summary"`
	OutputSummary *string  `json:"output_summary"`
	CreatedAt    time.Time `json:"created_at"`
}

type ConfirmationToken struct {
	ID        uuid.UUID `json:"id"`
	Email     string    `json:"email"`
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
	Used      bool      `json:"used"`
	CreatedAt time.Time `json:"created_at"`
}