  console.log('🔥 THIS FILE IS RUNNING 🔥');
  console.log('🚀 app.js loaded');


const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ----------------- DB -----------------
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'users',
  password: 'R@ngers55',
  port: 5432,
});

// ----------------- MIDDLEWARE -----------------
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ======================================================
// ===================== TEAMS ===========================
// ======================================================

// GET all teams (optionally filtered by league)
app.get('/api/teams', async (req, res) => {
  const { leagueId } = req.query;

  try {
    const result = leagueId
      ? await pool.query('SELECT * FROM teams WHERE league_id = $1', [leagueId])
      : await pool.query('SELECT * FROM teams');

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Fetch teams error:', err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// POST add team
app.post('/api/teams', async (req, res) => {
  const { team, logo, leagueId } = req.body;

  if (!team || !leagueId) {
    return res.status(400).json({ error: 'Team name and leagueId required' });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO teams (team, logo, league_id)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [team, logo || null, leagueId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Insert team error:', err);
    res.status(500).json({ error: 'Failed to add team' });
  }
});

// DELETE team
app.delete('/api/teams/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM teams WHERE id = $1', [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('❌ Delete team error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ======================================================
// ==================== MATCHES ==========================
// ======================================================
// auto generate round robin fixtures
app.post("/api/league/generate-fixtures", async (req, res) => {
  const { leagueId } = req.body;

  try {
    // Get teams in this league
    const teamsResult = await pool.query(
      "SELECT id FROM teams WHERE league_id = $1 ORDER BY id",
      [leagueId]
    );

    const teams = teamsResult.rows.map(t => t.id);

    if (teams.length < 2) {
      return res.status(400).json({ error: "Not enough teams" });
    }

    // Optional safety: remove existing league fixtures
    await pool.query(
      "DELETE FROM matches WHERE league_id = $1 AND round = 'league'",
      [leagueId]
    );

    // Generate unique pairs
    const fixtures = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        fixtures.push([teams[i], teams[j]]);
      }
    }

    // Insert fixtures
    for (const [home, away] of fixtures) {
      await pool.query(
        `
        INSERT INTO matches
          (home_team_id, away_team_id, league_id, round)
        VALUES
          ($1, $2, $3, 'league')
        `,
        [home, away, leagueId]
      );
    }

    res.json({ success: true, fixturesCreated: fixtures.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate fixtures" });
  }
});


// GET matches (league OR knockout)
app.get('/api/matches', async (req, res) => {
  const { leagueId, round } = req.query;

  try {
    let query = `
      SELECT
        m.id,
        m.league_id,
        m.round,
        m.bracket,
        m.played,
        m.home_score,
        m.away_score,
        t1.team AS home_team,
        t2.team AS away_team
      FROM matches m
      JOIN teams t1 ON t1.id = m.home_team_id
      JOIN teams t2 ON t2.id = m.away_team_id
      WHERE 1=1
    `;

    const params = [];

    if (leagueId) {
      params.push(leagueId);
      query += ` AND m.league_id = $${params.length}`;
    }

    if (round) {
      params.push(round);
      query += ` AND m.round = $${params.length}`;
    }

    query += ' ORDER BY m.id ASC';

    const result = await pool.query(query, params);
    res.set('Cache-Control', 'no-store');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Fetch matches error:', err);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// POST league fixture
app.post('/api/matches', async (req, res) => {
  const { home_team_id, away_team_id, leagueId } = req.body;

  if (!home_team_id || !away_team_id || !leagueId) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const teams = await pool.query(
      'SELECT id, league_id FROM teams WHERE id IN ($1, $2)',
      [home_team_id, away_team_id]
    );

    if (
      teams.rows.length !== 2 ||
      teams.rows[0].league_id !== leagueId ||
      teams.rows[1].league_id !== leagueId
    ) {
      return res.status(400).json({ error: 'Teams must be in same league' });
    }

    await pool.query(
      `
      INSERT INTO matches (home_team_id, away_team_id, league_id, round)
      VALUES ($1, $2, $3, 'league')
      `,
      [home_team_id, away_team_id, leagueId]
    );

    res.sendStatus(201);
  } catch (err) {
    console.error('❌ Add fixture error:', err);
    res.status(500).json({ error: 'Failed to add fixture' });
  }
});

// POST submit result
app.post('/api/matches/:id/result', async (req, res) => {
  const { home_score, away_score } = req.body;

  try {
    await pool.query(
      `
      UPDATE matches
      SET home_score = $1,
          away_score = $2,
          played = true
      WHERE id = $3
      `,
      [home_score, away_score, req.params.id]
    );

    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Submit result error:', err);
    res.status(500).json({ error: 'Failed to submit result' });
  }
});

// DELETE knockout fixture (admin)
app.delete('/api/matches/:id', async (req, res) => {
  try {
    await pool.query(
      `
      DELETE FROM matches
      WHERE id = $1
        AND round IN ('semi-final', 'final')
      `,
      [req.params.id]
    );

    res.sendStatus(204);
  } catch (err) {
    console.error('❌ Delete fixture error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ======================================================
// ================== LEAGUE TABLE =======================
// ======================================================

app.get('/api/league', async (req, res) => {
  const leagueId = Number(req.query.leagueId);

  if (!leagueId) {
    return res.status(400).json({ error: 'leagueId required' });
  }

  try {
    const result = await pool.query(
      `
      SELECT
  t.id,
  t.team,
  COUNT(m.id) AS played,

  COALESCE(SUM(
    CASE
      WHEN t.id = m.home_team_id THEN m.home_score
      ELSE m.away_score
    END
  ), 0) AS goals_for,

  COALESCE(SUM(
    CASE
      WHEN t.id = m.home_team_id THEN m.away_score
      ELSE m.home_score
    END
  ), 0) AS goals_against,

  COALESCE(SUM(
    CASE
      WHEN t.id = m.home_team_id AND m.home_score > m.away_score THEN 3
      WHEN t.id = m.away_team_id AND m.away_score > m.home_score THEN 3
      WHEN m.home_score = m.away_score THEN 1
      ELSE 0
    END
  ), 0) AS points

FROM teams t
LEFT JOIN matches m
  ON t.id IN (m.home_team_id, m.away_team_id)
  AND m.league_id = $1
  AND m.round = 'league'
  AND m.played = true

WHERE t.league_id = $1
GROUP BY t.id, t.team

ORDER BY
  COALESCE(SUM(
    CASE
      WHEN t.id = m.home_team_id AND m.home_score > m.away_score THEN 3
      WHEN t.id = m.away_team_id AND m.away_score > m.home_score THEN 3
      WHEN m.home_score = m.away_score THEN 1
      ELSE 0
    END
  ), 0) DESC,

  (
    COALESCE(SUM(
      CASE
        WHEN t.id = m.home_team_id THEN m.home_score
        ELSE m.away_score
      END
    ), 0)
    -
    COALESCE(SUM(
      CASE
        WHEN t.id = m.home_team_id THEN m.away_score
        ELSE m.home_score
      END
    ), 0)
  ) DESC,

  COALESCE(SUM(
    CASE
      WHEN t.id = m.home_team_id THEN m.home_score
      ELSE m.away_score
    END
  ), 0) DESC;

      `,
      [leagueId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('❌ League error:', err);
    res.status(500).json({ error: 'Failed to fetch league' });
  }
});

// ======================================================
// ================== KNOCKOUTS ==========================
// ======================================================

// REGENERATE Cup + Plate semis
app.post('/api/knockout/regenerate', async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM matches WHERE round IN ('semi-final', 'final')`
    );

    const [A, B] = await Promise.all([
      pool.query(`SELECT id FROM teams WHERE league_id = 1 ORDER BY id LIMIT 4`),
      pool.query(`SELECT id FROM teams WHERE league_id = 2 ORDER BY id LIMIT 4`)
    ]);

    if (A.rows.length < 4 || B.rows.length < 4) {
      return res.status(400).json({ error: 'Not enough teams' });
    }

    const fixtures = [
      { home: A.rows[0].id, away: B.rows[1].id, bracket: 'cup' },
      { home: B.rows[0].id, away: A.rows[1].id, bracket: 'cup' },
      { home: A.rows[2].id, away: B.rows[3].id, bracket: 'plate' },
      { home: B.rows[2].id, away: A.rows[3].id, bracket: 'plate' },
    ];

    for (const f of fixtures) {
      await pool.query(
        `
        INSERT INTO matches (home_team_id, away_team_id, round, bracket)
        VALUES ($1, $2, 'semi-final', $3)
        `,
        [f.home, f.away, f.bracket]
      );
    }

    res.json({ message: 'Knockouts regenerated' });
  } catch (err) {
    console.error('❌ Regenerate error:', err);
    res.status(500).json({ error: 'Failed to regenerate knockouts' });
  }
});

// AUTO-GENERATE FINAL (Cup or Plate)
app.post('/api/knockout/generate-final', async (req, res) => {
  const { bracket } = req.body;

  if (!bracket) {
    return res.status(400).json({ error: 'Bracket required' });
  }

  try {
    const semis = await pool.query(
      `
      SELECT * FROM matches
      WHERE round = 'semi-final'
        AND bracket = $1
        AND played = true
      `,
      [bracket]
    );

    if (semis.rows.length !== 2) {
      return res.status(400).json({ error: 'Both semis not complete' });
    }

    const existingFinal = await pool.query(
      `
      SELECT id FROM matches
      WHERE round = 'final' AND bracket = $1
      `,
      [bracket]
    );

    if (existingFinal.rows.length) {
      return res.json({ message: 'Final already exists' });
    }

    const winners = semis.rows.map(m =>
      m.home_score > m.away_score ? m.home_team_id : m.away_team_id
    );

    await pool.query(
      `
      INSERT INTO matches (home_team_id, away_team_id, round, bracket)
      VALUES ($1, $2, 'final', $3)
      `,
      [winners[0], winners[1], bracket]
    );

    res.json({ message: `${bracket} final created` });
  } catch (err) {
    console.error('❌ Final generation error:', err);
    res.status(500).json({ error: 'Failed to generate final' });
  }
});

// ======================================================
// ================== ADMIN ==============================
// ======================================================

app.post('/api/admin/reset-matches', async (req, res) => {
  try {
    await pool.query('DELETE FROM matches');
    res.json({ message: 'All matches cleared' });
  } catch (err) {
    console.error('❌ Reset error:', err);
    res.status(500).json({ error: 'Failed to reset matches' });
  }
});

// ----------------- SERVER START -----------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
