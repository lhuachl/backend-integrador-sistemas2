package repositories

import (
	"context"

	"rest-api/internal/db"
	"rest-api/pkg/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type TaskRepository struct {
	q *db.Queries
}

func NewTaskRepository(q *db.Queries) *TaskRepository {
	return &TaskRepository{q: q}
}

func (r *TaskRepository) GetByUser(ctx context.Context, userID uuid.UUID) ([]*models.Task, error) {
	tasks, err := r.q.GetTasksByUser(ctx, pgtype.UUID{Bytes: userID})
	if err != nil {
		return nil, err
	}
	return toTasks(tasks), nil
}

func (r *TaskRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Task, error) {
	t, err := r.q.GetTaskByID(ctx, pgtype.UUID{Bytes: id})
	if err != nil {
		return nil, err
	}
	return toTask(t), nil
}

func (r *TaskRepository) Create(ctx context.Context, userID uuid.UUID, title, description, priority, columnName string, position int) (*models.Task, error) {
	var descParam pgtype.Text
	if description != "" {
		descParam = pgtype.Text{String: description, Valid: true}
	}

	t, err := r.q.CreateTask(ctx, db.CreateTaskParams{
		UserID:      pgtype.UUID{Bytes: userID},
		Title:       title,
		Description: descParam,
		Priority:    pgtype.Text{String: priority, Valid: true},
		ColumnName:  pgtype.Text{String: columnName, Valid: true},
		Position:    pgtype.Int4{Int32: int32(position)},
	})
	if err != nil {
		return nil, err
	}
	return toTask(t), nil
}

func (r *TaskRepository) Update(ctx context.Context, id uuid.UUID, title, description, status, priority, columnName string, estimatedMinutes *int, position int) (*models.Task, error) {
	var descParam pgtype.Text
	if description != "" {
		descParam = pgtype.Text{String: description, Valid: true}
	}
	var estParam pgtype.Int4
	if estimatedMinutes != nil {
		estParam = pgtype.Int4{Int32: int32(*estimatedMinutes), Valid: true}
	}

	t, err := r.q.UpdateTask(ctx, db.UpdateTaskParams{
		ID:               pgtype.UUID{Bytes: id},
		Title:            title,
		Description:      descParam,
		Status:           pgtype.Text{String: status, Valid: true},
		Priority:         pgtype.Text{String: priority, Valid: true},
		ColumnName:       pgtype.Text{String: columnName, Valid: true},
		EstimatedMinutes: estParam,
		Position:         pgtype.Int4{Int32: int32(position)},
	})
	if err != nil {
		return nil, err
	}
	return toTask(t), nil
}

func (r *TaskRepository) UpdatePosition(ctx context.Context, id uuid.UUID, columnName string, position int) error {
	return r.q.UpdateTaskPosition(ctx, db.UpdateTaskPositionParams{
		ID:         pgtype.UUID{Bytes: id},
		ColumnName: pgtype.Text{String: columnName, Valid: true},
		Position:   pgtype.Int4{Int32: int32(position)},
	})
}

func (r *TaskRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.q.DeleteTask(ctx, pgtype.UUID{Bytes: id})
}

func (r *TaskRepository) GetByColumn(ctx context.Context, userID uuid.UUID, columnName string) ([]*models.Task, error) {
	tasks, err := r.q.GetTasksByColumn(ctx, db.GetTasksByColumnParams{
		UserID:     pgtype.UUID{Bytes: userID},
		ColumnName: pgtype.Text{String: columnName, Valid: true},
	})
	if err != nil {
		return nil, err
	}
	return toTasks(tasks), nil
}

func toTask(t db.Task) *models.Task {
	task := &models.Task{
		ID:         t.ID.Bytes,
		UserID:     t.UserID.Bytes,
		Title:      t.Title,
		Status:     t.Status.String,
		Priority:   t.Priority.String,
		ColumnName: t.ColumnName.String,
		Position:   int(t.Position.Int32),
		CreatedAt:  t.CreatedAt.Time,
		UpdatedAt:  t.UpdatedAt.Time,
	}
	if t.Description.Valid {
		task.Description = &t.Description.String
	}
	if t.EstimatedMinutes.Valid {
		est := int(t.EstimatedMinutes.Int32)
		task.EstimatedMinutes = &est
	}
	return task
}

func toTasks(tasks []db.Task) []*models.Task {
	result := make([]*models.Task, len(tasks))
	for i, t := range tasks {
		result[i] = toTask(t)
	}
	return result
}