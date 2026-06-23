-- name: InsertNoteLink :exec
INSERT INTO note_links (source_note_id, target_note_id, target_title)
VALUES ($1, $2, $3)
ON CONFLICT (source_note_id, target_title) DO UPDATE SET target_note_id = COALESCE($2, note_links.target_note_id);

-- name: GetNoteLinks :many
SELECT id, source_note_id, target_note_id, target_title
FROM note_links WHERE source_note_id = $1;

-- name: GetBacklinks :many
SELECT nl.id, nl.source_note_id, nl.target_note_id, nl.target_title, n.title AS source_title
FROM note_links nl
JOIN notes n ON n.id = nl.source_note_id
WHERE nl.target_note_id = $1;

-- name: GetUnresolvedLinks :many
SELECT id, source_note_id, target_note_id, target_title
FROM note_links WHERE target_note_id IS NULL;

-- name: ResolveNoteLink :exec
UPDATE note_links SET target_note_id = $2
WHERE target_title = $1 AND target_note_id IS NULL;

-- name: DeleteNoteLinks :exec
DELETE FROM note_links WHERE source_note_id = $1;
