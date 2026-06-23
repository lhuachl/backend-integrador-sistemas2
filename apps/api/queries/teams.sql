-- name: CreateTeam :one
INSERT INTO teams (id, name, slug, description, owner_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, name, slug, COALESCE(description, '') AS description, owner_id, created_at;

-- name: GetTeamByID :one
SELECT id, name, slug, COALESCE(description, '') AS description, owner_id, created_at FROM teams WHERE id = $1;

-- name: GetTeamBySlug :one
SELECT id, name, slug, COALESCE(description, '') AS description, owner_id, created_at FROM teams WHERE slug = $1;

-- name: ListTeamsByUserID :many
SELECT t.id, t.name, t.slug, COALESCE(t.description, '') AS description, t.owner_id, t.created_at
FROM teams t
JOIN team_members tm ON tm.team_id = t.id
WHERE tm.user_id = $1
ORDER BY t.created_at DESC;

-- name: DeleteTeam :exec
DELETE FROM teams WHERE id = $1;
