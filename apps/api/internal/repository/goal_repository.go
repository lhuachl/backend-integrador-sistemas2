package repository

import (
	"context"
	"time"
	db "flowstate/api/internal/db"
	"flowstate/api/internal/model"

	"github.com/jackc/pgx/v5/pgtype"
)

type GoalRepository interface {
	Create(ctx context.Context, userID, title, unit string, description *string, teamID *string, current, target float64, deadline *string) (*model.Goal, error)
	GetByID(ctx context.Context, id string) (*model.Goal, error)
	ListByUser(ctx context.Context, userID string) ([]model.Goal, error)
	Update(ctx context.Context, id string, title, description, unit *string, target *float64, deadline *string) (*model.Goal, error)
	AddProgress(ctx context.Context, id string, amount float64) (*model.Goal, error)
	Delete(ctx context.Context, id string) error
}

func NewGoalRepository(q *db.Queries) GoalRepository { return &goalRepo{q: q} }

type goalRepo struct{ q *db.Queries }

func (r *goalRepo) Create(ctx context.Context, userID, title, unit string, description *string, teamID *string, current, target float64, deadline *string) (*model.Goal, error) {
	descCol := ""
	if description != nil {
		descCol = *description
	}
	teamCol := ""
	if teamID != nil {
		teamCol = *teamID
	}
	deadlineDate, err := parseDate(deadline)
	if err != nil {
		return nil, err
	}
	row, err := r.q.CreateGoal(ctx, &db.CreateGoalParams{
		Column1: title,
		Column2: descCol,
		Column3: userID,
		Column4: teamCol,
		Column5: &current,
		Column6: &target,
		Column7: unit,
		Column8: deadlineDate,
	})
	if err != nil {
		return nil, err
	}
	return &model.Goal{
		ID:          row.ID,
		Title:       row.Title,
		Description: strPtr(row.Description),
		UserID:      row.UserID,
		TeamID:      strPtr(row.TeamID),
		Current:     row.Current,
		Target:      row.Target,
		Unit:        row.Unit,
		Deadline:    formatDate(row.Deadline),
		CreatedAt:   row.CreatedAt,
	}, nil
}

func (r *goalRepo) GetByID(ctx context.Context, id string) (*model.Goal, error) {
	row, err := r.q.GetGoalByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &model.Goal{
		ID:          row.ID,
		Title:       row.Title,
		Description: strPtr(row.Description),
		UserID:      row.UserID,
		TeamID:      strPtr(row.TeamID),
		Current:     row.Current,
		Target:      row.Target,
		Unit:        row.Unit,
		Deadline:    formatDate(row.Deadline),
		CreatedAt:   row.CreatedAt,
	}, nil
}

func (r *goalRepo) ListByUser(ctx context.Context, userID string) ([]model.Goal, error) {
	rows, err := r.q.ListUserGoals(ctx, userID)
	if err != nil {
		return nil, err
	}
	goals := make([]model.Goal, len(rows))
	for i, row := range rows {
		goals[i] = model.Goal{
			ID:          row.ID,
			Title:       row.Title,
			Description: strPtr(row.Description),
			UserID:      row.UserID,
			TeamID:      strPtr(row.TeamID),
			Current:     row.Current,
			Target:      row.Target,
			Unit:        row.Unit,
			Deadline:    formatDate(row.Deadline),
			CreatedAt:   row.CreatedAt,
		}
	}
	return goals, nil
}

// ponytail: COALESCE string params are non-null in generated code; empty string = "set to empty"
func (r *goalRepo) Update(ctx context.Context, id string, title, description, unit *string, target *float64, deadline *string) (*model.Goal, error) {
	titleCol := ""
	if title != nil {
		titleCol = *title
	}
	descCol := ""
	if description != nil {
		descCol = *description
	}
	unitCol := ""
	if unit != nil {
		unitCol = *unit
	}
	deadlineDate, err := parseDate(deadline)
	if err != nil {
		return nil, err
	}
	row, err := r.q.UpdateGoal(ctx, &db.UpdateGoalParams{
		Column1: id,
		Column2: titleCol,
		Column3: descCol,
		Column4: target,
		Column5: unitCol,
		Column6: deadlineDate,
	})
	if err != nil {
		return nil, err
	}
	return &model.Goal{
		ID:          row.ID,
		Title:       row.Title,
		Description: strPtr(row.Description),
		UserID:      row.UserID,
		TeamID:      strPtr(row.TeamID),
		Current:     row.Current,
		Target:      row.Target,
		Unit:        row.Unit,
		Deadline:    formatDate(row.Deadline),
		CreatedAt:   row.CreatedAt,
	}, nil
}

func (r *goalRepo) AddProgress(ctx context.Context, id string, amount float64) (*model.Goal, error) {
	row, err := r.q.AddGoalProgress(ctx, &db.AddGoalProgressParams{
		Column1: id,
		Column2: &amount,
	})
	if err != nil {
		return nil, err
	}
	return &model.Goal{
		ID:          row.ID,
		Title:       row.Title,
		Description: strPtr(row.Description),
		UserID:      row.UserID,
		TeamID:      strPtr(row.TeamID),
		Current:     row.Current,
		Target:      row.Target,
		Unit:        row.Unit,
		Deadline:    formatDate(row.Deadline),
		CreatedAt:   row.CreatedAt,
	}, nil
}

func (r *goalRepo) Delete(ctx context.Context, id string) error {
	return r.q.DeleteGoal(ctx, id)
}

func parseDate(s *string) (pgtype.Date, error) {
	if s == nil || *s == "" {
		return pgtype.Date{}, nil
	}
	t, err := time.Parse("2006-01-02", *s)
	if err != nil {
		return pgtype.Date{}, err
	}
	return pgtype.Date{Time: t, Valid: true}, nil
}

func formatDate(d string) *string {
	if d == "" {
		return nil
	}
	return &d
}
