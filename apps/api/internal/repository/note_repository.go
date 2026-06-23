package repository

import (
	"context"
	"encoding/json"
	db "flowstate/api/internal/db"
	"flowstate/api/internal/model"

	"github.com/google/uuid"
)

type NoteRepository interface {
	Create(ctx context.Context, userID, title, content string, teamID *string, tags json.RawMessage) (*model.Note, error)
	GetByID(ctx context.Context, id string) (*model.Note, error)
	ListByUser(ctx context.Context, userID string, limit, offset int) ([]model.Note, error)
	ListByTeam(ctx context.Context, teamID string, limit, offset int) ([]model.Note, error)
	SearchByUser(ctx context.Context, userID, query string, limit, offset int) ([]model.Note, error)
	SearchByTeam(ctx context.Context, teamID, query string, limit, offset int) ([]model.Note, error)
	Update(ctx context.Context, id string, title, content *string, tags json.RawMessage, isPublic *bool, sharedWith json.RawMessage, teamID *string) (*model.Note, error)
	Delete(ctx context.Context, id string) error
	ShareToTeam(ctx context.Context, noteID, teamID string) (*model.Note, error)
	InsertLink(ctx context.Context, sourceID string, targetID *string, targetTitle string) error
	GetLinks(ctx context.Context, noteID string) ([]model.NoteLink, error)
	GetBacklinks(ctx context.Context, noteID string) ([]model.NoteLink, error)
	ResolveLinks(ctx context.Context, title, targetID string) error
	DeleteLinks(ctx context.Context, noteID string) error
}

func NewNoteRepository(q *db.Queries) NoteRepository { return &noteRepo{q: q} }

type noteRepo struct{ q *db.Queries }

func (r *noteRepo) Create(ctx context.Context, userID, title, content string, teamID *string, tags json.RawMessage) (*model.Note, error) {
	teamCol := ""
	if teamID != nil {
		teamCol = *teamID
	}
	isPublic := false
	sharedWith := json.RawMessage(`[]`)
	row, err := r.q.CreateNote(ctx, &db.CreateNoteParams{
		Column1: uuid.NewString(),
		Column2: title,
		Column3: content,
		Column4: userID,
		Column5: teamCol,
		Column6: jsonPtrMsg(tags),
		Column7: &isPublic,
		Column8: &sharedWith,
	})
	if err != nil {
		return nil, err
	}
	return &model.Note{
		ID:         row.ID,
		Title:      row.Title,
		Content:    row.Content,
		AuthorID:   row.AuthorID,
		TeamID:     strPtr(row.TeamID),
		Tags:       rawMsgVal(row.Tags),
		IsPublic:   boolVal(row.IsPublic),
		SharedWith: rawMsgVal(row.SharedWith),
		CreatedAt:  row.CreatedAt,
		UpdatedAt:  row.UpdatedAt,
	}, nil
}

func (r *noteRepo) GetByID(ctx context.Context, id string) (*model.Note, error) {
	row, err := r.q.GetNoteByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &model.Note{
		ID:         row.ID,
		Title:      row.Title,
		Content:    row.Content,
		AuthorID:   row.AuthorID,
		TeamID:     strPtr(row.TeamID),
		Tags:       rawMsgVal(row.Tags),
		IsPublic:   boolVal(row.IsPublic),
		SharedWith: rawMsgVal(row.SharedWith),
		CreatedAt:  row.CreatedAt,
		UpdatedAt:  row.UpdatedAt,
	}, nil
}

func (r *noteRepo) ListByUser(ctx context.Context, userID string, limit, offset int) ([]model.Note, error) {
	l := int64(limit)
	o := int64(offset)
	rows, err := r.q.ListUserNotes(ctx, &db.ListUserNotesParams{
		Column1: userID,
		Column2: &l,
		Column3: &o,
	})
	if err != nil {
		return nil, err
	}
	notes := make([]model.Note, len(rows))
	for i, row := range rows {
		notes[i] = model.Note{
			ID:         row.ID,
			Title:      row.Title,
			Content:    row.Content,
			AuthorID:   row.AuthorID,
			TeamID:     strPtr(row.TeamID),
			Tags:       rawMsgVal(row.Tags),
			IsPublic:   boolVal(row.IsPublic),
			SharedWith: rawMsgVal(row.SharedWith),
			CreatedAt:  row.CreatedAt,
			UpdatedAt:  row.UpdatedAt,
		}
	}
	return notes, nil
}

func (r *noteRepo) ListByTeam(ctx context.Context, teamID string, limit, offset int) ([]model.Note, error) {
	l := int64(limit)
	o := int64(offset)
	rows, err := r.q.ListTeamNotes(ctx, &db.ListTeamNotesParams{
		Column1: teamID,
		Column2: &l,
		Column3: &o,
	})
	if err != nil {
		return nil, err
	}
	notes := make([]model.Note, len(rows))
	for i, row := range rows {
		notes[i] = model.Note{
			ID:         row.ID,
			Title:      row.Title,
			Content:    row.Content,
			AuthorID:   row.AuthorID,
			TeamID:     strPtr(row.TeamID),
			Tags:       rawMsgVal(row.Tags),
			IsPublic:   boolVal(row.IsPublic),
			SharedWith: rawMsgVal(row.SharedWith),
			CreatedAt:  row.CreatedAt,
			UpdatedAt:  row.UpdatedAt,
		}
	}
	return notes, nil
}

func (r *noteRepo) SearchByUser(ctx context.Context, userID, query string, limit, offset int) ([]model.Note, error) {
	l := int64(limit)
	o := int64(offset)
	rows, err := r.q.SearchNotes(ctx, &db.SearchNotesParams{
		Column1: userID,
		Column2: query,
		Column3: &l,
		Column4: &o,
	})
	if err != nil {
		return nil, err
	}
	notes := make([]model.Note, len(rows))
	for i, row := range rows {
		notes[i] = model.Note{
			ID:         row.ID,
			Title:      row.Title,
			Content:    row.Content,
			AuthorID:   row.AuthorID,
			TeamID:     strPtr(row.TeamID),
			Tags:       rawMsgVal(row.Tags),
			IsPublic:   boolVal(row.IsPublic),
			SharedWith: rawMsgVal(row.SharedWith),
			CreatedAt:  row.CreatedAt,
			UpdatedAt:  row.UpdatedAt,
		}
	}
	return notes, nil
}

func (r *noteRepo) SearchByTeam(ctx context.Context, teamID, query string, limit, offset int) ([]model.Note, error) {
	l := int64(limit)
	o := int64(offset)
	rows, err := r.q.SearchTeamNotes(ctx, &db.SearchTeamNotesParams{
		Column1: teamID,
		Column2: query,
		Column3: &l,
		Column4: &o,
	})
	if err != nil {
		return nil, err
	}
	notes := make([]model.Note, len(rows))
	for i, row := range rows {
		notes[i] = model.Note{
			ID:         row.ID,
			Title:      row.Title,
			Content:    row.Content,
			AuthorID:   row.AuthorID,
			TeamID:     strPtr(row.TeamID),
			Tags:       rawMsgVal(row.Tags),
			IsPublic:   boolVal(row.IsPublic),
			SharedWith: rawMsgVal(row.SharedWith),
			CreatedAt:  row.CreatedAt,
			UpdatedAt:  row.UpdatedAt,
		}
	}
	return notes, nil
}

// ponytail: COALESCE params are non-null string in generated code; empty string = "set to empty"
func (r *noteRepo) Update(ctx context.Context, id string, title, content *string, tags json.RawMessage, isPublic *bool, sharedWith json.RawMessage, teamID *string) (*model.Note, error) {
	titleCol := ""
	if title != nil {
		titleCol = *title
	}
	contentCol := ""
	if content != nil {
		contentCol = *content
	}
	teamCol := ""
	if teamID != nil {
		teamCol = *teamID
	}
	row, err := r.q.UpdateNote(ctx, &db.UpdateNoteParams{
		Column1: id,
		Column2: titleCol,
		Column3: contentCol,
		Column4: jsonPtrMsg(tags),
		Column5: isPublic,
		Column6: jsonPtrMsg(sharedWith),
		Column7: teamCol,
	})
	if err != nil {
		return nil, err
	}
	return &model.Note{
		ID:         row.ID,
		Title:      row.Title,
		Content:    row.Content,
		AuthorID:   row.AuthorID,
		TeamID:     strPtr(row.TeamID),
		Tags:       rawMsgVal(row.Tags),
		IsPublic:   boolVal(row.IsPublic),
		SharedWith: rawMsgVal(row.SharedWith),
		CreatedAt:  row.CreatedAt,
		UpdatedAt:  row.UpdatedAt,
	}, nil
}

func (r *noteRepo) Delete(ctx context.Context, id string) error {
	return r.q.DeleteNote(ctx, id)
}

func (r *noteRepo) ShareToTeam(ctx context.Context, noteID, teamID string) (*model.Note, error) {
	row, err := r.q.ShareNoteToTeam(ctx, &db.ShareNoteToTeamParams{
		Column1: noteID,
		Column2: teamID,
	})
	if err != nil {
		return nil, err
	}
	return &model.Note{
		ID:         row.ID,
		Title:      row.Title,
		Content:    row.Content,
		AuthorID:   row.AuthorID,
		TeamID:     strPtr(row.TeamID),
		Tags:       rawMsgVal(row.Tags),
		IsPublic:   boolVal(row.IsPublic),
		SharedWith: rawMsgVal(row.SharedWith),
		CreatedAt:  row.CreatedAt,
		UpdatedAt:  row.UpdatedAt,
	}, nil
}

func (r *noteRepo) InsertLink(ctx context.Context, sourceID string, targetID *string, targetTitle string) error {
	targetCol := ""
	if targetID != nil {
		targetCol = *targetID
	}
	return r.q.InsertNoteLink(ctx, &db.InsertNoteLinkParams{
		Column1: sourceID,
		Column2: targetCol,
		Column3: targetTitle,
	})
}

func (r *noteRepo) GetLinks(ctx context.Context, noteID string) ([]model.NoteLink, error) {
	rows, err := r.q.GetNoteLinks(ctx, noteID)
	if err != nil {
		return nil, err
	}
	links := make([]model.NoteLink, len(rows))
	for i, row := range rows {
		links[i] = model.NoteLink{
			ID:           row.ID,
			SourceNoteID: row.SourceNoteID,
			TargetNoteID: strPtr(row.TargetNoteID),
			TargetTitle:  row.TargetTitle,
		}
	}
	return links, nil
}

func (r *noteRepo) GetBacklinks(ctx context.Context, noteID string) ([]model.NoteLink, error) {
	rows, err := r.q.GetBacklinks(ctx, noteID)
	if err != nil {
		return nil, err
	}
	links := make([]model.NoteLink, len(rows))
	for i, row := range rows {
		links[i] = model.NoteLink{
			ID:           row.ID,
			SourceNoteID: row.SourceNoteID,
			TargetNoteID: strPtr(row.TargetNoteID),
			TargetTitle:  row.TargetTitle,
		}
	}
	return links, nil
}

func (r *noteRepo) ResolveLinks(ctx context.Context, title, targetID string) error {
	return r.q.ResolveNoteLink(ctx, &db.ResolveNoteLinkParams{
		Column1: title,
		Column2: targetID,
	})
}

func (r *noteRepo) DeleteLinks(ctx context.Context, noteID string) error {
	return r.q.DeleteNoteLinks(ctx, noteID)
}

func jsonPtrMsg(v json.RawMessage) *json.RawMessage {
	if v == nil {
		return nil
	}
	return &v
}

func rawMsgVal(p *json.RawMessage) json.RawMessage {
	if p == nil {
		return nil
	}
	return *p
}

func boolVal(p *bool) bool {
	if p == nil {
		return false
	}
	return *p
}
