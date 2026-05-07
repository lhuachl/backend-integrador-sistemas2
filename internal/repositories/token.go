package repositories

import (
	"context"
	"time"

	"rest-api/internal/db"
	"rest-api/pkg/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type TokenRepository struct {
	q *db.Queries
}

func NewTokenRepository(q *db.Queries) *TokenRepository {
	return &TokenRepository{q: q}
}

func (r *TokenRepository) Create(ctx context.Context, email, token string, expiresAt time.Time) (*models.ConfirmationToken, error) {
	t, err := r.q.CreateConfirmationToken(ctx, db.CreateConfirmationTokenParams{
		Email:     email,
		Token:     token,
		ExpiresAt: pgtype.Timestamptz{Time: expiresAt, Valid: true},
	})
	if err != nil {
		return nil, err
	}
	return toToken(t), nil
}

func (r *TokenRepository) GetByToken(ctx context.Context, token string) (*models.ConfirmationToken, error) {
	t, err := r.q.GetConfirmationToken(ctx, token)
	if err != nil {
		return nil, err
	}
	return toToken(t), nil
}

func (r *TokenRepository) MarkUsed(ctx context.Context, id uuid.UUID) error {
	return r.q.MarkTokenUsed(ctx, pgtype.UUID{Bytes: id})
}

func toToken(t db.ConfirmationToken) *models.ConfirmationToken {
	return &models.ConfirmationToken{
		ID:        t.ID.Bytes,
		Email:     t.Email,
		Token:     t.Token,
		ExpiresAt: t.ExpiresAt.Time,
		Used:      t.Used.Bool,
		CreatedAt: t.CreatedAt.Time,
	}
}