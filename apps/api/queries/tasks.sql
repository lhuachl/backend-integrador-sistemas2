-- name: CreateTask :one
INSERT INTO tasks (title, status, user_id, goal_id, due_date)
VALUES ($1, $2, $3, NULLIF($4, '')::uuid, NULLIF($5, '')::date)
RETURNING id, title, status, user_id, COALESCE(goal_id::text, '') AS goal_id, COALESCE(to_char(due_date, 'YYYY-MM-DD'), '') AS due_date, created_at;

-- name: GetTaskByID :one
SELECT id, title, status, user_id, COALESCE(goal_id::text, '') AS goal_id, COALESCE(to_char(due_date, 'YYYY-MM-DD'), '') AS due_date, created_at FROM tasks WHERE id = $1;

-- name: ListUserTasks :many
SELECT id, title, status, user_id, COALESCE(goal_id::text, '') AS goal_id, COALESCE(to_char(due_date, 'YYYY-MM-DD'), '') AS due_date, created_at
FROM tasks WHERE user_id = $1 ORDER BY due_date NULLS LAST, created_at DESC;

-- name: ListUserTasksByGoal :many
SELECT id, title, status, user_id, COALESCE(goal_id::text, '') AS goal_id, COALESCE(to_char(due_date, 'YYYY-MM-DD'), '') AS due_date, created_at
FROM tasks WHERE user_id = $1 AND goal_id = $2 ORDER BY created_at DESC;

-- name: ListUserTasksByStatus :many
SELECT id, title, status, user_id, COALESCE(goal_id::text, '') AS goal_id, COALESCE(to_char(due_date, 'YYYY-MM-DD'), '') AS due_date, created_at
FROM tasks WHERE user_id = $1 AND status = $2 ORDER BY due_date NULLS LAST;

-- name: UpdateTask :one
UPDATE tasks
SET title = COALESCE($2, title),
    status = COALESCE($3, status),
    goal_id = COALESCE($4, goal_id),
    due_date = COALESCE(NULLIF($5, '')::date, due_date)
WHERE id = $1
RETURNING id, title, status, user_id, COALESCE(goal_id::text, '') AS goal_id, COALESCE(to_char(due_date, 'YYYY-MM-DD'), '') AS due_date, created_at;

-- name: DeleteTask :exec
DELETE FROM tasks WHERE id = $1;
