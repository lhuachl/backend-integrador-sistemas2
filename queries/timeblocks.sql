-- name: GetTimeBlocksByUserDate :many
SELECT * FROM time_blocks WHERE user_id = $1 AND date = $2 ORDER BY start_time;

-- name: GetTimeBlocksByUser :many
SELECT * FROM time_blocks WHERE user_id = $1 ORDER BY date, start_time;

-- name: GetTimeBlockByID :one
SELECT * FROM time_blocks WHERE id = $1;

-- name: CreateTimeBlock :one
INSERT INTO time_blocks (user_id, task_id, date, start_time, end_time)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateTimeBlock :one
UPDATE time_blocks SET
    task_id = $2,
    start_time = $3,
    end_time = $4,
    completed = $5
WHERE id = $1
RETURNING *;

-- name: MarkTimeBlockCompleted :exec
UPDATE time_blocks SET completed = true WHERE id = $1;

-- name: DeleteTimeBlock :exec
DELETE FROM time_blocks WHERE id = $1;