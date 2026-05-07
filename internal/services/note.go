package services

import (
	"context"

	"rest-api/internal/repositories"
	"rest-api/pkg/models"

	"github.com/google/uuid"
)

type NoteService struct {
	repo *repositories.NoteRepository
}

func NewNoteService(repo *repositories.NoteRepository) *NoteService {
	return &NoteService{repo: repo}
}

func (s *NoteService) GetByTaskID(ctx context.Context, taskID uuid.UUID) (*models.Note, error) {
	return s.repo.GetByTaskID(ctx, taskID)
}

func (s *NoteService) Create(ctx context.Context, taskID uuid.UUID, contentJSON string) (*models.Note, error) {
	return s.repo.Create(ctx, taskID, contentJSON)
}

func (s *NoteService) Update(ctx context.Context, taskID uuid.UUID, contentJSON string) (*models.Note, error) {
	return s.repo.Update(ctx, taskID, contentJSON)
}