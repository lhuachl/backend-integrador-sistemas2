-- name: AddTeamMember :one
INSERT INTO team_members (id, user_id, team_id, role)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id, team_id) DO UPDATE SET role = $4
RETURNING id, user_id, team_id, role, joined_at;

-- name: GetTeamMember :one
SELECT id, user_id, team_id, role, joined_at FROM team_members WHERE user_id = $1 AND team_id = $2;

-- name: ListTeamMembers :many
SELECT id, user_id, team_id, role, joined_at FROM team_members WHERE team_id = $1 ORDER BY joined_at;

-- name: RemoveTeamMember :exec
DELETE FROM team_members WHERE user_id = $1 AND team_id = $2;
