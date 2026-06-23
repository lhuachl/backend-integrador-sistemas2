package service

import (
	"context"

	"flowstate/api/internal/model"
	"flowstate/api/internal/repository"
)

type GraphService struct {
	repo repository.GraphRepository
}

func NewGraphService(repo repository.GraphRepository) *GraphService {
	return &GraphService{repo: repo}
}

func (s *GraphService) GetGraph(ctx context.Context, userID string, teamID *string) (*model.GraphData, error) {
	if teamID != nil {
		return s.repo.GetGraphByTeam(ctx, *teamID)
	}
	return s.repo.GetGraphByUser(ctx, userID)
}
