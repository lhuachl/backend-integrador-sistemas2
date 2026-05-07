package services

import (
	"context"

	"rest-api/internal/repositories"
	"rest-api/pkg/models"

	"github.com/google/uuid"
)

type TaskService struct {
	repo *repositories.TaskRepository
}

func NewTaskService(repo *repositories.TaskRepository) *TaskService {
	return &TaskService{repo: repo}
}

func (s *TaskService) GetByUser(ctx context.Context, userID uuid.UUID) ([]*models.Task, error) {
	return s.repo.GetByUser(ctx, userID)
}

func (s *TaskService) GetByColumn(ctx context.Context, userID uuid.UUID, column string) ([]*models.Task, error) {
	return s.repo.GetByColumn(ctx, userID, column)
}

func (s *TaskService) GetByID(ctx context.Context, id uuid.UUID) (*models.Task, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *TaskService) Create(ctx context.Context, userID uuid.UUID, req *models.CreateTaskRequest) (*models.Task, error) {
	column := req.ColumnName
	if column == "" {
		column = "backlog"
	}
	priority := req.Priority
	if priority == "" {
		priority = "medium"
	}
	return s.repo.Create(ctx, userID, req.Title, req.Description, priority, column, 0)
}

func (s *TaskService) Update(ctx context.Context, id uuid.UUID, req *models.UpdateTaskRequest) (*models.Task, error) {
	return s.repo.Update(ctx, id, req.Title, req.Description, req.Status, req.Priority, req.ColumnName, &req.EstimatedMinutes, req.Position)
}

func (s *TaskService) UpdatePosition(ctx context.Context, id uuid.UUID, req *models.UpdateTaskPositionRequest) error {
	return s.repo.UpdatePosition(ctx, id, req.ColumnName, req.Position)
}

func (s *TaskService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *TaskService) Complete(ctx context.Context, id uuid.UUID) (*models.Task, error) {
	return s.repo.Update(ctx, id, "", "", "completed", "", "", nil, 0)
}