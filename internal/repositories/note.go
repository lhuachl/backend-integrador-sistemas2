package repositories

import (
	"context"

	"rest-api/internal/db"
	"rest-api/pkg/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type NoteRepository struct {
	q *db.Queries
}

func NewNoteRepository(q *db.Queries) *NoteRepository {
	return &NoteRepository{q: q}
}

func (r *NoteRepository) GetByTaskID(ctx context.Context, taskID uuid.UUID) (*models.Note, error) {
	n, err := r.q.GetNoteByTaskID(ctx, pgtype.UUID{Bytes: taskID})
	if err != nil {
		return nil, err
	}
	return toNote(n), nil
}

func (r *NoteRepository) Create(ctx context.Context, taskID uuid.UUID, contentJSON string) (*models.Note, error) {
	n, err := r.q.CreateNote(ctx, db.CreateNoteParams{
		TaskID:     pgtype.UUID{Bytes: taskID},
		ContentJson: pgtype.Text{String: contentJSON, Valid: true},
	})
	if err != nil {
		return nil, err
	}
	return toNote(n), nil
}

func (r *NoteRepository) Update(ctx context.Context, taskID uuid.UUID, contentJSON string) (*models.Note, error) {
	n, err := r.q.UpdateNote(ctx, db.UpdateNoteParams{
		TaskID:     pgtype.UUID{Bytes: taskID},
		ContentJson: pgtype.Text{String: contentJSON, Valid: true},
	})
	if err != nil {
		return nil, err
	}
	return toNote(n), nil
}

func toNote(n db.Note) *models.Note {
	return &models.Note{
		ID:          n.ID.Bytes,
		TaskID:      n.TaskID.Bytes,
		ContentJSON: n.ContentJson.String,
		CreatedAt:   n.CreatedAt.Time,
		UpdatedAt:   n.UpdatedAt.Time,
	}
}