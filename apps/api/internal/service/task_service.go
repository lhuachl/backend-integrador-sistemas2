package service

import (
	"context"
	"fmt"

	"flowstate/api/internal/model"
	"flowstate/api/internal/repository"
)

type TaskService struct {
	repo repository.TaskRepository
}

func NewTaskService(repo repository.TaskRepository) *TaskService {
	return &TaskService{repo: repo}
}

func (s *TaskService) Create(ctx context.Context, userID string, req model.CreateTaskRequest) (*model.Task, error) {
	status := req.Status
	if status == "" {
		status = "todo"
	}
	task, err := s.repo.Create(ctx, userID, req.Title, status, req.GoalID, req.DueDate)
	if err != nil {
		return nil, fmt.Errorf("create task: %w", err)
	}
	return task, nil
}

func (s *TaskService) GetByID(ctx context.Context, userID, id string) (*model.Task, error) {
	task, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, model.ErrNotFound
	}
	if task.UserID != userID {
		return nil, model.ErrNotFound
	}
	return task, nil
}

func (s *TaskService) List(ctx context.Context, userID string, goalID, status *string) ([]model.Task, error) {
	if goalID != nil {
		return s.repo.ListByUserAndGoal(ctx, userID, *goalID)
	}
	if status != nil {
		return s.repo.ListByUserAndStatus(ctx, userID, *status)
	}
	return s.repo.ListByUser(ctx, userID)
}

func (s *TaskService) Update(ctx context.Context, userID, taskID string, req model.UpdateTaskRequest) (*model.Task, error) {
	task, err := s.repo.GetByID(ctx, taskID)
	if err != nil {
		return nil, model.ErrNotFound
	}
	if task.UserID != userID {
		return nil, model.ErrForbidden
	}
	updated, err := s.repo.Update(ctx, taskID, req.Title, req.Status, req.GoalID, req.DueDate)
	if err != nil {
		return nil, fmt.Errorf("update task: %w", err)
	}
	return updated, nil
}

func (s *TaskService) Delete(ctx context.Context, userID, taskID string) error {
	task, err := s.repo.GetByID(ctx, taskID)
	if err != nil {
		return model.ErrNotFound
	}
	if task.UserID != userID {
		return model.ErrForbidden
	}
	return s.repo.Delete(ctx, taskID)
}
