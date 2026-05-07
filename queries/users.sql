-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: GetUserBySupabaseID :one
SELECT * FROM users WHERE supabase_id = $1;

-- name: CreateUser :one
INSERT INTO users (email, name, password_hash, supabase_id)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: UpdateEmailConfirmed :exec
UPDATE users SET email_confirmed = true, updated_at = now()
WHERE supabase_id = $1;

-- name: UpdatePasswordHash :exec
UPDATE users SET password_hash = $2, updated_at = now()
WHERE id = $1;

-- name: CreateConfirmationToken :one
INSERT INTO confirmation_tokens (email, token, expires_at)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetConfirmationToken :one
SELECT * FROM confirmation_tokens WHERE token = $1;

-- name: MarkTokenUsed :exec
UPDATE confirmation_tokens SET used = true WHERE id = $1;

-- name: UpdateUserSupabaseID :exec
UPDATE users SET supabase_id = $2, updated_at = now()
WHERE id = $1;