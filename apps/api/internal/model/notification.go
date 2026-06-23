package model

import "time"

type Notification struct {
	ID        string    `json:"id"`
	UserID    string    `json:"-"`
	Type      string    `json:"type"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	Read      bool      `json:"read"`
	CreatedAt time.Time `json:"created_at"`
}

type MarkNotificationsReadRequest struct {
	IDs []string `json:"ids"`
}
