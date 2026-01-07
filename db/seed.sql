-- db/seed.sql
-- Demo data for Grassroots Football Tournament Management System



BEGIN;

WITH new_tournament AS (
  INSERT INTO tournaments (
    year, gender, age_group, date, kickoff_time, match_length, venue,
    pitch_league_a, pitch_league_b
  ) VALUES (
    2026, 'Boys', 'U10', '2026-06-15', '09:00', 10,
    'Wichelstowe Sports Hub', 'Pitch 1', 'Pitch 2'
  )
  RETURNING id
),
new_leagues AS (
  INSERT INTO leagues (name, tournament_id)
  SELECT name, id
  FROM new_tournament
  CROSS JOIN (VALUES ('League A'), ('League B')) v(name)
  RETURNING id, name, tournament_id
),
teams_to_insert AS (
  SELECT 'League A'::text AS league_name, team FROM (VALUES
    ('Wroughton Youth FC'),
    ('Derry Hill FC'),
    ('Blunsdon FC'),
    ('Abbey Meads'),
    ('Stratton Juniors')
  ) a(team)

  UNION ALL

  SELECT 'League B'::text AS league_name, team FROM (VALUES
    ('Bishops Cannings'),
    ('Croft FC'),
    ('Malmsbury'),
    ('Melksham FC'),
    ('South Marston FC')
  ) b(team)
)

INSERT INTO teams (team, league_id, tournament_id)
SELECT t.team, l.id, l.tournament_id
FROM teams_to_insert t
JOIN new_leagues l ON l.name = t.league_name;

COMMIT;