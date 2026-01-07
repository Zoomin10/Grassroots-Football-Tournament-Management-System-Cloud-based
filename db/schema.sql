-- db/schema.sql
-- Grassroots Football Tournament Management System
-- Reusable schema for local + Railway Postgres

BEGIN;

-- Optional: keep everything in public schema
-- SET search_path TO public;

-- =========================
-- TOURNAMENTS
-- =========================
-- db/schema.sql
-- Canonical schema (local + Railway)

BEGIN;

CREATE TABLE IF NOT EXISTS tournaments (
  id              SERIAL PRIMARY KEY,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  year            INTEGER NOT NULL,
  gender          TEXT NOT NULL,
  age_group       TEXT NOT NULL,
  date            DATE,
  kickoff_time    TIME,
  match_length    INTEGER,
  venue           TEXT,
  pitch_league_a  TEXT,
  pitch_league_b  TEXT
);

CREATE TABLE IF NOT EXISTS leagues (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS teams (
  id            SERIAL PRIMARY KEY,
  team          TEXT NOT NULL,
  league_id     INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matches (
  id            SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  league_id     INTEGER REFERENCES leagues(id) ON DELETE SET NULL,
  home_team_id  INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id  INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  round         TEXT NOT NULL DEFAULT 'league',
  bracket       TEXT,
  home_score    INTEGER,
  away_score    INTEGER,
  played        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
