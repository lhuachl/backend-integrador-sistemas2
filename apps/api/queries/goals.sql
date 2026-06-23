-- name: CreateGoal :one
INSERT INTO goals (title, description, user_id, team_id, current, target, unit, deadline)
VALUES ($1, $2, $3, NULLIF($4, '')::uuid, $5, $6, $7, $8::date)
RETURNING id, title, COALESCE(description, '') AS description, user_id, COALESCE(team_id::text, '') AS team_id, current, target, unit, COALESCE(to_char(deadline, 'YYYY-MM-DD'), '') AS deadline, created_at;

-- name: GetGoalByID :one
SELECT id, title, COALESCE(description, '') AS description, user_id, COALESCE(team_id::text, '') AS team_id, current, target, unit, COALESCE(to_char(deadline, 'YYYY-MM-DD'), '') AS deadline, created_at
FROM goals WHERE id = $1;

-- name: ListUserGoals :many
SELECT id, title, COALESCE(description, '') AS description, user_id, COALESCE(team_id::text, '') AS team_id, current, target, unit, COALESCE(to_char(deadline, 'YYYY-MM-DD'), '') AS deadline, created_at
FROM goals WHERE user_id = $1 ORDER BY created_at DESC;

-- name: UpdateGoal :one
UPDATE goals
SET title = COALESCE($2, title),
    description = COALESCE($3, description),
    target = COALESCE($4, target),
    unit = COALESCE($5, unit),
    deadline = COALESCE($6::date, deadline)
WHERE id = $1
RETURNING id, title, COALESCE(description, '') AS description, user_id, COALESCE(team_id::text, '') AS team_id, current, target, unit, COALESCE(to_char(deadline, 'YYYY-MM-DD'), '') AS deadline, created_at;

-- name: AddGoalProgress :one
UPDATE goals
SET current = current + $2
WHERE id = $1 AND current + $2 <= target
RETURNING id, title, COALESCE(description, '') AS description, user_id, COALESCE(team_id::text, '') AS team_id, current, target, unit, COALESCE(to_char(deadline, 'YYYY-MM-DD'), '') AS deadline, created_at;

-- name: DeleteGoal :exec
DELETE FROM goals WHERE id = $1;
