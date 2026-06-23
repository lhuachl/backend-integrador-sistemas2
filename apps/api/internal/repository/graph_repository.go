package repository

import (
	"context"
	"flowstate/api/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type GraphRepository interface {
	GetGraphByUser(ctx context.Context, userID string) (*model.GraphData, error)
	GetGraphByTeam(ctx context.Context, teamID string) (*model.GraphData, error)
}

// ponytail: no sqlc-generated graph queries exist; uses pgxpool directly for raw SQL.
// Add sqlc queries (graph.sql) if this path gets hot.

func NewGraphRepository(pool *pgxpool.Pool) GraphRepository { return &graphRepo{pool: pool} }

type graphRepo struct{ pool *pgxpool.Pool }

func (r *graphRepo) GetGraphByUser(ctx context.Context, userID string) (*model.GraphData, error) {
	nodes, err := r.queryGraphNodes(ctx, "SELECT id, title AS label, 'note' AS type FROM notes WHERE author_id = $1", userID)
	if err != nil {
		return nil, err
	}
	edges, err := r.queryGraphEdges(ctx, `SELECT nl.source_note_id AS source, COALESCE(nl.target_note_id::text, '') AS target, nl.target_title AS label FROM note_links nl JOIN notes n ON nl.source_note_id = n.id WHERE n.author_id = $1`, userID)
	if err != nil {
		return nil, err
	}
	return &model.GraphData{Nodes: nodes, Edges: edges}, nil
}

func (r *graphRepo) GetGraphByTeam(ctx context.Context, teamID string) (*model.GraphData, error) {
	nodes, err := r.queryGraphNodes(ctx, "SELECT id, title AS label, 'note' AS type FROM notes WHERE team_id = $1", teamID)
	if err != nil {
		return nil, err
	}
	edges, err := r.queryGraphEdges(ctx, `SELECT nl.source_note_id AS source, COALESCE(nl.target_note_id::text, '') AS target, nl.target_title AS label FROM note_links nl JOIN notes n ON nl.source_note_id = n.id WHERE n.team_id = $1`, teamID)
	if err != nil {
		return nil, err
	}
	return &model.GraphData{Nodes: nodes, Edges: edges}, nil
}

func (r *graphRepo) queryGraphNodes(ctx context.Context, query, arg string) ([]model.GraphNode, error) {
	rows, err := r.pool.Query(ctx, query, arg)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var nodes []model.GraphNode
	for rows.Next() {
		var n model.GraphNode
		if err := rows.Scan(&n.ID, &n.Label, &n.Type); err != nil {
			return nil, err
		}
		nodes = append(nodes, n)
	}
	return nodes, rows.Err()
}

func (r *graphRepo) queryGraphEdges(ctx context.Context, query, arg string) ([]model.GraphEdge, error) {
	rows, err := r.pool.Query(ctx, query, arg)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var edges []model.GraphEdge
	for rows.Next() {
		var e model.GraphEdge
		if err := rows.Scan(&e.Source, &e.Target, &e.Label); err != nil {
			return nil, err
		}
		edges = append(edges, e)
	}
	return edges, rows.Err()
}
