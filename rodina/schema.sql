-- Rodina: shopping lists and reminders shared by a family.
-- Times are milliseconds since the Unix epoch (UTC).
-- updated_at comes from the `clock` row, so it only ever grows; sync.php returns
-- every row with updated_at > since. Deleted rows stay as tombstones (deleted = 1)
-- so other devices learn about the deletion, and cron purges them after a while.

CREATE TABLE IF NOT EXISTS families (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    invite_code TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY,
    family_id     INTEGER NOT NULL REFERENCES families(id),
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS users_family ON users(family_id);

-- Signed-in devices. `token` holds the SHA-256 of the token the device keeps,
-- so a copy of the database does not let anyone sign in.
CREATE TABLE IF NOT EXISTS tokens (
    token      TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS tokens_user ON tokens(user_id);

-- Lists, items and reminders use ids made by the client (UUIDs), so a phone
-- can create and then edit a row while offline, before the server has seen it.
CREATE TABLE IF NOT EXISTS lists (
    id         TEXT PRIMARY KEY,
    family_id  INTEGER NOT NULL REFERENCES families(id),
    name       TEXT NOT NULL,
    sort       INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL,
    deleted    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS lists_sync ON lists(family_id, updated_at);

CREATE TABLE IF NOT EXISTS items (
    id         TEXT PRIMARY KEY,
    list_id    TEXT NOT NULL REFERENCES lists(id),
    family_id  INTEGER NOT NULL REFERENCES families(id),
    text       TEXT NOT NULL,
    qty        TEXT NOT NULL DEFAULT '',
    done       INTEGER NOT NULL DEFAULT 0,
    added_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS items_sync ON items(family_id, updated_at);
CREATE INDEX IF NOT EXISTS items_list ON items(list_id);

-- repeat: '' (once), 'daily', 'weekly', 'monthly', 'yearly'.
-- for_user: NULL = everyone in the family.
-- A repeating reminder is moved to its next due time after it is sent.
CREATE TABLE IF NOT EXISTS reminders (
    id         TEXT PRIMARY KEY,
    family_id  INTEGER NOT NULL REFERENCES families(id),
    text       TEXT NOT NULL,
    due_at     INTEGER NOT NULL,
    repeat     TEXT NOT NULL DEFAULT '',
    for_user   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    done       INTEGER NOT NULL DEFAULT 0,
    sent       INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL,
    deleted    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS reminders_sync ON reminders(family_id, updated_at);
CREATE INDEX IF NOT EXISTS reminders_due ON reminders(sent, due_at);

CREATE TABLE IF NOT EXISTS push_subs (
    id       INTEGER PRIMARY KEY,
    user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh   TEXT NOT NULL,
    auth     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS push_subs_user ON push_subs(user_id);

-- One row. `last` is the newest updated_at handed out; `purged_before` is the
-- time before which tombstones may be gone, so older cursors need a full sync.
CREATE TABLE IF NOT EXISTS clock (
    id            INTEGER PRIMARY KEY CHECK (id = 1),
    last          INTEGER NOT NULL,
    purged_before INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO clock (id, last) VALUES (1, 0);
