-- TaskDesk schema. Run once against your Postgres database (see server/migrate.js).

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT CHECK (role IN ('csm','account_manager','both')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backfill for databases created before roles existed.
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('csm','account_manager','both'));

-- Allow the "both" role for databases created before it existed.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('csm','account_manager','both'));

CREATE TABLE IF NOT EXISTS accounts (
  id                  SERIAL PRIMARY KEY,
  name                TEXT UNIQUE NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  health              TEXT NOT NULL DEFAULT 'healthy'
                        CHECK (health IN ('healthy','neutral','at_risk','critical')),
  owner_id            INTEGER REFERENCES users(id),
  account_manager_id  INTEGER REFERENCES users(id),
  poc_name            TEXT NOT NULL DEFAULT '',
  poc_email           TEXT NOT NULL DEFAULT '',
  deal_size           NUMERIC(14,2),
  created_by          INTEGER REFERENCES users(id),
  updated_by          INTEGER REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backfill for databases created before POC fields existed.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS poc_name  TEXT NOT NULL DEFAULT '';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS poc_email TEXT NOT NULL DEFAULT '';

-- Backfill for databases created before the activity trail (updated_by) existed.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- CSM (formerly "account owner") is now optional — "Unassigned" is a valid state.
ALTER TABLE accounts ALTER COLUMN owner_id DROP NOT NULL;

-- Account Manager is now optional too.
ALTER TABLE accounts ALTER COLUMN account_manager_id DROP NOT NULL;

-- Backfill for databases created before Deal Size existed.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS deal_size NUMERIC(14,2);

CREATE TABLE IF NOT EXISTS tasks (
  id            SERIAL PRIMARY KEY,
  account_id    INTEGER NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  title         TEXT NOT NULL,
  customer      TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL DEFAULT 'AM' CHECK (category IN ('AM','CSM')),
  priority      TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High','Medium','Low')),
  stage         TEXT NOT NULL DEFAULT 'open'
                  CHECK (stage IN ('open','priority','delayed','completed','closed')),
  due_date      DATE,
  description   TEXT NOT NULL DEFAULT '',
  notes         TEXT NOT NULL DEFAULT '',
  created_by    INTEGER REFERENCES users(id),
  updated_by    INTEGER REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backfill for databases created before the activity trail (updated_by) existed.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_tasks_account ON tasks(account_id);
CREATE INDEX IF NOT EXISTS idx_tasks_stage ON tasks(stage);
CREATE INDEX IF NOT EXISTS idx_accounts_owner ON accounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_accounts_manager ON accounts(account_manager_id);

-- Password reset tokens (feature: forgot password). Raw token is emailed to the user;
-- only its SHA-256 hash is stored so a DB read alone can't be used to reset a password.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);
