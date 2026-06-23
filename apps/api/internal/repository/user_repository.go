package repository

import (
	"context"
	db "flowstate/api/internal/db"
	"flowstate/api/internal/model"

	"github.com/google/uuid"
)

type UserRepository interface {
	Create(ctx context.Context, email, name, passwordHash string) (*model.User, error)
	GetByID(ctx context.Context, id string) (*model.User, error)
	GetByEmail(ctx context.Context, email string) (*model.User, error)
	GetByHandle(ctx context.Context, handle string) (*model.User, error)
	UpdateProfile(ctx context.Context, id string, name, handle *string, avatarURL *string) (*model.User, error)
	MarkVerified(ctx context.Context, id string) error
	CheckEmailExists(ctx context.Context, email string) (bool, error)
	Delete(ctx context.Context, id string) error
}

func NewUserRepository(q *db.Queries) UserRepository { return &userRepo{q: q} }

type userRepo struct{ q *db.Queries }

func (r *userRepo) Create(ctx context.Context, email, name, passwordHash string) (*model.User, error) {
	verified := false
	row, err := r.q.CreateUser(ctx, &db.CreateUserParams{
		Column1: uuid.NewString(),
		Column2: email,
		Column3: name,
		Column4: "",
		Column5: "",
		Column6: "user",
		Column7: passwordHash,
		Column8: &verified,
	})
	if err != nil {
		return nil, err
	}
	return &model.User{
		ID:           row.ID,
		Email:        row.Email,
		Name:         row.Name,
		Handle:       strPtr(row.Handle),
		AvatarURL:    strPtr(row.AvatarUrl),
		Role:         row.Role,
		PasswordHash: &row.PasswordHash,
		Verified:     row.Verified,
		CreatedAt:    row.CreatedAt,
	}, nil
}

func (r *userRepo) GetByID(ctx context.Context, id string) (*model.User, error) {
	row, err := r.q.GetUserByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &model.User{
		ID:           row.ID,
		Email:        row.Email,
		Name:         row.Name,
		Handle:       strPtr(row.Handle),
		AvatarURL:    strPtr(row.AvatarUrl),
		Role:         row.Role,
		PasswordHash: &row.PasswordHash,
		Verified:     row.Verified,
		CreatedAt:    row.CreatedAt,
	}, nil
}

func (r *userRepo) GetByEmail(ctx context.Context, email string) (*model.User, error) {
	row, err := r.q.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	return &model.User{
		ID:           row.ID,
		Email:        row.Email,
		Name:         row.Name,
		Handle:       strPtr(row.Handle),
		AvatarURL:    strPtr(row.AvatarUrl),
		Role:         row.Role,
		PasswordHash: &row.PasswordHash,
		Verified:     row.Verified,
		CreatedAt:    row.CreatedAt,
	}, nil
}

func (r *userRepo) GetByHandle(ctx context.Context, handle string) (*model.User, error) {
	row, err := r.q.GetUserByHandle(ctx, handle)
	if err != nil {
		return nil, err
	}
	return &model.User{
		ID:           row.ID,
		Email:        row.Email,
		Name:         row.Name,
		Handle:       strPtr(row.Handle),
		AvatarURL:    strPtr(row.AvatarUrl),
		Role:         row.Role,
		PasswordHash: &row.PasswordHash,
		Verified:     row.Verified,
		CreatedAt:    row.CreatedAt,
	}, nil
}

// ponytail: COALESCE params are non-null string in generated code; empty string = "set to empty"
func (r *userRepo) UpdateProfile(ctx context.Context, id string, name, handle *string, avatarURL *string) (*model.User, error) {
	nameCol := ""
	if name != nil {
		nameCol = *name
	}
	handleCol := ""
	if handle != nil {
		handleCol = *handle
	}
	avatarCol := ""
	if avatarURL != nil {
		avatarCol = *avatarURL
	}
	row, err := r.q.UpdateUserProfile(ctx, &db.UpdateUserProfileParams{
		Column1: id,
		Column2: nameCol,
		Column3: handleCol,
		Column4: avatarCol,
	})
	if err != nil {
		return nil, err
	}
	return &model.User{
		ID:           row.ID,
		Email:        row.Email,
		Name:         row.Name,
		Handle:       strPtr(row.Handle),
		AvatarURL:    strPtr(row.AvatarUrl),
		Role:         row.Role,
		PasswordHash: &row.PasswordHash,
		Verified:     row.Verified,
		CreatedAt:    row.CreatedAt,
	}, nil
}

func (r *userRepo) MarkVerified(ctx context.Context, id string) error {
	return r.q.MarkUserVerified(ctx, id)
}

func (r *userRepo) CheckEmailExists(ctx context.Context, email string) (bool, error) {
	return r.q.CheckEmailExists(ctx, email)
}

func (r *userRepo) Delete(ctx context.Context, id string) error {
	return r.q.DeleteUser(ctx, id)
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
