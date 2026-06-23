package model

import "time"

type Team struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Slug        string    `json:"slug"`
	Description *string   `json:"description,omitempty"`
	OwnerID     string    `json:"owner_id"`
	CreatedAt   time.Time `json:"created_at"`
}

type TeamMember struct {
	ID       string    `json:"id"`
	UserID   string    `json:"user_id"`
	TeamID   string    `json:"team_id"`
	Role     string    `json:"role"`
	JoinedAt time.Time `json:"joined_at"`
}

type CreateTeamRequest struct {
	Name        string  `json:"name" validate:"required,min=1,max=100"`
	Slug        string  `json:"slug,omitempty" validate:"omitempty,min=1,max=50,alpha"`
	Description *string `json:"description,omitempty"`
}

type InviteMemberRequest struct {
	Email string `json:"email" validate:"required,email"`
	Role  string `json:"role" validate:"required,oneof=mentor member"`
}

type JoinTeamRequest struct {
	Token string `json:"token" validate:"required"`
}
