package repository

import (
	"context"
	db "flowstate/api/internal/db"
	"flowstate/api/internal/model"
)

type TaskRepository interface {
	Create(ctx context.Context, userID, title, status string, goalID, dueDate *string) (*model.Task, error)
	GetByID(ctx context.Context, id string) (*model.Task, error)
	ListByUser(ctx context.Context, userID string) ([]model.Task, error)
	ListByUserAndGoal(ctx context.Context, userID, goalID string) ([]model.Task, error)
	ListByUserAndStatus(ctx context.Context, userID, status string) ([]model.Task, error)
	Update(ctx context.Context, id string, title, status *string, goalID, dueDate *string) (*model.Task, error)
	Delete(ctx context.Context, id string) error
}

func NewTaskRepository(q *db.Queries) TaskRepository { return &taskRepo{q: q} }

type taskRepo struct{ q *db.Queries }

func (r *taskRepo) Create(ctx context.Context, userID, title, status string, goalID, dueDate *string) (*model.Task, error) {
	goalCol := ""
	if goalID != nil {
		goalCol = *goalID
	}
	dueDateCol := ""
	if dueDate != nil {
		dueDateCol = *dueDate
	}
	row, err := r.q.CreateTask(ctx, &db.CreateTaskParams{
		Column1: title,
		Column2: status,
		Column3: userID,
		Column4: goalCol,
		Column5: dueDateCol,
	})
	if err != nil {
		return nil, err
	}
	return &model.Task{
		ID:        row.ID,
		Title:     row.Title,
		Status:    row.Status,
		UserID:    row.UserID,
		GoalID:    strPtr(row.GoalID),
		DueDate:   formatDate(row.DueDate),
		CreatedAt: row.CreatedAt,
	}, nil
}

func (r *taskRepo) GetByID(ctx context.Context, id string) (*model.Task, error) {
	row, err := r.q.GetTaskByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &model.Task{
		ID:        row.ID,
		Title:     row.Title,
		Status:    row.Status,
		UserID:    row.UserID,
		GoalID:    strPtr(row.GoalID),
		DueDate:   formatDate(row.DueDate),
		CreatedAt: row.CreatedAt,
	}, nil
}

func (r *taskRepo) ListByUser(ctx context.Context, userID string) ([]model.Task, error) {
	rows, err := r.q.ListUserTasks(ctx, userID)
	if err != nil {
		return nil, err
	}
	tasks := make([]model.Task, len(rows))
	for i, row := range rows {
		tasks[i] = model.Task{
			ID:        row.ID,
			Title:     row.Title,
			Status:    row.Status,
			UserID:    row.UserID,
			GoalID:    strPtr(row.GoalID),
			DueDate:   formatDate(row.DueDate),
			CreatedAt: row.CreatedAt,
		}
	}
	return tasks, nil
}

func (r *taskRepo) ListByUserAndGoal(ctx context.Context, userID, goalID string) ([]model.Task, error) {
	rows, err := r.q.ListUserTasksByGoal(ctx, &db.ListUserTasksByGoalParams{
		Column1: userID,
		Column2: goalID,
	})
	if err != nil {
		return nil, err
	}
	tasks := make([]model.Task, len(rows))
	for i, row := range rows {
		tasks[i] = model.Task{
			ID:        row.ID,
			Title:     row.Title,
			Status:    row.Status,
			UserID:    row.UserID,
			GoalID:    strPtr(row.GoalID),
			DueDate:   formatDate(row.DueDate),
			CreatedAt: row.CreatedAt,
		}
	}
	return tasks, nil
}

func (r *taskRepo) ListByUserAndStatus(ctx context.Context, userID, status string) ([]model.Task, error) {
	rows, err := r.q.ListUserTasksByStatus(ctx, &db.ListUserTasksByStatusParams{
		Column1: userID,
		Column2: status,
	})
	if err != nil {
		return nil, err
	}
	tasks := make([]model.Task, len(rows))
	for i, row := range rows {
		tasks[i] = model.Task{
			ID:        row.ID,
			Title:     row.Title,
			Status:    row.Status,
			UserID:    row.UserID,
			GoalID:    strPtr(row.GoalID),
			DueDate:   formatDate(row.DueDate),
			CreatedAt: row.CreatedAt,
		}
	}
	return tasks, nil
}

// ponytail: COALESCE string params are non-null in generated code; empty string = "set to empty"
func (r *taskRepo) Update(ctx context.Context, id string, title, status *string, goalID, dueDate *string) (*model.Task, error) {
	titleCol := ""
	if title != nil {
		titleCol = *title
	}
	statusCol := ""
	if status != nil {
		statusCol = *status
	}
	goalCol := ""
	if goalID != nil {
		goalCol = *goalID
	}
	dueDateCol := ""
	if dueDate != nil {
		dueDateCol = *dueDate
	}
	row, err := r.q.UpdateTask(ctx, &db.UpdateTaskParams{
		Column1: id,
		Column2: titleCol,
		Column3: statusCol,
		Column4: goalCol,
		Column5: dueDateCol,
	})
	if err != nil {
		return nil, err
	}
	return &model.Task{
		ID:        row.ID,
		Title:     row.Title,
		Status:    row.Status,
		UserID:    row.UserID,
		GoalID:    strPtr(row.GoalID),
		DueDate:   formatDate(row.DueDate),
		CreatedAt: row.CreatedAt,
	}, nil
}

func (r *taskRepo) Delete(ctx context.Context, id string) error {
	return r.q.DeleteTask(ctx, id)
}
