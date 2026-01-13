-- db/reset.sql
-- Drops and recreates the entire schema for the app

BEGIN;

-- Drop in dependency order
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS leagues CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;

-- =========================
-- TOURNAMENTS
-- =========================
CREATE TABLE tournaments (
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

-- =========================
-- LEAGUES
-- =========================
CREATE TABLE leagues (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE INDEX idx_leagues_tournament_id ON leagues(tournament_id);

-- =========================
-- TEAMS
-- =========================
CREATE TABLE teams (
  id            SERIAL PRIMARY KEY,
  team          TEXT NOT NULL,
  league_id     INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE INDEX idx_teams_tournament_id ON teams(tournament_id);
CREATE INDEX idx_teams_league_id ON teams(league_id);

-- =========================
-- MATCHES
-- =========================
CREATE TABLE matches (
  id            SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  league_id     INTEGER REFERENCES leagues(id) ON DELETE SET NULL,
  home_team_id  INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id  INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  round         TEXT NOT NULL DEFAULT 'league',  -- league / semi-final / final
  bracket       TEXT,                           -- cup / plate
  home_score    INTEGER,
  away_score    INTEGER,

  decided_by_penalties BOOLEAN NOT NULL DEFAULT FALSE,
  penalties_home       INTEGER,
  penalties_away       INTEGER,

  played        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT penalties_valid CHECK (
    (penalties_home IS NULL AND penalties_away IS NULL)
    OR
    (penalties_home IS NOT NULL AND penalties_away IS NOT NULL AND penalties_home <> penalties_away)
  )
);

CREATE INDEX idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX idx_matches_league_id ON matches(league_id);
CREATE INDEX idx_matches_round ON matches(round);
CREATE INDEX idx_matches_bracket ON matches(bracket);

COMMIT;