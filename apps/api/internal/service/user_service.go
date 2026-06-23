package service

import (
	"context"
	"fmt"

	"flowstate/api/internal/model"
	"flowstate/api/internal/repository"
)

type UserService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) GetByID(ctx context.Context, id string) (*model.User, error) {
	user, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, model.ErrNotFound
	}
	return user, nil
}

func (s *UserService) UpdateProfile(ctx context.Context, id string, req model.UpdateProfileRequest) (*model.User, error) {
	user, err := s.repo.UpdateProfile(ctx, id, req.Name, req.Handle, nil)
	if err != nil {
		return nil, fmt.Errorf("update profile: %w", err)
	}
	return user, nil
}
