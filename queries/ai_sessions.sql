-- name: GetAISessionsByUser :many
SELECT * FROM ai_sessions WHERE user_id = $1 ORDER BY created_at DESC;

-- name: CreateAISession :one
INSERT INTO ai_sessions (user_id, command, input_summary, output_summary)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetAISessionByID :one
SELECT * FROM ai_sessions WHERE id = $1;

-- name: UpdateAISession :exec
UPDATE ai_sessions
SET input_summary = $2, output_summary = $3
WHERE id = $1;

-- name: CountAISessionsByUser :one
SELECT COUNT(*) as count FROM ai_sessions WHERE user_id = $1;

-- name: GetRecentSessionsForContext :many
SELECT * FROM ai_sessions
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 5;