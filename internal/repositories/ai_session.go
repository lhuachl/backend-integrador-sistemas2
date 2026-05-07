package repositories

import (
	"context"

	"rest-api/internal/db"
	"rest-api/pkg/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type AISessionRepository struct {
	q *db.Queries
}

func NewAISessionRepository(q *db.Queries) *AISessionRepository {
	return &AISessionRepository{q: q}
}

func (r *AISessionRepository) GetByUser(ctx context.Context, userID uuid.UUID, limit int) ([]*models.AISession, error) {
	sessions, err := r.q.GetAISessionsByUser(ctx, pgtype.UUID{Bytes: userID})
	if err != nil {
		return nil, err
	}
	return toAISessions(sessions), nil
}

func (r *AISessionRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.AISession, error) {
	s, err := r.q.GetAISessionByID(ctx, pgtype.UUID{Bytes: id})
	if err != nil {
		return nil, err
	}
	return toAISession(s), nil
}

func (r *AISessionRepository) Create(ctx context.Context, userID uuid.UUID, command, inputSummary, outputSummary string) (*models.AISession, error) {
	var inputParam, outputParam pgtype.Text
	if inputSummary != "" {
		inputParam = pgtype.Text{String: inputSummary, Valid: true}
	}
	if outputSummary != "" {
		outputParam = pgtype.Text{String: outputSummary, Valid: true}
	}

	s, err := r.q.CreateAISession(ctx, db.CreateAISessionParams{
		UserID:       pgtype.UUID{Bytes: userID},
		Command:      command,
		InputSummary: inputParam,
		OutputSummary: outputParam,
	})
	if err != nil {
		return nil, err
	}
	return toAISession(s), nil
}

func (r *AISessionRepository) Update(ctx context.Context, id uuid.UUID, inputSummary, outputSummary string) error {
	var inputParam, outputParam pgtype.Text
	if inputSummary != "" {
		inputParam = pgtype.Text{String: inputSummary, Valid: true}
	}
	if outputSummary != "" {
		outputParam = pgtype.Text{String: outputSummary, Valid: true}
	}

	return r.q.UpdateAISession(ctx, db.UpdateAISessionParams{
		ID:           pgtype.UUID{Bytes: id},
		InputSummary: inputParam,
		OutputSummary: outputParam,
	})
}

func (r *AISessionRepository) CountByUser(ctx context.Context, userID uuid.UUID) (int, error) {
	count, err := r.q.CountAISessionsByUser(ctx, pgtype.UUID{Bytes: userID})
	if err != nil {
		return 0, err
	}
	return int(count), nil
}

func toAISession(s db.AiSession) *models.AISession {
	session := &models.AISession{
		ID:        s.ID.Bytes,
		UserID:    s.UserID.Bytes,
		Command:   s.Command,
		CreatedAt: s.CreatedAt.Time,
	}
	if s.InputSummary.Valid {
		session.InputSummary = &s.InputSummary.String
	}
	if s.OutputSummary.Valid {
		session.OutputSummary = &s.OutputSummary.String
	}
	return session
}

func toAISessions(sessions []db.AiSession) []*models.AISession {
	result := make([]*models.AISession, len(sessions))
	for i, s := range sessions {
		result[i] = toAISession(s)
	}
	return result
}