package service

import (
	"context"
	"fmt"

	"flowstate/api/internal/model"
	"flowstate/api/internal/repository"
)

type GoalService struct {
	repo repository.GoalRepository
}

func NewGoalService(repo repository.GoalRepository) *GoalService {
	return &GoalService{repo: repo}
}

func (s *GoalService) Create(ctx context.Context, userID string, req model.CreateGoalRequest) (*model.Goal, error) {
	goal, err := s.repo.Create(ctx, userID, req.Title, req.Unit, req.Description, req.TeamID, req.Current, req.Target, req.Deadline)
	if err != nil {
		return nil, fmt.Errorf("create goal: %w", err)
	}
	return goal, nil
}

func (s *GoalService) GetByID(ctx context.Context, userID, id string) (*model.Goal, error) {
	goal, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, model.ErrNotFound
	}
	if goal.UserID != userID {
		return nil, model.ErrNotFound
	}
	return goal, nil
}

func (s *GoalService) ListByUser(ctx context.Context, userID string) ([]model.Goal, error) {
	return s.repo.ListByUser(ctx, userID)
}

func (s *GoalService) Update(ctx context.Context, userID, goalID string, req model.UpdateGoalRequest) (*model.Goal, error) {
	goal, err := s.repo.GetByID(ctx, goalID)
	if err != nil {
		return nil, model.ErrNotFound
	}
	if goal.UserID != userID {
		return nil, model.ErrForbidden
	}
	updated, err := s.repo.Update(ctx, goalID, req.Title, req.Description, req.Unit, req.Target, req.Deadline)
	if err != nil {
		return nil, fmt.Errorf("update goal: %w", err)
	}
	return updated, nil
}

func (s *GoalService) AddProgress(ctx context.Context, userID, goalID string, req model.AddProgressRequest) (*model.Goal, error) {
	goal, err := s.repo.GetByID(ctx, goalID)
	if err != nil {
		return nil, model.ErrNotFound
	}
	if goal.UserID != userID {
		return nil, model.ErrForbidden
	}
	if goal.Current+req.Amount > goal.Target {
		return nil, model.ErrValidation
	}
	updated, err := s.repo.AddProgress(ctx, goalID, req.Amount)
	if err != nil {
		return nil, fmt.Errorf("add progress: %w", err)
	}
	return updated, nil
}

func (s *GoalService) Delete(ctx context.Context, userID, goalID string) error {
	goal, err := s.repo.GetByID(ctx, goalID)
	if err != nil {
		return model.ErrNotFound
	}
	if goal.UserID != userID {
		return model.ErrForbidden
	}
	return s.repo.Delete(ctx, goalID)
}
