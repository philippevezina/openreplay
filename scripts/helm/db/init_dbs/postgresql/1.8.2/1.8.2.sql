BEGIN;
CREATE OR REPLACE FUNCTION openreplay_version()
    RETURNS text AS
$$
SELECT 'v1.8.2'
$$ LANGUAGE sql IMMUTABLE;

ALTER TABLE IF EXISTS public.tenants
    ADD COLUMN IF NOT EXISTS last_telemetry bigint NOT NULL DEFAULT CAST(EXTRACT(epoch FROM date_trunc('day', now())) * 1000 AS BIGINT);

CREATE TABLE IF NOT EXISTS sessions_notes
(
    note_id    integer generated BY DEFAULT AS IDENTITY PRIMARY KEY,
    message    text                        NOT NULL,
    created_at timestamp without time zone NOT NULL default (now() at time zone 'utc'),
    user_id    integer                     NULL REFERENCES users (user_id) ON DELETE SET NULL,
    deleted_at timestamp without time zone NULL     DEFAULT NULL,
    tag        text                        NULL,
    session_id bigint                      NOT NULL REFERENCES sessions (session_id) ON DELETE CASCADE,
    project_id integer                     NOT NULL REFERENCES projects (project_id) ON DELETE CASCADE,
    timestamp  integer                     NOT NULL DEFAULT -1,
    is_public  boolean                     NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS errors_tags
(
    key        text                        NOT NULL,
    value      text                        NOT NULL,
    created_at timestamp without time zone NOT NULL default (now() at time zone 'utc'),
    error_id   text                        NOT NULL REFERENCES errors (error_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS errors_tags_error_id_idx ON errors_tags (error_id);

COMMIT;