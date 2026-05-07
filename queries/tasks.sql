-- name: GetTasksByUser :many
SELECT * FROM tasks WHERE user_id = $1 ORDER BY column_name, position;

-- name: GetTaskByID :one
SELECT * FROM tasks WHERE id = $1;

-- name: CreateTask :one
INSERT INTO tasks (user_id, title, description, priority, column_name, position)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateTask :one
UPDATE tasks SET
    title = $2,
    description = $3,
    status = $4,
    priority = $5,
    column_name = $6,
    estimated_minutes = $7,
    position = $8,
    updated_at = now()
WHERE id = $1
RETURNING *;

-- name: UpdateTaskPosition :exec
UPDATE tasks SET column_name = $2, position = $3, updated_at = now()
WHERE id = $1;

-- name: DeleteTask :exec
DELETE FROM tasks WHERE id = $1;

-- name: GetTasksByColumn :many
SELECT * FROM tasks WHERE user_id = $1 AND column_name = $2 ORDER BY position;

-- name: UpdateTaskColumn :exec
UPDATE tasks SET column_name = $2, updated_at = now()
WHERE id = $1;