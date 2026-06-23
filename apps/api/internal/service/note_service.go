package service

import (
	"context"
	"encoding/json"
	"fmt"

	"flowstate/api/internal/model"
	"flowstate/api/internal/repository"
)

type NoteService struct {
	repo     repository.NoteRepository
	teamRepo repository.TeamRepository
}

func NewNoteService(repo repository.NoteRepository, teamRepo repository.TeamRepository) *NoteService {
	return &NoteService{repo: repo, teamRepo: teamRepo}
}

func (s *NoteService) Create(ctx context.Context, userID string, req model.CreateNoteRequest) (*model.Note, error) {
	tags, _ := json.Marshal(req.Tags)
	tagsRaw := json.RawMessage(tags)
	note, err := s.repo.Create(ctx, userID, req.Title, req.Content, req.TeamID, tagsRaw)
	if err != nil {
		return nil, fmt.Errorf("create note: %w", err)
	}

	titles := ExtractWikiLinks(req.Content)
	for _, title := range titles {
		s.repo.InsertLink(ctx, note.ID, nil, title)
	}
	return note, nil
}

func (s *NoteService) GetByID(ctx context.Context, userID, id string) (*model.Note, error) {
	note, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, model.ErrNotFound
	}
	if note.AuthorID != userID {
		if note.TeamID != nil {
			_, err := s.teamRepo.GetMember(ctx, userID, *note.TeamID)
			if err != nil {
				return nil, model.ErrNotFound
			}
		} else {
			return nil, model.ErrNotFound
		}
	}
	return note, nil
}

func (s *NoteService) List(ctx context.Context, userID string, teamID *string, limit, offset int) ([]model.Note, error) {
	if teamID != nil {
		return s.repo.ListByTeam(ctx, *teamID, limit, offset)
	}
	return s.repo.ListByUser(ctx, userID, limit, offset)
}

func (s *NoteService) Search(ctx context.Context, userID string, query *string, teamID *string, limit, offset int) ([]model.Note, error) {
	q := ""
	if query != nil {
		q = *query
	}
	if q == "" {
		return s.List(ctx, userID, teamID, limit, offset)
	}
	if teamID != nil {
		return s.repo.SearchByTeam(ctx, *teamID, q, limit, offset)
	}
	return s.repo.SearchByUser(ctx, userID, q, limit, offset)
}

func (s *NoteService) Update(ctx context.Context, userID, noteID string, req model.UpdateNoteRequest) (*model.Note, error) {
	note, err := s.repo.GetByID(ctx, noteID)
	if err != nil {
		return nil, model.ErrNotFound
	}
	if note.AuthorID != userID {
		return nil, model.ErrForbidden
	}

	var tags, sharedWith json.RawMessage
	if req.Tags != nil {
		t, _ := json.Marshal(req.Tags)
		tags = json.RawMessage(t)
	}
	if req.SharedWith != nil {
		s, _ := json.Marshal(req.SharedWith)
		sharedWith = json.RawMessage(s)
	}

	updated, err := s.repo.Update(ctx, noteID, req.Title, req.Content, tags, req.IsPublic, sharedWith, req.TeamID)
	if err != nil {
		return nil, err
	}

	if req.Content != nil {
		titles := ExtractWikiLinks(*req.Content)
		for _, title := range titles {
			s.repo.InsertLink(ctx, note.ID, nil, title)
		}
	}
	return updated, nil
}

func (s *NoteService) Delete(ctx context.Context, userID, noteID string) error {
	note, err := s.repo.GetByID(ctx, noteID)
	if err != nil {
		return model.ErrNotFound
	}
	if note.AuthorID != userID {
		return model.ErrForbidden
	}
	return s.repo.Delete(ctx, noteID)
}

func (s *NoteService) ShareToTeam(ctx context.Context, userID, noteID string, req model.ShareNoteRequest) (*model.Note, error) {
	note, err := s.repo.GetByID(ctx, noteID)
	if err != nil {
		return nil, model.ErrNotFound
	}
	if note.AuthorID != userID {
		return nil, model.ErrForbidden
	}
	updated, err := s.repo.ShareToTeam(ctx, noteID, req.TeamID)
	if err != nil {
		return nil, err
	}
	return updated, nil
}

func (s *NoteService) ListLinks(ctx context.Context, noteID string) ([]model.NoteLink, error) {
	return s.repo.GetLinks(ctx, noteID)
}

func (s *NoteService) AddLink(ctx context.Context, userID, noteID string, req model.AddNoteLinkRequest) error {
	note, err := s.repo.GetByID(ctx, noteID)
	if err != nil {
		return model.ErrNotFound
	}
	if note.AuthorID != userID {
		return model.ErrForbidden
	}
	return s.repo.InsertLink(ctx, noteID, req.TargetNoteID, req.TargetTitle)
}
