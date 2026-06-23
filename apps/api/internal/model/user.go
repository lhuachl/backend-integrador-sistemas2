package model

import "time"

type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	Name         string    `json:"name"`
	Handle       *string   `json:"handle,omitempty"`
	AvatarURL    *string   `json:"avatar_url,omitempty"`
	Role         string    `json:"role"`
	PasswordHash *string   `json:"-"`
	Verified     bool      `json:"verified"`
	CreatedAt    time.Time `json:"created_at"`
}

type UpdateProfileRequest struct {
	Name   *string `json:"name,omitempty" validate:"omitempty,min=1,max=100"`
	Handle *string `json:"handle,omitempty" validate:"omitempty,min=3,max=30"`
}
