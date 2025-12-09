const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = 3000;

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

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM teams WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('❌ Delete Error:', err);
    res.status(500).json({ error: 'Failed to delete team' });
  }
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

