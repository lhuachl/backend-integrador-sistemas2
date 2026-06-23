package service

import (
	"context"
	"fmt"
	"strings"

	"flowstate/api/internal/model"
	"flowstate/api/internal/repository"

	"github.com/google/uuid"
)

type TeamService struct {
	repo repository.TeamRepository
}

func NewTeamService(repo repository.TeamRepository) *TeamService {
	return &TeamService{repo: repo}
}

func (s *TeamService) Create(ctx context.Context, userID string, req model.CreateTeamRequest) (*model.Team, error) {
	slug := req.Slug
	if slug == "" {
		base := strings.ToLower(strings.ReplaceAll(strings.TrimSpace(req.Name), " ", "-"))
		slug = base + "-" + uuid.NewString()[:8]
	}
	team, err := s.repo.Create(ctx, req.Name, slug, userID, req.Description)
	if err != nil {
		return nil, fmt.Errorf("create team: %w", err)
	}
	_, err = s.repo.AddMember(ctx, userID, team.ID, "owner")
	if err != nil {
		return nil, fmt.Errorf("add owner as member: %w", err)
	}
	return team, nil
}

func (s *TeamService) GetByID(ctx context.Context, id string) (*model.Team, error) {
	team, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, model.ErrNotFound
	}
	return team, nil
}

func (s *TeamService) ListByUser(ctx context.Context, userID string) ([]model.Team, error) {
	return s.repo.ListByUser(ctx, userID)
}

func (s *TeamService) AddMember(ctx context.Context, teamID, userID, role string) (*model.TeamMember, error) {
	_, err := s.repo.GetByID(ctx, teamID)
	if err != nil {
		return nil, model.ErrNotFound
	}
	if role != "mentor" && role != "member" {
		return nil, model.ErrValidation
	}
	member, err := s.repo.AddMember(ctx, userID, teamID, role)
	if err != nil {
		return nil, fmt.Errorf("add member: %w", err)
	}
	return member, nil
}

func (s *TeamService) ListMembers(ctx context.Context, teamID string) ([]model.TeamMember, error) {
	return s.repo.ListMembers(ctx, teamID)
}

func (s *TeamService) RemoveMember(ctx context.Context, teamID, userID string) error {
	return s.repo.RemoveMember(ctx, userID, teamID)
}
