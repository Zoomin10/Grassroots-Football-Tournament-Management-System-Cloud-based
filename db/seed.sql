-- db/seed.sql
-- Seeds 2 demo tournaments, 5 teams per league, round-robin fixtures + results,
-- and knockouts for BOTH tournaments.
-- Tournament 1 Cup: Wroughton Youth FC (W) vs Croft FC (RU)
-- Tournament 2 Cup: Wroughton Youth FC (W) vs Bishops Cannings (RU)
-- Knockouts are idempotent: existing semis/finals removed first per tournament.

BEGIN;

-- ============================================================
-- TOURNAMENT 1: Boys U10 2026
-- ============================================================
WITH t AS (
  INSERT INTO tournaments (
    year, gender, age_group, date, kickoff_time, match_length, venue, pitch_league_a, pitch_league_b
  ) VALUES (
    2026, 'Boys', 'U10', '2026-06-15', '09:00', 10,
    'Wichelstowe Sports Hub', 'Pitch 1', 'Pitch 2'
  )
  RETURNING id
),
l AS (
  INSERT INTO leagues (name, tournament_id)
  SELECT v.name, t.id
  FROM t
  CROSS JOIN (VALUES ('League A'), ('League B')) v(name)
  RETURNING id, name, tournament_id
),
teams_to_insert AS (
  SELECT 'League A'::text AS league_name, team FROM (VALUES
    ('Wroughton Youth FC'),
    ('Bishops Cannings'),
    ('Derry Hill FC'),
    ('Develop FC'),
    ('Stratton Rangers')
  ) a(team)
  UNION ALL
  SELECT 'League B'::text AS league_name, team FROM (VALUES
    ('Croft FC'),
    ('Chippenham FC'),
    ('Abbey Meads FC'),
    ('Malmsbury'),
    ('Melksham FC')
  ) b(team)
),
ins_teams AS (
  INSERT INTO teams (team, league_id, tournament_id)
  SELECT tti.team, l.id, l.tournament_id
  FROM teams_to_insert tti
  JOIN l ON l.name = tti.league_name
  RETURNING id, team, league_id, tournament_id
),
fixtures AS (
  SELECT
    t1.tournament_id,
    t1.league_id,
    t1.id AS home_team_id,
    t2.id AS away_team_id
  FROM ins_teams t1
  JOIN ins_teams t2
    ON t1.league_id = t2.league_id
   AND t1.id < t2.id
),
seed_league_matches AS (
  INSERT INTO matches (
    home_team_id, away_team_id, league_id, tournament_id, round,
    home_score, away_score, played, updated_at
  )
  SELECT
    f.home_team_id,
    f.away_team_id,
    f.league_id,
    f.tournament_id,
    'league'::text,
    ((f.home_team_id + f.away_team_id) % 5)::int AS home_score,
    ((f.home_team_id * 2 + f.away_team_id) % 5)::int AS away_score,
    true,
    NOW()
  FROM fixtures f
  RETURNING tournament_id
),
t1 AS (SELECT id AS tournament_id FROM t),
cleanup_knockouts AS (
  DELETE FROM matches
  WHERE tournament_id = (SELECT tournament_id FROM t1)
    AND round IN ('semi-final', 'final')
  RETURNING id
),
ids AS (
  SELECT
    (SELECT it.id FROM ins_teams it WHERE it.team = 'Wroughton Youth FC' LIMIT 1) AS wroughton_id,
    (SELECT it.id FROM ins_teams it WHERE it.team = 'Croft FC' LIMIT 1) AS croft_id,

    (SELECT it.id FROM ins_teams it WHERE it.team = 'Bishops Cannings' LIMIT 1) AS bc_id,
    (SELECT it.id FROM ins_teams it WHERE it.team = 'Chippenham FC' LIMIT 1) AS chip_id,

    (SELECT it.id FROM ins_teams it WHERE it.team = 'Derry Hill FC' LIMIT 1) AS dh_id,
    (SELECT it.id FROM ins_teams it WHERE it.team = 'Abbey Meads FC' LIMIT 1) AS am_id,

    (SELECT it.id FROM ins_teams it WHERE it.team = 'Develop FC' LIMIT 1) AS dev_id,
    (SELECT it.id FROM ins_teams it WHERE it.team = 'Malmsbury' LIMIT 1) AS mal_id,

    (SELECT tournament_id FROM t1) AS tournament_id
),
insert_knockouts AS (
  INSERT INTO matches (
    home_team_id, away_team_id, tournament_id,
    round, bracket, home_score, away_score, played, updated_at
  )
  -- CUP SEMI-FINALS
  SELECT wroughton_id, bc_id, tournament_id, 'semi-final', 'cup', 3, 1, true, NOW()
  FROM ids
  UNION ALL
  SELECT croft_id, chip_id, tournament_id, 'semi-final', 'cup', 2, 0, true, NOW()
  FROM ids
  UNION ALL
  -- CUP FINAL: Wroughton Youth FC beats Croft FC
  SELECT wroughton_id, croft_id, tournament_id, 'final', 'cup', 2, 1, true, NOW()
  FROM ids
  UNION ALL
  -- PLATE SEMI-FINALS
  SELECT dh_id, am_id, tournament_id, 'semi-final', 'plate', 1, 0, true, NOW()
  FROM ids
  UNION ALL
  SELECT dev_id, mal_id, tournament_id, 'semi-final', 'plate', 0, 2, true, NOW()
  FROM ids
  UNION ALL
  -- PLATE FINAL
  SELECT dh_id, mal_id, tournament_id, 'final', 'plate', 1, 2, true, NOW()
  FROM ids
  RETURNING id
)
SELECT 1;

-- ============================================================
-- TOURNAMENT 2: Girls U12 2026
-- NOTE: Includes Wroughton Youth FC + Bishops Cannings so the scripted Cup works.
-- ============================================================
WITH t AS (
  INSERT INTO tournaments (
    year, gender, age_group, date, kickoff_time, match_length, venue, pitch_league_a, pitch_league_b
  ) VALUES (
    2026, 'Girls', 'U12', '2026-06-22', '10:00', 12,
    'Swindon Town Foundation Park', 'Pitch A', 'Pitch B'
  )
  RETURNING id
),
l AS (
  INSERT INTO leagues (name, tournament_id)
  SELECT v.name, t.id
  FROM t
  CROSS JOIN (VALUES ('League A'), ('League B')) v(name)
  RETURNING id, name, tournament_id
),
teams_to_insert AS (
  SELECT 'League A'::text AS league_name, team FROM (VALUES
    ('Wroughton Youth FC'),
    ('Swindon Stars'),
    ('Highworth Hurricanes'),
    ('Old Town Owls'),
    ('Purton Phoenix')
  ) a(team)
  UNION ALL
  SELECT 'League B'::text AS league_name, team FROM (VALUES
    ('Bishops Cannings'),
    ('Abbey Meads Angels'),
    ('Dorcan Diamonds'),
    ('Stratton Sparks'),
    ('Covingham Comets')
  ) b(team)
),
ins_teams AS (
  INSERT INTO teams (team, league_id, tournament_id)
  SELECT tti.team, l.id, l.tournament_id
  FROM teams_to_insert tti
  JOIN l ON l.name = tti.league_name
  RETURNING id, team, league_id, tournament_id
),
fixtures AS (
  SELECT
    t1.tournament_id,
    t1.league_id,
    t1.id AS home_team_id,
    t2.id AS away_team_id
  FROM ins_teams t1
  JOIN ins_teams t2
    ON t1.league_id = t2.league_id
   AND t1.id < t2.id
),
seed_league_matches AS (
  INSERT INTO matches (
    home_team_id, away_team_id, league_id, tournament_id, round,
    home_score, away_score, played, updated_at
  )
  SELECT
    f.home_team_id,
    f.away_team_id,
    f.league_id,
    f.tournament_id,
    'league'::text,
    ((f.home_team_id + 3*f.away_team_id) % 5)::int AS home_score,
    ((2*f.home_team_id + f.away_team_id) % 5)::int AS away_score,
    true,
    NOW()
  FROM fixtures f
  RETURNING tournament_id
),
t2 AS (SELECT id AS tournament_id FROM t),
cleanup_knockouts AS (
  DELETE FROM matches
  WHERE tournament_id = (SELECT tournament_id FROM t2)
    AND round IN ('semi-final', 'final')
  RETURNING id
),
ids AS (
  SELECT
    (SELECT it.id FROM ins_teams it WHERE it.team = 'Wroughton Youth FC' LIMIT 1) AS wroughton_id,
    (SELECT it.id FROM ins_teams it WHERE it.team = 'Bishops Cannings' LIMIT 1) AS bc_id,

    -- Semi opponents
    (SELECT it.id FROM ins_teams it WHERE it.team = 'Swindon Stars' LIMIT 1) AS opp1_id,
    (SELECT it.id FROM ins_teams it WHERE it.team = 'Abbey Meads Angels' LIMIT 1) AS opp2_id,

    -- Plate teams
    (SELECT it.id FROM ins_teams it WHERE it.team = 'Highworth Hurricanes' LIMIT 1) AS plate1_id,
    (SELECT it.id FROM ins_teams it WHERE it.team = 'Dorcan Diamonds' LIMIT 1) AS plate2_id,
    (SELECT it.id FROM ins_teams it WHERE it.team = 'Old Town Owls' LIMIT 1) AS plate3_id,
    (SELECT it.id FROM ins_teams it WHERE it.team = 'Covingham Comets' LIMIT 1) AS plate4_id,

    (SELECT tournament_id FROM t2) AS tournament_id
),
insert_knockouts AS (
  INSERT INTO matches (
    home_team_id, away_team_id, tournament_id,
    round, bracket, home_score, away_score, played, updated_at
  )
  -- CUP SEMI-FINALS
  SELECT wroughton_id, opp1_id, tournament_id, 'semi-final', 'cup', 2, 0, true, NOW()
  FROM ids
  UNION ALL
  SELECT bc_id, opp2_id, tournament_id, 'semi-final', 'cup', 3, 1, true, NOW()
  FROM ids
  UNION ALL
  -- CUP FINAL: Wroughton Youth FC beats Bishops Cannings
  SELECT wroughton_id, bc_id, tournament_id, 'final', 'cup', 2, 1, true, NOW()
  FROM ids
  UNION ALL
  -- PLATE SEMI-FINALS
  SELECT plate1_id, plate2_id, tournament_id, 'semi-final', 'plate', 1, 1, true, NOW()
  FROM ids
  UNION ALL
  SELECT plate3_id, plate4_id, tournament_id, 'semi-final', 'plate', 0, 2, true, NOW()
  FROM ids
  UNION ALL
  -- PLATE FINAL
  SELECT plate2_id, plate4_id, tournament_id, 'final', 'plate', 1, 2, true, NOW()
  FROM ids
  RETURNING id
)
SELECT 1;

COMMIT;