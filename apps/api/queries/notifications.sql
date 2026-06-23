-- name: CreateNotification :one
INSERT INTO notifications (user_id, type, title, body)
VALUES ($1, $2, $3, $4)
RETURNING id, user_id, type, title, body, read, created_at;

-- name: ListUserNotifications :many
SELECT id, user_id, type, title, body, read, created_at
FROM notifications WHERE user_id = $1 ORDER BY created_at DESC;

-- name: MarkNotificationRead :exec
UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2;

-- name: MarkAllNotificationsRead :exec
UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE;

-- name: MarkNotificationsReadByIDs :exec
UPDATE notifications SET read = TRUE WHERE id = ANY($1::uuid[]) AND user_id = $2;
