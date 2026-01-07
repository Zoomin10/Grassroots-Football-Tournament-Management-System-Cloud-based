-- db/seed.sql
-- Demo data for Grassroots Football Tournament Management System

BEGIN;

-- =========================
-- TOURNAMENT
-- =========================
INSERT INTO tournaments (
  year,
  gender,
  age_group,
  date,
  kickoff_time,
  match_length,
  venue,
  pitch_league_a,
  pitch_league_b
) VALUES (
  2026,
  'Boys',
  'U10',
  '2026-06-15',
  '09:00',
  10,
  'Wichelstowe Sports Hub',
  'Pitch 1',
  'Pitch 2'
)
RETURNING id;

-- =========================
-- LEAGUES
-- =========================
INSERT INTO leagues (name, tournament_id)
SELECT 'League A', id FROM tournaments ORDER BY id DESC LIMIT 1;

INSERT INTO leagues (name, tournament_id)
SELECT 'League B', id FROM tournaments ORDER BY id DESC LIMIT 1;

-- =========================
-- TEAMS
-- =========================
-- League A
INSERT INTO teams (team, league_id, tournament_id)
SELECT team, l.id, l.tournament_id
FROM leagues l
JOIN (VALUES
  ('Swindon Lions'),
  ('Wroughton Wolves'),
  ('Highworth Hawks'),
  ('Old Town United'),
  ('Stratton Rangers'),
  ('Blunsdon Juniors'),
  ('Purton Panthers'),
  ('Wanborough Warriors')
) AS t(team)
ON l.name = 'League A'
ORDER BY l.id DESC
LIMIT 1;

-- League B
INSERT INTO teams (team, league_id, tournament_id)
SELECT team, l.id, l.tournament_id
FROM leagues l
JOIN (VALUES
  ('FC Abbey Meads'),
  ('Chiseldon Chargers'),
  ('Covingham Colts'),
  ('Shrivenham Stars'),
  ('South Marston FC'),
  ('Lawn Rovers'),
  ('Haydon Wick FC'),
  ('Dorcan Dynamos')
) AS t(team)
ON l.name = 'League B'
ORDER BY l.id DESC
LIMIT 1;

COMMIT;