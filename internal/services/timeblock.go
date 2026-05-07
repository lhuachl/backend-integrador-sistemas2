package services

import (
	"context"

	"rest-api/internal/repositories"
	"rest-api/pkg/models"

	"github.com/google/uuid"
)

type TimeBlockService struct {
	repo *repositories.TimeBlockRepository
}

func NewTimeBlockService(repo *repositories.TimeBlockRepository) *TimeBlockService {
	return &TimeBlockService{repo: repo}
}

func (s *TimeBlockService) GetByUserDate(ctx context.Context, userID uuid.UUID, date string) ([]*models.TimeBlock, error) {
	return s.repo.GetByUserDate(ctx, userID, date)
}

func (s *TimeBlockService) GetByUser(ctx context.Context, userID uuid.UUID) ([]*models.TimeBlock, error) {
	return s.repo.GetByUser(ctx, userID)
}

func (s *TimeBlockService) GetByID(ctx context.Context, id uuid.UUID) (*models.TimeBlock, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *TimeBlockService) Create(ctx context.Context, userID uuid.UUID, req *models.CreateTimeBlockRequest) (*models.TimeBlock, error) {
	var taskID *uuid.UUID
	if req.TaskID != "" {
		t, err := uuid.Parse(req.TaskID)
		if err == nil {
			taskID = &t
		}
	}
	return s.repo.Create(ctx, userID, taskID, req.Date, req.StartTime, req.EndTime)
}

func (s *TimeBlockService) Update(ctx context.Context, id uuid.UUID, req *models.UpdateTimeBlockRequest) (*models.TimeBlock, error) {
	var taskID *uuid.UUID
	if req.TaskID != "" {
		t, err := uuid.Parse(req.TaskID)
		if err == nil {
			taskID = &t
		}
	}
	return s.repo.Update(ctx, id, taskID, req.StartTime, req.EndTime, req.Completed)
}

func (s *TimeBlockService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *TimeBlockService) StartBlock(ctx context.Context, id uuid.UUID) (*models.TimeBlock, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *TimeBlockService) CompleteBlock(ctx context.Context, id uuid.UUID) (*models.TimeBlock, error) {
	err := s.repo.MarkCompleted(ctx, id)
	if err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}