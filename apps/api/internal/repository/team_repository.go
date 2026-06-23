package repository

import (
	"context"
	db "flowstate/api/internal/db"
	"flowstate/api/internal/model"

	"github.com/google/uuid"
)

type TeamRepository interface {
	Create(ctx context.Context, name, slug, ownerID string, description *string) (*model.Team, error)
	GetByID(ctx context.Context, id string) (*model.Team, error)
	GetBySlug(ctx context.Context, slug string) (*model.Team, error)
	ListByUser(ctx context.Context, userID string) ([]model.Team, error)
	Delete(ctx context.Context, id string) error
	AddMember(ctx context.Context, userID, teamID, role string) (*model.TeamMember, error)
	GetMember(ctx context.Context, userID, teamID string) (*model.TeamMember, error)
	ListMembers(ctx context.Context, teamID string) ([]model.TeamMember, error)
	RemoveMember(ctx context.Context, userID, teamID string) error
}

func NewTeamRepository(q *db.Queries) TeamRepository { return &teamRepo{q: q} }

type teamRepo struct{ q *db.Queries }

func (r *teamRepo) Create(ctx context.Context, name, slug, ownerID string, description *string) (*model.Team, error) {
	descCol := ""
	if description != nil {
		descCol = *description
	}
	row, err := r.q.CreateTeam(ctx, &db.CreateTeamParams{
		Column1: uuid.NewString(),
		Column2: name,
		Column3: slug,
		Column4: descCol,
		Column5: ownerID,
	})
	if err != nil {
		return nil, err
	}
	return &model.Team{
		ID:          row.ID,
		Name:        row.Name,
		Slug:        row.Slug,
		Description: strPtr(row.Description),
		OwnerID:     row.OwnerID,
		CreatedAt:   row.CreatedAt,
	}, nil
}

func (r *teamRepo) GetByID(ctx context.Context, id string) (*model.Team, error) {
	row, err := r.q.GetTeamByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &model.Team{
		ID:          row.ID,
		Name:        row.Name,
		Slug:        row.Slug,
		Description: strPtr(row.Description),
		OwnerID:     row.OwnerID,
		CreatedAt:   row.CreatedAt,
	}, nil
}

func (r *teamRepo) GetBySlug(ctx context.Context, slug string) (*model.Team, error) {
	row, err := r.q.GetTeamBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	return &model.Team{
		ID:          row.ID,
		Name:        row.Name,
		Slug:        row.Slug,
		Description: strPtr(row.Description),
		OwnerID:     row.OwnerID,
		CreatedAt:   row.CreatedAt,
	}, nil
}

func (r *teamRepo) ListByUser(ctx context.Context, userID string) ([]model.Team, error) {
	rows, err := r.q.ListTeamsByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	teams := make([]model.Team, len(rows))
	for i, row := range rows {
		teams[i] = model.Team{
			ID:          row.ID,
			Name:        row.Name,
			Slug:        row.Slug,
			Description: strPtr(row.Description),
			OwnerID:     row.OwnerID,
			CreatedAt:   row.CreatedAt,
		}
	}
	return teams, nil
}

func (r *teamRepo) Delete(ctx context.Context, id string) error {
	return r.q.DeleteTeam(ctx, id)
}

func (r *teamRepo) AddMember(ctx context.Context, userID, teamID, role string) (*model.TeamMember, error) {
	row, err := r.q.AddTeamMember(ctx, &db.AddTeamMemberParams{
		Column1: uuid.NewString(),
		Column2: userID,
		Column3: teamID,
		Column4: role,
	})
	if err != nil {
		return nil, err
	}
	return &model.TeamMember{
		ID:       row.ID,
		UserID:   row.UserID,
		TeamID:   row.TeamID,
		Role:     row.Role,
		JoinedAt: row.JoinedAt,
	}, nil
}

func (r *teamRepo) GetMember(ctx context.Context, userID, teamID string) (*model.TeamMember, error) {
	row, err := r.q.GetTeamMember(ctx, &db.GetTeamMemberParams{
		Column1: userID,
		Column2: teamID,
	})
	if err != nil {
		return nil, err
	}
	return &model.TeamMember{
		ID:       row.ID,
		UserID:   row.UserID,
		TeamID:   row.TeamID,
		Role:     row.Role,
		JoinedAt: row.JoinedAt,
	}, nil
}

func (r *teamRepo) ListMembers(ctx context.Context, teamID string) ([]model.TeamMember, error) {
	rows, err := r.q.ListTeamMembers(ctx, teamID)
	if err != nil {
		return nil, err
	}
	members := make([]model.TeamMember, len(rows))
	for i, row := range rows {
		members[i] = model.TeamMember{
			ID:       row.ID,
			UserID:   row.UserID,
			TeamID:   row.TeamID,
			Role:     row.Role,
			JoinedAt: row.JoinedAt,
		}
	}
	return members, nil
}

func (r *teamRepo) RemoveMember(ctx context.Context, userID, teamID string) error {
	return r.q.RemoveTeamMember(ctx, &db.RemoveTeamMemberParams{
		Column1: userID,
		Column2: teamID,
	})
}
