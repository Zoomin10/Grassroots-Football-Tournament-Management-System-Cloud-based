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

// GET all fixtures
app.get('/api/matches', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        matches.id,
        t1.team AS home_team,
        t2.team AS away_team,
        matches.home_score,
        matches.away_score,
        matches.played
      FROM matches
      JOIN teams t1 ON t1.id = matches.home_team_id
      JOIN teams t2 ON t2.id = matches.away_team_id
      ORDER BY matches.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Fetch fixtures error:', err);
    res.status(500).json({ error: 'Failed to fetch fixtures' });
  }
});

// POST create a fixture
app.post('/api/matches', async (req, res) => {
  const { home_team_id, away_team_id } = req.body;

  if (!home_team_id || !away_team_id || home_team_id === away_team_id) {
    return res.status(400).json({ error: 'Invalid team IDs' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO matches (home_team_id, away_team_id)
       VALUES ($1, $2) RETURNING *`,
      [home_team_id, away_team_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Insert fixture error:', err);
    res.status(500).json({ error: 'Failed to add fixture' });
  }
});

// POST submit a match result
app.post('/api/matches/:id/result', async (req, res) => {
  const id = req.params.id;
  const { home_score, away_score } = req.body;

  try {
    await pool.query(
      `UPDATE matches
       SET home_score = $1,
           away_score = $2,
           played = true
       WHERE id = $3`,
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

app.get('/api/league', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.id,
        t.team,
        COUNT(CASE WHEN m.played = true THEN 1 END) AS games_played,
        COALESCE(SUM(
          CASE
            WHEN m.played = true AND t.id = m.home_team_id AND m.home_score > m.away_score THEN 3
            WHEN m.played = true AND t.id = m.away_team_id AND m.away_score > m.home_score THEN 3
            WHEN m.played = true AND (t.id = m.home_team_id OR t.id = m.away_team_id) AND m.home_score = m.away_score THEN 1
            ELSE 0
          END
        ), 0) AS points,
        COALESCE(SUM(
          CASE
            WHEN m.played = true AND t.id = m.home_team_id THEN m.home_score - m.away_score
            WHEN m.played = true AND t.id = m.away_team_id THEN m.away_score - m.home_score
            ELSE 0
          END
        ), 0) AS goal_difference
      FROM teams t
      LEFT JOIN matches m
        ON t.id = m.home_team_id OR t.id = m.away_team_id
      GROUP BY t.id
      ORDER BY points DESC, goal_difference DESC
    `);

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

