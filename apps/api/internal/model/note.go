package model

import (
	"encoding/json"
	"time"
)

type Note struct {
	ID         string          `json:"id"`
	Title      string          `json:"title"`
	Content    string          `json:"content"`
	AuthorID   string          `json:"author_id"`
	TeamID     *string         `json:"team_id,omitempty"`
	Tags       json.RawMessage `json:"tags"`
	IsPublic   bool            `json:"is_public"`
	SharedWith json.RawMessage `json:"shared_with"`
	CreatedAt  time.Time       `json:"created_at"`
	UpdatedAt  time.Time       `json:"updated_at"`
}

type NoteLink struct {
	ID           string  `json:"id"`
	SourceNoteID string  `json:"source_note_id"`
	TargetNoteID *string `json:"target_note_id,omitempty"`
	TargetTitle  string  `json:"target_title"`
}

type CreateNoteRequest struct {
	Title   string   `json:"title" validate:"required,min=1,max=200"`
	Content string   `json:"content" validate:"max=100000"`
	Tags    []string `json:"tags"`
	TeamID  *string  `json:"team_id,omitempty" validate:"omitempty,uuid"`
}

type UpdateNoteRequest struct {
	Title      *string  `json:"title,omitempty" validate:"omitempty,min=1,max=200"`
	Content    *string  `json:"content,omitempty" validate:"omitempty,max=100000"`
	Tags       []string `json:"tags,omitempty"`
	IsPublic   *bool    `json:"is_public,omitempty"`
	SharedWith []string `json:"shared_with,omitempty"`
	TeamID     *string  `json:"team_id,omitempty" validate:"omitempty,uuid"`
}

type ShareNoteRequest struct {
	TeamID string `json:"team_id" validate:"required,uuid"`
}

type AddNoteLinkRequest struct {
	TargetNoteID *string `json:"target_note_id,omitempty"`
	TargetTitle  string  `json:"target_title" validate:"required,min=1"`
}
