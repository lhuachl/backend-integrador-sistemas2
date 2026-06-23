-- name: GetUserByID :one
SELECT id, email, name, COALESCE(handle, '') AS handle, COALESCE(avatar_url, '') AS avatar_url, role, COALESCE(password_hash, '') AS password_hash, verified, created_at
FROM users WHERE id = $1;

-- name: GetUserByEmail :one
SELECT id, email, name, COALESCE(handle, '') AS handle, COALESCE(avatar_url, '') AS avatar_url, role, COALESCE(password_hash, '') AS password_hash, verified, created_at
FROM users WHERE email = $1;

-- name: GetUserByHandle :one
SELECT id, email, name, COALESCE(handle, '') AS handle, COALESCE(avatar_url, '') AS avatar_url, role, COALESCE(password_hash, '') AS password_hash, verified, created_at
FROM users WHERE handle = $1;

-- name: CreateUser :one
INSERT INTO users (id, email, name, handle, avatar_url, role, password_hash, verified)
VALUES ($1, $2, $3, NULLIF($4, ''), NULLIF($5, ''), $6, NULLIF($7, ''), $8)
RETURNING id, email, name, COALESCE(handle, '') AS handle, COALESCE(avatar_url, '') AS avatar_url, role, COALESCE(password_hash, '') AS password_hash, verified, created_at;

-- name: UpdateUserProfile :one
UPDATE users
SET name = COALESCE($2, name),
    handle = COALESCE($3, handle),
    avatar_url = COALESCE($4, avatar_url)
WHERE id = $1
RETURNING id, email, name, COALESCE(handle, '') AS handle, COALESCE(avatar_url, '') AS avatar_url, role, COALESCE(password_hash, '') AS password_hash, verified, created_at;

-- name: ListUsersByIDs :many
SELECT id, email, name, COALESCE(handle, '') AS handle, COALESCE(avatar_url, '') AS avatar_url, role, COALESCE(password_hash, '') AS password_hash, verified, created_at
FROM users WHERE id = ANY($1::uuid[]);

-- name: SearchUsersByEmail :many
SELECT id, email, name, COALESCE(handle, '') AS handle, COALESCE(avatar_url, '') AS avatar_url, role, COALESCE(password_hash, '') AS password_hash, verified, created_at
FROM users WHERE email ILIKE '%' || $1 || '%' LIMIT 10;

-- name: CheckEmailExists :one
SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) AS exists;

-- name: MarkUserVerified :exec
UPDATE users SET verified = TRUE WHERE id = $1;

-- name: DeleteUser :exec
DELETE FROM users WHERE id = $1;
