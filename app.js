console.log('🔥 THIS FILE IS RUNNING 🔥');
console.log('🚀 app.js loaded');

const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL connection (update these to match your setup)
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'users',
  password: 'R@ngers55',
  port: 5432,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ----------------- TEAM ROUTES -----------------

// GET all teams
app.get('/api/teams', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM teams');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching teams:', err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// POST a new team
app.post('/api/teams', async (req, res) => {
  console.log('POST /api/teams body:', req.body);
  const { team, logo, leagueId } = req.body;


  if (!team || !leagueId) {
    return res.status(400).json({ error: 'Team name and leagueId are required' });
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


// DELETE a team
app.delete('/api/teams/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM teams WHERE id = $1', [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('❌ Delete team error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ----------------- FIXTURE ROUTES -----------------
console.log('📌 Registering /api/matches route');
// GET fixtures (league + knockout)
app.get('/api/matches', async (req, res) => {
  const { leagueId, round } = req.query;



  try {
    let query = `
      SELECT 
        matches.id,
        matches.league_id,
        matches.round,
        t1.team AS home_team,
        t2.team AS away_team,
        matches.home_score,
        matches.away_score,
        matches.played
      FROM matches
      JOIN teams t1 ON t1.id = matches.home_team_id
      JOIN teams t2 ON t2.id = matches.away_team_id
      WHERE 1=1
    `;

    const params = [];

    if (leagueId) {
      params.push(parseInt(leagueId, 10));
      query += ` AND matches.league_id = $${params.length}`;
    }

    if (round) {
      params.push(round);
      query += ` AND matches.round = $${params.length}`;
    }

    query += ` ORDER BY matches.id ASC`;

    const result = await pool.query(query, params);
    res.set('Cache-Control', 'no-store');
    res.json(result.rows);

  } catch (err) {
    console.error('❌ Fetch fixtures error:', err);
    res.status(500).json({ error: 'Failed to fetch fixtures' });
  }
});


// POST create a fixture
app.post('/api/matches', async (req, res) => {
  const { home_team_id, away_team_id, leagueId } = req.body;

  if (!home_team_id || !away_team_id || !leagueId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 🔒 VALIDATION STEP (this is the key part)
    const teamsResult = await pool.query(
      `
      SELECT id, league_id
      FROM teams
      WHERE id IN ($1, $2)
      `,
      [home_team_id, away_team_id]
    );

    if (teamsResult.rows.length !== 2) {
      return res.status(400).json({ error: 'Invalid teams selected' });
    }

    const [home, away] = teamsResult.rows;

    if (
      home.league_id !== away.league_id ||
      home.league_id !== leagueId
    ) {
      return res
        .status(400)
        .json({ error: 'Teams must belong to the selected league' });
    }

    // ✅ INSERT ONLY AFTER VALIDATION PASSES
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



// POST submit a match result
app.post('/api/matches/:id/result', async (req, res) => {
  const id = parseInt(req.params.id, 10);
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
      [home_score, away_score, id]
    );

    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Update match result error:', err);
    res.status(500).json({ error: 'Failed to submit result' });
  }
});



// DELETE a fixture
app.delete('/api/matches/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM matches
      WHERE id = $1
      AND round = 'semi-final'
      `,
      [id]
    );

    res.sendStatus(204);
  } catch (err) {
    console.error('❌ Delete fixture error:', err);
    res.status(500).json({ error: 'Failed to delete fixture' });
  }
});


// ----------------- LEAGUE TABLE -----------------


 // ----------------- LEAGUE TABLE -----------------
app.get('/api/league', async (req, res) => {
  const leagueId = parseInt(req.query.leagueId, 10);

  if (!leagueId) {
    return res.status(400).json({ error: 'leagueId is required' });
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
        ) AS goal_difference,

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
      GROUP BY t.id
      ORDER BY
        points DESC,
        goal_difference DESC,
        goals_for DESC;
      `,
      [leagueId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('❌ League query error:', err);
    res.status(500).json({ error: 'Failed to fetch league table' });
  }
});

 app.get('/api/knockout/qualifiers', async (req, res) => {
  try {
    const leagueA = await pool.query(
      `
      SELECT id, team
      FROM (
        SELECT
          t.id,
          t.team,
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
          AND m.round = 'league'
          AND m.played = true
        WHERE t.league_id = 1
        GROUP BY t.id
      ) standings
      ORDER BY points DESC, (goals_for - goals_against) DESC, goals_for DESC
      LIMIT 4
      `
    );

    const leagueB = await pool.query(
      `
      /* same query but WHERE t.league_id = 2 */
      `
    );

    res.json({
      leagueA: leagueA.rows,
      leagueB: leagueB.rows
    });
  } catch (err) {
    console.error('❌ Knockout qualifier error:', err);
    res.status(500).json({ error: 'Failed to fetch knockout qualifiers' });
  }
});

console.log('📌 About to define knockout regenerate route');

app.post('/api/knockout/regenerate', async (req, res) => {
  console.log('🔥 Regenerate route HIT');

  try {
    // 1️⃣ Delete existing knockouts
    await pool.query(
      `DELETE FROM matches WHERE round = 'semi-final'`
    );

    // 2️⃣ Fetch top 4 from League A
    const leagueA = await pool.query(
      `
      SELECT t.id, t.team
      FROM teams t
      LEFT JOIN matches m
        ON t.id IN (m.home_team_id, m.away_team_id)
        AND m.round = 'league'
        AND m.played = true
      WHERE t.league_id = 1
      GROUP BY t.id
      ORDER BY
        COALESCE(SUM(
          CASE
            WHEN t.id = m.home_team_id AND m.home_score > m.away_score THEN 3
            WHEN t.id = m.away_team_id AND m.away_score > m.home_score THEN 3
            WHEN m.home_score = m.away_score THEN 1
            ELSE 0
          END
        ), 0) DESC,
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
        ), 0) DESC
      LIMIT 4
      `
    );

    // 3️⃣ Fetch top 4 from League B
    const leagueB = await pool.query(
      `
      SELECT t.id, t.team
      FROM teams t
      LEFT JOIN matches m
        ON t.id IN (m.home_team_id, m.away_team_id)
        AND m.round = 'league'
        AND m.played = true
      WHERE t.league_id = 2
      GROUP BY t.id
      ORDER BY
        COALESCE(SUM(
          CASE
            WHEN t.id = m.home_team_id AND m.home_score > m.away_score THEN 3
            WHEN t.id = m.away_team_id AND m.away_score > m.home_score THEN 3
            WHEN m.home_score = m.away_score THEN 1
            ELSE 0
          END
        ), 0) DESC,
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
        ), 0) DESC
      LIMIT 4
      `
    );

    if (leagueA.rows.length < 4 || leagueB.rows.length < 4) {
      return res.status(400).json({
        error: 'Not enough teams in one or both leagues'
      });
    }
console.log('League A:', leagueA);
console.log('League B:', leagueB);

    const A = leagueA.rows;
    const B = leagueB.rows;

    // 4️⃣ Build knockout fixtures
    const fixtures = [
      // Top bracket
      [A[0].id, B[1].id],
      [B[0].id, A[1].id],

      // Plate bracket
      [A[2].id, B[3].id],
      [B[2].id, A[3].id]
    ];

    // 5️⃣ Insert knockouts
    for (const [home, away] of fixtures) {
      await pool.query(
        `
        INSERT INTO matches (home_team_id, away_team_id, round)
        VALUES ($1, $2, 'semi-final')
        `,
        [home, away]
      );
    }

    res.json({ message: 'Seni-Final stage regenerated' });

  } catch (err) {
    console.error('❌ Knockout regenerate error:', err);
    res.status(500).json({ error: 'Failed to regenerate knockouts' });
  }
});
// 🔐 ADMIN: Reset all match data (keep teams)
app.post('/api/admin/reset-matches', async (req, res) => {
  try {
    await pool.query('DELETE FROM matches');

    res.json({ message: 'All match data cleared' });
  } catch (err) {
    console.error('❌ Reset matches error:', err);
    res.status(500).json({ error: 'Failed to reset matches' });
  }
});

// ----------------- SERVER START -----------------

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

