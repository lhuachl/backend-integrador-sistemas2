-- name: GetAISessionsByUser :many
SELECT * FROM ai_sessions WHERE user_id = $1 ORDER BY created_at DESC;

-- name: CreateAISession :one
INSERT INTO ai_sessions (user_id, command, input_summary, output_summary)
VALUES ($1, $2, $3, $4)
RETURNING *;