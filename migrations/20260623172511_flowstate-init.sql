-- FlowState initial schema (Postgres 16, InsForge)
-- Adapted from apps/mobile/Flow-state/src/lib/api/mock/schema.sql
-- 10 tables + extensions + indexes

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- users
-- =============================================================================
CREATE TABLE users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT         NOT NULL UNIQUE,
    name          TEXT         NOT NULL,
    handle        TEXT         UNIQUE,
    avatar_url    TEXT,
    role          TEXT         NOT NULL DEFAULT 'user'
                  CHECK (role IN ('user', 'mentor', 'admin')),
    password_hash TEXT,                              -- nullable: login solo Google
    verified      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- =============================================================================
-- refresh_tokens
-- =============================================================================
CREATE TABLE refresh_tokens (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash    TEXT         NOT NULL UNIQUE,      -- bcrypt hash del refresh token
    expires_at    TIMESTAMPTZ  NOT NULL,
    revoked_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX refresh_tokens_user_id_idx     ON refresh_tokens(user_id);
CREATE INDEX refresh_tokens_expires_at_idx  ON refresh_tokens(expires_at);
CREATE INDEX refresh_tokens_token_hash_idx  ON refresh_tokens(token_hash);

-- =============================================================================
-- email_verifications
-- =============================================================================
CREATE TABLE email_verifications (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash       TEXT         NOT NULL,          -- bcrypt hash del codigo de 6 digitos
    expires_at      TIMESTAMPTZ  NOT NULL,
    attempts        INT          NOT NULL DEFAULT 0,
    consumed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX email_verifications_user_id_idx ON email_verifications(user_id);
CREATE INDEX email_verifications_expires_idx ON email_verifications(expires_at);

-- =============================================================================
-- teams
-- =============================================================================
CREATE TABLE teams (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT         NOT NULL,
    slug          TEXT         NOT NULL UNIQUE,
    description   TEXT,
    owner_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX teams_owner_id_idx ON teams(owner_id);

-- =============================================================================
-- team_members
-- =============================================================================
CREATE TABLE team_members (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id     UUID         NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    role        TEXT         NOT NULL DEFAULT 'member'
                CHECK (role IN ('owner', 'mentor', 'member')),
    joined_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE(user_id, team_id)
);
CREATE INDEX team_members_user_id_idx ON team_members(user_id);
CREATE INDEX team_members_team_id_idx ON team_members(team_id);

-- =============================================================================
-- notes
-- =============================================================================
CREATE TABLE notes (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    title         TEXT         NOT NULL CHECK (char_length(title) <= 200),
    content       TEXT         NOT NULL DEFAULT '',
    author_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id       UUID         REFERENCES teams(id) ON DELETE SET NULL,
    tags          JSONB        NOT NULL DEFAULT '[]'::jsonb,
    is_public     BOOLEAN      NOT NULL DEFAULT FALSE,
    shared_with   JSONB        NOT NULL DEFAULT '[]'::jsonb,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX notes_author_id_idx     ON notes(author_id);
CREATE INDEX notes_team_id_idx        ON notes(team_id);
CREATE INDEX notes_updated_at_idx    ON notes(updated_at DESC);
CREATE INDEX notes_title_trgm_idx    ON notes USING gin (title gin_trgm_ops);
CREATE INDEX notes_content_trgm_idx  ON notes USING gin (content gin_trgm_ops);

-- =============================================================================
-- note_links
-- =============================================================================
CREATE TABLE note_links (
    id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    source_note_id  UUID    NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    target_note_id  UUID    REFERENCES notes(id) ON DELETE CASCADE,
    target_title    TEXT    NOT NULL,
    UNIQUE(source_note_id, target_title)              -- ADR-6: colapsar wikilinks
);
CREATE INDEX note_links_source_id_idx        ON note_links(source_note_id);
CREATE INDEX note_links_target_note_id_idx   ON note_links(target_note_id);
CREATE INDEX note_links_target_title_idx     ON note_links(target_title);

-- =============================================================================
-- goals
-- =============================================================================
CREATE TABLE goals (
    id            UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
    title         TEXT             NOT NULL,
    description   TEXT,
    user_id       UUID             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id       UUID             REFERENCES teams(id) ON DELETE SET NULL,
    current       DOUBLE PRECISION NOT NULL DEFAULT 0,
    target        DOUBLE PRECISION NOT NULL CHECK (target > 0),
    unit          TEXT             NOT NULL,
    deadline      DATE,
    created_at    TIMESTAMPTZ      NOT NULL DEFAULT now(),
    CHECK (current <= target)
);
CREATE INDEX goals_user_id_idx ON goals(user_id);
CREATE INDEX goals_team_id_idx ON goals(team_id);

-- =============================================================================
-- tasks
-- =============================================================================
CREATE TABLE tasks (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT         NOT NULL,
    status      TEXT         NOT NULL DEFAULT 'todo'
                CHECK (status IN ('todo', 'in_progress', 'done')),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id     UUID         REFERENCES goals(id) ON DELETE SET NULL,
    due_date    DATE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX tasks_user_id_idx   ON tasks(user_id);
CREATE INDEX tasks_goal_id_idx   ON tasks(goal_id);
CREATE INDEX tasks_due_date_idx  ON tasks(due_date);
CREATE INDEX tasks_status_idx    ON tasks(status);

-- =============================================================================
-- notifications
-- =============================================================================
CREATE TABLE notifications (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        TEXT         NOT NULL
                CHECK (type IN ('invitation', 'mention', 'task', 'reminder')),
    title       TEXT         NOT NULL,
    body        TEXT         NOT NULL,
    read        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_id_unread_idx
    ON notifications(user_id, read, created_at DESC);
CREATE INDEX notifications_type_idx ON notifications(type);
CREATE INDEX notifications_created_idx ON notifications(created_at DESC);
