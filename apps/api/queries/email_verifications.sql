-- name: CreateEmailVerification :one
INSERT INTO email_verifications (user_id, code_hash, expires_at)
VALUES ($1, $2, $3)
RETURNING id, user_id, code_hash, expires_at, attempts, consumed_at, created_at;

-- name: GetPendingVerification :one
SELECT id, user_id, code_hash, expires_at, attempts, consumed_at, created_at
FROM email_verifications
WHERE user_id = $1 AND consumed_at IS NULL AND expires_at > now()
ORDER BY created_at DESC LIMIT 1;

-- name: IncrementAttempts :exec
UPDATE email_verifications SET attempts = attempts + 1 WHERE id = $1;

-- name: ConsumeVerification :exec
UPDATE email_verifications SET consumed_at = now() WHERE id = $1;
