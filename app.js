const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const db = require('./db'); // Make sure this connects to your PostgreSQL

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',        // <-- replace with your DB user
  host: 'localhost',
  database: 'users',   // <-- replace with your DB name
  password: 'R@ngers55',   // <-- replace with your DB password
  port: 5432,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/api/users', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        t.id,
        t.team,
        COALESCE(SUM(
          CASE 
            WHEN t.id = m.home_team_id AND m.played AND m.home_score > m.away_score THEN 3
            WHEN t.id = m.away_team_id AND m.played AND m.away_score > m.home_score THEN 3
            WHEN m.played AND (t.id = m.home_team_id OR t.id = m.away_team_id) AND m.home_score = m.away_score THEN 1
            ELSE 0
          END
        ), 0) AS points,
        COALESCE(SUM(
          CASE 
            WHEN t.id = m.home_team_id AND m.played THEN m.home_score - m.away_score
            WHEN t.id = m.away_team_id AND m.played THEN m.away_score - m.home_score
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
    console.error('❌ League table query failed:', err);
    res.status(500).send('Database error');
  }
});

app.post('/api/matches', async (req, res) => {
  const { home_team_id, away_team_id } = req.body;

  if (!home_team_id || !away_team_id || home_team_id === away_team_id) {
    return res.status(400).json({ error: 'Invalid team IDs' });
  }

  try {
    const result = await db.query(
      `INSERT INTO matches (home_team_id, away_team_id)
       VALUES ($1, $2) RETURNING *`,
      [home_team_id, away_team_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Failed to insert fixture:', err);
    res.status(500).json({ error: 'Database insert failed' });
  }
});

app.post('/api/matches/:id/result', async (req, res) => {
  const { id } = req.params;
  const { home_score, away_score } = req.body;

  try {
    await db.query(
      `UPDATE matches
       SET home_score = $1,
           away_score = $2,
           played = true
       WHERE id = $3`,
      [home_score, away_score, id]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Update result failed:', err);
    res.status(500).send('Result update failed');
  }
});

// GET /api/matches
app.get('/api/matches', async (req, res) => {
  try {
    const result = await db.query(`
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
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to fetch fixtures:', err);
    res.status(500).send('Database error');
  }
});

app.get('/api/league', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        t.team AS team,
        COUNT(*) FILTER (WHERE m.played) AS played,
        COUNT(*) FILTER (
          WHERE m.played AND 
          ((m.home_team_id = t.id AND m.home_score > m.away_score) OR 
           (m.away_team_id = t.id AND m.away_score > m.home_score))
        ) AS wins,
        COUNT(*) FILTER (
          WHERE m.played AND m.home_score = m.away_score
        ) AS draws,
        COUNT(*) FILTER (
          WHERE m.played AND 
          ((m.home_team_id = t.id AND m.home_score < m.away_score) OR 
           (m.away_team_id = t.id AND m.away_score < m.home_score))
        ) AS losses,
        SUM(
          CASE
            WHEN m.home_team_id = t.id THEN m.home_score - m.away_score
            WHEN m.away_team_id = t.id THEN m.away_score - m.home_score
            ELSE 0
          END
        ) AS goal_difference,
        SUM(
          CASE
            WHEN m.home_team_id = t.id AND m.home_score > m.away_score THEN 3
            WHEN m.away_team_id = t.id AND m.away_score > m.home_score THEN 3
            WHEN m.home_score = m.away_score THEN 1
            ELSE 0
          END
        ) AS points
      FROM teams t
      LEFT JOIN matches m ON t.id = m.home_team_id OR t.id = m.away_team_id
      WHERE m.played = true
      GROUP BY t.team
      ORDER BY points DESC, goal_difference DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('❌ League SQL error:', err);
    res.status(500).json({ error: 'Failed to fetch league table' });
  }
});





// GET all teams
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM teams');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ GET error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Delete fixtures
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM teams WHERE id = $1', [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('❌ Delete team error:', err);
    res.status(500).send('Delete failed');
  }
});

app.delete('/api/matches/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM matches WHERE id = $1', [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('❌ Delete fixture error:', err);
    res.status(500).send('Failed to delete fixture');
  }
});

// ✅ Route to get all teams
app.get('/api/teams', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM teams');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// POST a new team
app.post('/api/users', async (req, res) => {
  const { team, age } = req.body;

  if (!team) {
    return res.status(400).json({ error: 'Team name is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO teams (team, age) VALUES ($1, $2) RETURNING *',
      [team, age || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Insert Error:', err);
    res.status(500).json({ error: 'Failed to add team' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

