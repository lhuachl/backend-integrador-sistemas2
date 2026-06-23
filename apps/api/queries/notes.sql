-- name: CreateNote :one
INSERT INTO notes (id, title, content, author_id, team_id, tags, is_public, shared_with)
VALUES ($1, $2, $3, $4, NULLIF($5, '')::uuid, $6, $7, $8)
RETURNING id, title, content, author_id, COALESCE(team_id::text, '') AS team_id, COALESCE(tags, '[]'::jsonb) AS tags, COALESCE(is_public, false) AS is_public, COALESCE(shared_with, '[]'::jsonb) AS shared_with, created_at, updated_at;

-- name: GetNoteByID :one
SELECT id, title, content, author_id, COALESCE(team_id::text, '') AS team_id, COALESCE(tags, '[]'::jsonb) AS tags, COALESCE(is_public, false) AS is_public, COALESCE(shared_with, '[]'::jsonb) AS shared_with, created_at, updated_at
FROM notes WHERE id = $1;

-- name: ListUserNotes :many
SELECT id, title, content, author_id, COALESCE(team_id::text, '') AS team_id, COALESCE(tags, '[]'::jsonb) AS tags, COALESCE(is_public, false) AS is_public, COALESCE(shared_with, '[]'::jsonb) AS shared_with, created_at, updated_at
FROM notes WHERE author_id = $1
ORDER BY updated_at DESC LIMIT $2 OFFSET $3;

-- name: ListUserNotesByTeam :many
SELECT id, title, content, author_id, COALESCE(team_id::text, '') AS team_id, COALESCE(tags, '[]'::jsonb) AS tags, COALESCE(is_public, false) AS is_public, COALESCE(shared_with, '[]'::jsonb) AS shared_with, created_at, updated_at
FROM notes WHERE author_id = $1 AND team_id = $2
ORDER BY updated_at DESC LIMIT $3 OFFSET $4;

-- name: ListTeamNotes :many
SELECT id, title, content, author_id, COALESCE(team_id::text, '') AS team_id, COALESCE(tags, '[]'::jsonb) AS tags, COALESCE(is_public, false) AS is_public, COALESCE(shared_with, '[]'::jsonb) AS shared_with, created_at, updated_at
FROM notes WHERE team_id = $1
ORDER BY updated_at DESC LIMIT $2 OFFSET $3;

-- name: SearchNotes :many
SELECT id, title, content, author_id, COALESCE(team_id::text, '') AS team_id, COALESCE(tags, '[]'::jsonb) AS tags, COALESCE(is_public, false) AS is_public, COALESCE(shared_with, '[]'::jsonb) AS shared_with, created_at, updated_at
FROM notes
WHERE author_id = $1 AND (title ILIKE '%' || $2 || '%' OR content ILIKE '%' || $2 || '%')
ORDER BY updated_at DESC LIMIT $3 OFFSET $4;

-- name: SearchTeamNotes :many
SELECT id, title, content, author_id, COALESCE(team_id::text, '') AS team_id, COALESCE(tags, '[]'::jsonb) AS tags, COALESCE(is_public, false) AS is_public, COALESCE(shared_with, '[]'::jsonb) AS shared_with, created_at, updated_at
FROM notes
WHERE team_id = $1 AND (title ILIKE '%' || $2 || '%' OR content ILIKE '%' || $2 || '%')
ORDER BY updated_at DESC LIMIT $3 OFFSET $4;

-- name: UpdateNote :one
UPDATE notes
SET title = COALESCE($2, title),
    content = COALESCE($3, content),
    tags = COALESCE($4, tags),
    is_public = COALESCE($5, is_public),
    shared_with = COALESCE($6, shared_with),
    team_id = COALESCE(NULLIF($7, '')::uuid, team_id),
    updated_at = now()
WHERE id = $1
RETURNING id, title, content, author_id, COALESCE(team_id::text, '') AS team_id, COALESCE(tags, '[]'::jsonb) AS tags, COALESCE(is_public, false) AS is_public, COALESCE(shared_with, '[]'::jsonb) AS shared_with, created_at, updated_at;

-- name: DeleteNote :exec
DELETE FROM notes WHERE id = $1;

-- name: ShareNoteToTeam :one
UPDATE notes SET team_id = $2, updated_at = now()
WHERE id = $1
RETURNING id, title, content, author_id, COALESCE(team_id::text, '') AS team_id, COALESCE(tags, '[]'::jsonb) AS tags, COALESCE(is_public, false) AS is_public, COALESCE(shared_with, '[]'::jsonb) AS shared_with, created_at, updated_at;
