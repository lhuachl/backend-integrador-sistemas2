-- name: GetNoteByTaskID :one
SELECT * FROM notes WHERE task_id = $1;

-- name: CreateNote :one
INSERT INTO notes (task_id, content_json)
VALUES ($1, $2)
RETURNING *;

-- name: UpdateNote :one
UPDATE notes SET content_json = $2, updated_at = now()
WHERE task_id = $1
RETURNING *;