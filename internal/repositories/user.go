package repositories

import (
	"context"

	"rest-api/internal/db"
	"rest-api/pkg/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type UserRepository struct {
	q *db.Queries
}

func NewUserRepository(q *db.Queries) *UserRepository {
	return &UserRepository{q: q}
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	u, err := r.q.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	return toUser(u), nil
}

func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	u, err := r.q.GetUserByID(ctx, pgtype.UUID{Bytes: id})
	if err != nil {
		return nil, err
	}
	return toUser(u), nil
}

func (r *UserRepository) GetBySupabaseID(ctx context.Context, supabaseID string) (*models.User, error) {
	u, err := r.q.GetUserBySupabaseID(ctx, pgtype.Text{String: supabaseID, Valid: true})
	if err != nil {
		return nil, err
	}
	return toUser(u), nil
}

func (r *UserRepository) Create(ctx context.Context, email, name, passwordHash, supabaseID string) (*models.User, error) {
	var supabaseIDParam pgtype.Text
	if supabaseID != "" {
		supabaseIDParam = pgtype.Text{String: supabaseID, Valid: true}
	}

	u, err := r.q.CreateUser(ctx, db.CreateUserParams{
		Email:        email,
		Name:         name,
		PasswordHash: passwordHash,
		SupabaseID:   supabaseIDParam,
	})
	if err != nil {
		return nil, err
	}
	return toUser(u), nil
}

func (r *UserRepository) UpdateEmailConfirmed(ctx context.Context, supabaseID string) error {
	return r.q.UpdateEmailConfirmed(ctx, pgtype.Text{String: supabaseID, Valid: true})
}

func (r *UserRepository) UpdateSupabaseID(ctx context.Context, userID uuid.UUID, supabaseID string) error {
	return r.q.UpdateUserSupabaseID(ctx, db.UpdateUserSupabaseIDParams{
		ID:         pgtype.UUID{Bytes: userID},
		SupabaseID: pgtype.Text{String: supabaseID, Valid: true},
	})
}

func toUser(u db.User) *models.User {
	user := &models.User{
		ID:           u.ID.Bytes,
		Email:        u.Email,
		Name:         u.Name,
		PasswordHash: u.PasswordHash,
		CreatedAt:    u.CreatedAt.Time,
		UpdatedAt:    u.UpdatedAt.Time,
	}
	if u.SupabaseID.Valid {
		user.SupabaseID = &u.SupabaseID.String
	}
	if u.EmailConfirmed.Valid {
		user.EmailConfirmed = u.EmailConfirmed.Bool
	}
	return user
}