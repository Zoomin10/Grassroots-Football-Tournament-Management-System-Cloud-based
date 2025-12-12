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
  const { team, logo } = req.body;
  if (!team) {
    return res.status(400).json({ error: 'Team name is required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO teams (team, logo) VALUES ($1, $2) RETURNING *',
      [team, logo || null]
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

// GET fixtures for a specific league
app.get('/api/matches', async (req, res) => {
  const leagueId = parseInt(req.query.leagueId, 10);

  if (!leagueId) {
    return res.status(400).json({ error: 'leagueId is required' });
  }

  try {
    const result = await pool.query(
      `
      SELECT 
        matches.id,
        matches.league_id,
        t1.team AS home_team,
        t2.team AS away_team,
        matches.home_score,
        matches.away_score,
        matches.played
      FROM matches
      JOIN teams t1 ON t1.id = matches.home_team_id
      JOIN teams t2 ON t2.id = matches.away_team_id
      WHERE matches.league_id = $1
      ORDER BY matches.id ASC
      `,
      [leagueId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Fetch fixtures error:', err);
    res.status(500).json({ error: 'Failed to fetch fixtures' });
  }
});


// POST create a fixture
app.post('/api/matches', async (req, res) => {
  const { home_team_id, away_team_id, leagueId } = req.body;

  try {
    await pool.query(
      `
      INSERT INTO matches (home_team_id, away_team_id, league_id, round)
      VALUES ($1, $2, $3, 'league')
      `,
      [home_team_id, away_team_id, leagueId]
    );

    res.sendStatus(201);
  } catch (err) {
    console.error('❌ Create fixture error:', err);
    res.status(500).json({ error: 'Failed to create fixture' });
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
    await pool.query('DELETE FROM matches WHERE id = $1', [id]);
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

 

// ----------------- SERVER START -----------------

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

