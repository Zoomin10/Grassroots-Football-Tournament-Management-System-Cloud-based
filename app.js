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
  password: 'password',
  port: 5432,
});

const VENUES = [
  "Wichelstowe Sports Hub",
  "Swindon Town Foundation Park",
  "The Deanery School",
  "The Ridgeway Leisure Center",
];


// ----------------- MIDDLEWARE -----------------
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// =======================
// GET all tournaments
// =======================
app.get("/api/tournaments", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM tournaments
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fetch tournaments error:", err);
    res.status(500).json({ error: "Failed to fetch tournaments" });
  }
});

// Get active tournament (latest created for now)
app.get("/api/tournaments/active", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM tournaments
      ORDER BY created_at DESC
      LIMIT 1
      `
    );

    if (result.rows.length === 0) {
      return res.json(null);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch active tournament" });
  }
});

// ===================== TEAMS ===========================
// ======================================================
app.get("/api/teams", async (req, res) => {
  try {
    const { tournamentId, leagueId } = req.query;
console.log("🧪 GET /api/teams tournamentId:", tournamentId);
    const result = await pool.query(
      `
      SELECT
        id,
        team,
        league_id,
        tournament_id
      FROM teams
      WHERE tournament_id = $1
      ORDER BY LOWER (team) ASC
      `,
      [Number(tournamentId)]
    );
console.log("🧪 GET /api/teams tournamentId:", tournamentId);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fetch teams error:", err);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});






// Get all tournaments
app.post("/api/tournaments", async (req, res) => {
  const {
    year,
    gender,
    age_group,
    date,
    kickoff_time,
    match_length,
    venue,
    pitchLeagueA,
    pitchLeagueB

  } = req.body;

  if (!year || !gender || !age_group) {
    return res.status(400).json({
      error: "Missing required fields",
      received: req.body
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO tournaments (
        year,
        gender,
        age_group,
        date,
        kickoff_time,
        match_length,
        venue,
        pitch_league_a, pitch_league_b
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
      `,
      [year, gender, age_group, date, kickoff_time, match_length, venue,  pitchLeagueA,
      pitchLeagueB]
    );

    const tournament = result.rows[0];

    // auto-create leagues
    await pool.query(
      `
      INSERT INTO leagues (name, tournament_id)
      VALUES ('League A', $1), ('League B', $1)
      `,
      [tournament.id]
    );

    res.json(tournament);
  } catch (err) {
    console.error("❌ Create tournament backend error:", err);
    res.status(500).json({ error: "Failed to create tournament" });
  }
});

// POST add team
app.post("/api/teams", async (req, res) => {
  try {
    const { team, leagueId, tournamentId } = req.body;

    console.log("POST /api/teams body:", req.body);

    if (!team || !leagueId || !tournamentId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `
      INSERT INTO teams (team, league_id, tournament_id)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [team, Number(leagueId), Number(tournamentId)]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Add team backend error:", err);
    res.status(500).json({ error: "Failed to add team" });
  }
});


// DELETE team
app.delete("/api/teams/:id", async (req, res) => {
  const teamId = req.params.id;

  try {
    // Delete matches where this team is home or away
    await pool.query(
      `
      DELETE FROM matches
      WHERE home_team_id = $1
         OR away_team_id = $1
      `,
      [teamId]
    );

    // Delete the team itself
    await pool.query(
      "DELETE FROM teams WHERE id = $1",
      [teamId]
    );

    res.sendStatus(204);
  } catch (err) {
    console.error("❌ Delete team error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});






// ==================== MATCHES ==========================
// ======================================================
// auto generate round robin fixtures
 app.post("/api/league/generate-fixtures", async (req, res) => {
  const { leagueId, tournamentId } = req.body;

  try {
    const teamsResult = await pool.query(
      `
      SELECT id
      FROM teams
      WHERE league_id = $1
        AND tournament_id = $2
      ORDER BY id
      `,
      [leagueId, tournamentId]
    );

    const teams = teamsResult.rows.map(t => t.id);

    if (teams.length < 2) {
      return res.status(400).json({ error: "Not enough teams" });
    }

    // Remove existing fixtures for this league + tournament
    await pool.query(
      `
      DELETE FROM matches
      WHERE league_id = $1
        AND tournament_id = $2
        AND round = 'league'
      `,
      [leagueId, tournamentId]
    );

    // Generate round-robin fixtures
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        await pool.query(
          `
          INSERT INTO matches
            (home_team_id, away_team_id, league_id, tournament_id, round)
          VALUES
            ($1, $2, $3, $4, 'league')
          `,
          [teams[i], teams[j], leagueId, tournamentId]
        );
      }
    }

    res.json({ success: true, fixturesCreated: (teams.length * (teams.length - 1)) / 2 });
  } catch (err) {
    console.error("❌ Generate fixtures error:", err);
    res.status(500).json({ error: "Failed to generate fixtures" });
  }
});


// GET matches (league OR knockout)
app.get("/api/matches", async (req, res) => {
  const { leagueId, tournamentId, round } = req.query;

  try {
    let query = `
      SELECT m.*, 
             ht.team AS home_team,
             at.team AS away_team
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE 1=1
    `;
    const params = [];

    if (leagueId) {
      params.push(leagueId);
      query += ` AND m.league_id = $${params.length}`;
    }

    if (tournamentId) {
      params.push(tournamentId);
      query += ` AND m.tournament_id = $${params.length}`;
    }

    if (round) {
      params.push(round);
      query += ` AND m.round = $${params.length}`;
    }

    query += " ORDER BY m.id";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fetch matches error:", err);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});


// POST league fixture
// POST league fixture
app.post("/api/matches", async (req, res) => {
  console.log("🟡 ADD MATCH BODY:", req.body);

  const {
    home_team_id,
    away_team_id,
    leagueId,
    tournamentId
  } = req.body;

  if (!home_team_id || !away_team_id || !leagueId || !tournamentId) {
    return res.status(400).json({
      error: "Missing fields",
      received: req.body
    });
  }

  try {
    // Ensure both teams exist and are in the same league
    const teams = await pool.query(
      `
      SELECT id, league_id
      FROM teams
      WHERE id IN ($1, $2)
      `,
      [home_team_id, away_team_id]
    );

    if (
      teams.rows.length !== 2 ||
      teams.rows.some(t => t.league_id !== leagueId)
    ) {
      return res.status(400).json({
        error: "Teams must be in the same league"
      });
    }

    await pool.query(
      `
      INSERT INTO matches (
        home_team_id,
        away_team_id,
        league_id,
        tournament_id,
        round
      )
      VALUES ($1, $2, $3, $4, 'league')
      `,
      [home_team_id, away_team_id, leagueId, tournamentId]
    );

      res.sendStatus(201);
 } catch (err) {
    console.error("❌ Add fixture error:", err);
    res.status(500).json({ error: "Failed to add fixture" });
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
          played = true,
           updated_at = NOW()
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

// TV latest results
app.get("/api/matches/latest", async (req, res) => {
  const limit = Number(req.query.limit) || 12;

  try {
    const result = await pool.query(
      `
      SELECT
        m.id,
        m.home_score,
        m.away_score,
        m.updated_at,
        ht.team AS home_team,
        at.team AS away_team,
        t.gender,
        t.age_group
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN tournaments t ON m.tournament_id = t.id
      WHERE m.played = true
      ORDER BY m.updated_at DESC
      LIMIT $1
      `,
      [limit]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Latest scores error:", err);
    res.status(500).json({ error: "Failed to fetch latest scores" });
  }
});


// DELETE fixture (admin)
app.delete("/api/matches/:id", async (req, res) => {
  const rawId = req.params.id;
  const id = parseInt(rawId, 10);



  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid match id" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM matches WHERE id = $1 RETURNING id",
      [id]
    );

    console.log("🧹 DELETE result:", result.rows);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Match not found" });
    }

    res.sendStatus(204);
  } catch (err) {
    console.error("❌ Delete match failed:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});


  
// ======================================================
// ================== LEAGUE TABLE =======================
// ======================================================

// api/leagues //
app.get('/api/leagues', async (req, res) => {
  const tournamentId = Number(req.query.tournamentId);

  if (!tournamentId) {
    return res.status(400).json({ error: 'tournamentId required' });
  }

  try {
    const result = await pool.query(
      `
      SELECT id, name
      FROM leagues
      WHERE tournament_id = $1
      ORDER BY name ASC
      `,
      [tournamentId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Fetch leagues error:', err);
    res.status(500).json({ error: 'Failed to fetch leagues' });
  }
});

// league //
app.get('/api/league', async (req, res) => {
  const leagueId = Number(req.query.leagueId);
  const tournamentId = Number(req.query.tournamentId);

  if (!leagueId || !tournamentId) {
    return res.status(400).json({
      error: 'leagueId and tournamentId are required'
    });
  }

  try {
    const result = await pool.query(
      `
 SELECT *
FROM (
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
  JOIN leagues l ON t.league_id = l.id
  LEFT JOIN matches m
    ON t.id IN (m.home_team_id, m.away_team_id)
    AND m.league_id = l.id
    AND m.round = 'league'
    AND m.played = true

  WHERE l.id = $1
    AND l.tournament_id = $2

  GROUP BY t.id, t.team
) league_table
ORDER BY
  points DESC,
  (goals_for - goals_against) DESC,
  goals_for DESC;
      `,
      [leagueId, tournamentId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('❌ League error:', err);
    res.status(500).json({ error: 'Failed to fetch league' });
  }
});




// REGENERATE Cup + Plate semis

// ======================================================
// ================== KNOCKOUTS ==========================
// ======================================================

// REGENERATE Cup + Plate semis (TOURNAMENT-SAFE)
app.post('/api/knockout/regenerate', async (req, res) => {
  const { tournamentId } = req.body;

  if (!tournamentId) {
    return res.status(400).json({ error: 'tournamentId required' });
  }

  try {
    // 1️⃣ Delete existing knockouts for THIS tournament only
    await pool.query(
      `
      DELETE FROM matches
      WHERE tournament_id = $1
        AND round IN ('semi-final', 'final')
      `,
      [tournamentId]
    );

      // 2️⃣ Fetch real leagues for this tournament
      const leaguesRes = await pool.query(
        `
        SELECT id, name
        FROM leagues
        WHERE tournament_id = $1
        `,
        [tournamentId]
      );

      const leagueA = leaguesRes.rows.find(l => l.name === 'League A');
      const leagueB = leaguesRes.rows.find(l => l.name === 'League B');

      if (!leagueA || !leagueB) {
        return res.status(400).json({ error: 'Leagues not found for tournament' });
      }

      // 3️⃣ Fetch top 4 teams per league
      const [A, B] = await Promise.all([
        pool.query(
          `
          SELECT id
          FROM teams
          WHERE league_id = $1 AND tournament_id = $2
          ORDER BY id
          LIMIT 4
          `,
          [leagueA.id, tournamentId]
        ),
        pool.query(
          `
          SELECT id
          FROM teams
          WHERE league_id = $1 AND tournament_id = $2
          ORDER BY id
          LIMIT 4
          `,
          [leagueB.id, tournamentId]
        )
      ]);

      if (A.rows.length < 4 || B.rows.length < 4) {
        return res.status(400).json({ error: 'Not enough teams' });
      }

      // 4️⃣ Create Cup + Plate semi-finals
      const fixtures = [
        { home: A.rows[0].id, away: B.rows[1].id, bracket: 'cup' },
        { home: B.rows[0].id, away: A.rows[1].id, bracket: 'cup' },
        { home: A.rows[2].id, away: B.rows[3].id, bracket: 'plate' },
        { home: B.rows[2].id, away: A.rows[3].id, bracket: 'plate' },
      ];

      for (const f of fixtures) {
        await pool.query(
          `
          INSERT INTO matches
            (home_team_id, away_team_id, round, bracket, tournament_id)
          VALUES
            ($1, $2, 'semi-final', $3, $4)
          `,
          [f.home, f.away, f.bracket, tournamentId]
        );
      }

      res.json({ message: 'Knockout semi-finals regenerated' });
    } catch (err) {
      console.error('❌ Regenerate error:', err);
      res.status(500).json({ error: 'Failed to regenerate knockouts' });
    }
  });

  // AUTO-GENERATE FINAL (Cup or Plate, TOURNAMENT-SAFE)
  app.post('/api/knockout/generate-final', async (req, res) => {
    const { tournamentId, bracket } = req.body;

    if (!tournamentId || !bracket) {
      return res.status(400).json({ error: 'tournamentId and bracket required' });
    }

    try {
      const semis = await pool.query(
        `
        SELECT *
        FROM matches
        WHERE tournament_id = $1
          AND round = 'semi-final'
          AND bracket = $2
          AND played = true
        `,
        [tournamentId, bracket]
      );

      if (semis.rows.length !== 2) {
        return res.status(400).json({ error: 'Both semis not complete' });
      }

      const existingFinal = await pool.query(
        `
        SELECT id
        FROM matches
        WHERE tournament_id = $1
          AND round = 'final'
          AND bracket = $2
        `,
        [tournamentId, bracket]
      );

      if (existingFinal.rows.length) {
        return res.json({ message: 'Final already exists' });
      }

      const winners = semis.rows.map(m =>
        m.home_score > m.away_score ? m.home_team_id : m.away_team_id
      );

      await pool.query(
        `
        INSERT INTO matches
          (home_team_id, away_team_id, round, bracket, tournament_id)
        VALUES
          ($1, $2, 'final', $3, $4)
        `,
        [winners[0], winners[1], bracket, tournamentId]
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
  app.post("/api/admin/reset-tournament", async (req, res) => {
    const { tournamentId } = req.body;

    if (!tournamentId) {
      return res.status(400).json({ error: "tournamentId required" });
    }

    try {
      // Delete ALL matches for this tournament (league + knockouts)
      await pool.query(
        "DELETE FROM matches WHERE tournament_id = $1",
        [tournamentId]
      );

      res.json({ message: "Tournament reset" });
    } catch (err) {
      console.error("❌ Reset tournament error:", err);
      res.status(500).json({ error: "Failed to reset tournament" });
    }
  });

  app.post('/api/admin/reset-matches', async (req, res) => {
    try {
      await pool.query('DELETE FROM matches');
      res.json({ message: 'All matches cleared' });
    } catch (err) {
      console.error('❌ Reset error:', err);
      res.status(500).json({ error: 'Failed to reset matches' });
    }
  });

  app.delete("/api/tournaments/:id", async (req, res) => {
    const tournamentId = req.params.id;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Matches
      await client.query(
        "DELETE FROM matches WHERE tournament_id = $1",
        [tournamentId]
      );

      // Teams
      await client.query(
        "DELETE FROM teams WHERE tournament_id = $1",
        [tournamentId]
      );

      // Tournament
      await client.query(
        "DELETE FROM tournaments WHERE id = $1",
        [tournamentId]
      );

      await client.query("COMMIT");
      res.sendStatus(204);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("❌ Delete tournament error:", err);
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });


  // ----------------- SERVER START -----------------
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
