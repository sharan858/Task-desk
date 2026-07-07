-- TaskDesk schema. Run once against your Postgres database (see server/migrate.js).

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT CHECK (role IN ('csm','account_manager')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backfill for databases created before roles existed.
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('csm','account_manager'));

CREATE TABLE IF NOT EXISTS accounts (
  id                  SERIAL PRIMARY KEY,
  name                TEXT UNIQUE NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  health              TEXT NOT NULL DEFAULT 'healthy'
                        CHECK (health IN ('healthy','neutral','at_risk','critical')),
  owner_id            INTEGER REFERENCES users(id),
  account_manager_id  INTEGER NOT NULL REFERENCES users(id),
  poc_name            TEXT NOT NULL DEFAULT '',
  poc_email           TEXT NOT NULL DEFAULT '',
  created_by          INTEGER REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backfill for databases created before POC fields existed.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS poc_name  TEXT NOT NULL DEFAULT '';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS poc_email TEXT NOT NULL DEFAULT '';

-- CSM (formerly "account owner") is now optional — "Unassigned" is a valid state.
ALTER TABLE accounts ALTER COLUMN owner_id DROP NOT NULL;

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
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_account ON tasks(account_id);
CREATE INDEX IF NOT EXISTS idx_tasks_stage ON tasks(stage);
CREATE INDEX IF NOT EXISTS idx_accounts_owner ON accounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_accounts_manager ON accounts(account_manager_id);
