  console.log('🔥 THIS FILE IS RUNNING 🔥');
  console.log('🚀 app.js loaded');


const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

const KIT_COLOUR_OPTIONS = [
  { value: "red", label: "Red" },
  { value: "black", label: "Black" },
  { value: "white", label: "White" },
  { value: "light_blue", label: "Light Blue" },
  { value: "dark_blue", label: "Dark Blue" },
  { value: "yellow", label: "Yellow" },
  { value: "orange", label: "Orange" },
  { value: "green", label: "Green" },
  { value: "purple", label: "Purple" },
  { value: "grey", label: "Grey" },
  { value: "navy", label: "Navy" },
  { value: "maroon", label: "Maroon" },
  { value: "pink", label: "Pink" },
  { value: "brown", label: "Brown" },
  { value: "gold", label: "Gold" }
];
// Used for backend validation (fast lookups)
const KIT_COLOURS = new Set(KIT_COLOUR_OPTIONS.map(c => c.value));

function requiredTrimmedString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidEmail(email) {
  return typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function normalizeTeamIdCode(s) {
  return String(s || "").trim().toUpperCase();
}

function generateTeamIdCode(length = 10) {
  const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1
  const bytes = crypto.randomBytes(length);

  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

async function sendTeamIdEmailStub({ to, tournamentName, teamIdCode }) {
  console.log("📧 TEAM ID EMAIL (stub)");
  console.log("To:", to);
  console.log("Tournament:", tournamentName);
  console.log("Team ID:", teamIdCode);
}

function resolveKnockoutWinner(m) {
  if (m.home_score > m.away_score) return m.home_team_id;
  if (m.away_score > m.home_score) return m.away_team_id;

  if (m.decided_by_penalties) {
    return m.penalties_home > m.penalties_away
      ? m.home_team_id
      : m.away_team_id;
  }

  throw new Error('Knockout match unresolved');
}

// ----------------- DB -----------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
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
app.get("/api/tournaments/latest", async (req, res) => {
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
  const id = Number(req.params.id);
  const { home_score, away_score, penalties_home, penalties_away } = req.body;

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid match id' });
  }

  const hs = Number(home_score);
  const as = Number(away_score);

  if (!Number.isFinite(hs) || !Number.isFinite(as) || hs < 0 || as < 0) {
    return res.status(400).json({ error: 'Scores must be non-negative numbers' });
  }

  try {
    // Pull match context so we know if it's league or knockout
    const matchRes = await pool.query(
      `SELECT id, round, league_id FROM matches WHERE id = $1`,
      [id]
    );

    if (matchRes.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matchRes.rows[0];
    const isLeague = match.round === 'league' || match.league_id != null;

    let decidedByPenalties = false;
    let ph = null;
    let pa = null;

    if (!isLeague && hs === as) {
      // Knockout draw requires penalties
      if (penalties_home == null || penalties_away == null) {
        return res.status(400).json({ error: 'Knockout draw requires penalties' });
      }

      ph = Number(penalties_home);
      pa = Number(penalties_away);

      if (!Number.isFinite(ph) || !Number.isFinite(pa) || ph < 0 || pa < 0) {
        return res.status(400).json({ error: 'Penalty scores must be non-negative numbers' });
      }
      if (ph === pa) {
        return res.status(400).json({ error: 'Penalty scores cannot be equal' });
      }

      decidedByPenalties = true;
    }

    // For league OR non-draw knockout, we clear penalties to keep data clean
    await pool.query(
      `
      UPDATE matches
      SET home_score = $1,
          away_score = $2,
          penalties_home = $3,
          penalties_away = $4,
          decided_by_penalties = $5,
          played = true,
          updated_at = NOW()
      WHERE id = $6
      `,
      [hs, as, ph, pa, decidedByPenalties, id]
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
        m.decided_by_penalties,
        m.penalties_home,
        m.penalties_away,
        m.updated_at,
        m.round,
        m.bracket,
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

    /* NEW: W / D / L */
    COALESCE(SUM(
      CASE
        WHEN t.id = m.home_team_id AND m.home_score > m.away_score THEN 1
        WHEN t.id = m.away_team_id AND m.away_score > m.home_score THEN 1
        ELSE 0
      END
    ), 0) AS won,

    COALESCE(SUM(
      CASE
        WHEN m.home_score = m.away_score THEN 1
        ELSE 0
      END
    ), 0) AS drawn,

    COALESCE(SUM(
      CASE
        WHEN t.id = m.home_team_id AND m.home_score < m.away_score THEN 1
        WHEN t.id = m.away_team_id AND m.away_score < m.home_score THEN 1
        ELSE 0
      END
    ), 0) AS lost,

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

     const winners = semis.rows.map(resolveKnockoutWinner);


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

app.get("/api/tournaments/active", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, year, gender, age_group, date, kickoff_time, venue
       FROM tournaments
       WHERE date IS NULL OR date >= CURRENT_DATE
       ORDER BY
         (date IS NULL) ASC,
         date ASC,
         kickoff_time ASC NULLS LAST,
         year DESC`
    );

    const tournaments = rows.map(t => {
      const time = t.kickoff_time
        ? String(t.kickoff_time).slice(0, 5)
        : null;

      const gender = t.gender.charAt(0).toUpperCase() + t.gender.slice(1);

      return {
        ...t,
        label: `${t.year} ${t.age_group} ${gender} – ${t.venue}${time ? ` (${time})` : ""}`
      };
    });

    res.json({ tournaments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ServerError" });
  }
});

app.post("/api/registrations", async (req, res) => {
  try {
    const {
      tournamentId,
      clubName,
      teamName,
      managerName,
      email,
      phone
    } = req.body || {};

    // Validate required fields
    if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
      return res.status(400).json({ error: "ValidationError", field: "tournamentId" });
    }
    if (!requiredTrimmedString(clubName)) return res.status(400).json({ error: "ValidationError", field: "clubName" });
    if (!requiredTrimmedString(teamName)) return res.status(400).json({ error: "ValidationError", field: "teamName" });
    if (!requiredTrimmedString(managerName)) return res.status(400).json({ error: "ValidationError", field: "managerName" });
    if (!isValidEmail(email)) return res.status(400).json({ error: "ValidationError", field: "email" });
    if (!requiredTrimmedString(phone)) return res.status(400).json({ error: "ValidationError", field: "phone" });

    // Check tournament exists and is open
    const tRes = await pool.query(
       `SELECT id, year, gender, age_group, venue, date, kickoff_time
        FROM tournaments
        WHERE id = $1`,
        [tournamentId]
    );

    if (tRes.rowCount === 0) return res.status(404).json({ error: "TournamentNotFound" });

    const tournament = tRes.rows[0];
   if (tournament.date && tournament.date < new Date().toISOString().slice(0, 10)) {
  return res.status(409).json({ error: "RegistrationClosed" });
}

    // Generate unique Team ID (retry for ultra-rare collision)
    let teamIdCode = null;
    for (let i = 0; i < 5; i++) {
      const candidate = generateTeamIdCode(10);
      const exists = await pool.query(`SELECT 1 FROM registrations WHERE team_id_code = $1`, [candidate]);
      if (exists.rowCount === 0) {
        teamIdCode = candidate;
        break;
      }
    }
    if (!teamIdCode) return res.status(500).json({ error: "TeamIdGenerationFailed" });

    const ins = await pool.query(
      `INSERT INTO registrations (
        tournament_id, team_id_code,
        club_name, team_name, manager_name, manager_email, manager_phone,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,'submitted')
      RETURNING id, team_id_code`,
      [
        tournamentId,
        teamIdCode,
        clubName.trim(),
        teamName.trim(),
        managerName.trim(),
        String(email).trim(),
        phone.trim()
      ]
    );

    // Email (stub for now)
    await sendTeamIdEmailStub({
      to: String(email).trim(),
      tournamentName: `${tournament.year || ""} ${tournament.age_group || ""} ${tournament.gender || ""}`.trim() || "Tournament",
      teamIdCode
    });

    // Return Team ID immediately for UX reliability
    res.status(201).json({
      registrationId: ins.rows[0].id,
      teamIdCode: ins.rows[0].team_id_code
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ServerError" });
  }
});

app.get("/api/registrations/:teamIdCode", async (req, res) => {
  try {
    const teamIdCode = normalizeTeamIdCode(req.params.teamIdCode);

    const regRes = await pool.query(
      `SELECT r.*,
              t.year, t.gender, t.age_group, t.venue, t.date
       FROM registrations r
       JOIN tournaments t ON t.id = r.tournament_id
       WHERE r.team_id_code = $1`,
      [teamIdCode]
    );

    if (regRes.rowCount === 0) return res.status(404).json({ error: "RegistrationNotFound" });

    const registration = regRes.rows[0];

    const playersRes = await pool.query(
      `SELECT id, first_name, surname, dob
       FROM registration_players
       WHERE registration_id = $1
       ORDER BY surname, first_name`,
      [registration.id]
    );

    res.json({ registration, players: playersRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ServerError" });
  }
});

app.patch("/api/registrations/:teamIdCode", async (req, res) => {
  try {
    const teamIdCode = normalizeTeamIdCode(req.params.teamIdCode);
    const body = req.body || {};

    const regRes = await pool.query(`SELECT id FROM registrations WHERE team_id_code = $1`, [teamIdCode]);
    if (regRes.rowCount === 0) return res.status(404).json({ error: "RegistrationNotFound" });
    const regId = regRes.rows[0].id;

    // Validate kit colours if provided
    if (Object.prototype.hasOwnProperty.call(body, "kitColour1") && body.kitColour1 != null) {
      if (!KIT_COLOURS.has(String(body.kitColour1))) {
        return res.status(400).json({ error: "ValidationError", field: "kitColour1" });
      }
    }
    if (Object.prototype.hasOwnProperty.call(body, "kitColour2") && body.kitColour2 != null) {
      if (!KIT_COLOURS.has(String(body.kitColour2))) {
        return res.status(400).json({ error: "ValidationError", field: "kitColour2" });
      }
    }
    if (body.kitColour1 && body.kitColour2 && String(body.kitColour1) === String(body.kitColour2)) {
      return res.status(400).json({ error: "ValidationError", message: "Kit colours must be different" });
    }

    // Optional updates
    const mapping = [
      ["clubName", "club_name"],
      ["teamName", "team_name"],
      ["managerName", "manager_name"],
      ["email", "manager_email"],
      ["phone", "manager_phone"],
      ["assistant1Name", "assistant1_name"],
      ["assistant2Name", "assistant2_name"],
      ["kitColour1", "kit_colour_1"],
      ["kitColour2", "kit_colour_2"]
    ];

    const sets = [];
    const values = [];
    let idx = 1;

    for (const [key, col] of mapping) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        if (key === "email" && body.email != null && !isValidEmail(body.email)) {
          return res.status(400).json({ error: "ValidationError", field: "email" });
        }
        sets.push(`${col} = $${idx++}`);
        values.push(body[key] === undefined ? null : body[key]);
      }
    }

    if (sets.length === 0) return res.status(400).json({ error: "NoFieldsToUpdate" });

    values.push(regId);

    let upd;
    try {
      upd = await pool.query(
        `UPDATE registrations
         SET ${sets.join(", ")}
         WHERE id = $${idx}
         RETURNING *`,
        values
      );
    } catch (e) {
      // Catch DB constraint violations nicely (e.g. chk_different_kit_colours)
      if (e.code === "23514") {
        return res.status(400).json({ error: "ValidationError", message: "Kit colours must be different" });
      }
      if (e.code === "22P02") {
        return res.status(400).json({ error: "ValidationError", message: "Invalid enum value provided" });
      }
      throw e;
    }

    res.json({ registration: upd.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ServerError" });
  }
});

app.post("/api/registrations/:teamIdCode/players", async (req, res) => {
  try {
    const teamIdCode = normalizeTeamIdCode(req.params.teamIdCode);
    const { firstName, surname, dob } = req.body || {};

    if (!requiredTrimmedString(firstName)) return res.status(400).json({ error: "ValidationError", field: "firstName" });
    if (!requiredTrimmedString(surname)) return res.status(400).json({ error: "ValidationError", field: "surname" });
    if (!requiredTrimmedString(dob) || Number.isNaN(Date.parse(dob))) {
      return res.status(400).json({ error: "ValidationError", field: "dob" });
    }

    const regRes = await pool.query(`SELECT id FROM registrations WHERE team_id_code = $1`, [teamIdCode]);
    if (regRes.rowCount === 0) return res.status(404).json({ error: "RegistrationNotFound" });

    const ins = await pool.query(
      `INSERT INTO registration_players (registration_id, first_name, surname, dob)
       VALUES ($1, $2, $3, $4)
       RETURNING id, first_name, surname, dob`,
      [regRes.rows[0].id, firstName.trim(), surname.trim(), new Date(dob)]
    );

    res.status(201).json({ player: ins.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ServerError" });
  }
});

app.delete("/api/registrations/:teamIdCode/players/:playerId", async (req, res) => {
  try {
    const teamIdCode = normalizeTeamIdCode(req.params.teamIdCode);
    const playerId = parseInt(req.params.playerId, 10);

    if (!Number.isInteger(playerId) || playerId <= 0) {
      return res.status(400).json({ error: "ValidationError", field: "playerId" });
    }

    const regRes = await pool.query(`SELECT id FROM registrations WHERE team_id_code = $1`, [teamIdCode]);
    if (regRes.rowCount === 0) return res.status(404).json({ error: "RegistrationNotFound" });

    const del = await pool.query(
      `DELETE FROM registration_players
       WHERE id = $1 AND registration_id = $2
       RETURNING id`,
      [playerId, regRes.rows[0].id]
    );

    if (del.rowCount === 0) return res.status(404).json({ error: "PlayerNotFound" });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ServerError" });
  }
});

app.post("/api/registrations", async (req, res) => {
  try {
    const { tournamentId, clubName, teamName, managerName, email, phone } = req.body || {};

    if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
      return res.status(400).json({ error: "ValidationError", field: "tournamentId" });
    }
    if (!requiredTrimmedString(clubName)) return res.status(400).json({ error: "ValidationError", field: "clubName" });
    if (!requiredTrimmedString(teamName)) return res.status(400).json({ error: "ValidationError", field: "teamName" });
    if (!requiredTrimmedString(managerName)) return res.status(400).json({ error: "ValidationError", field: "managerName" });
    if (!isValidEmail(email)) return res.status(400).json({ error: "ValidationError", field: "email" });
    if (!requiredTrimmedString(phone)) return res.status(400).json({ error: "ValidationError", field: "phone" });

    // Tournament must exist
    const tRes = await pool.query(
      `SELECT id, year, gender, age_group, venue, date
       FROM tournaments
       WHERE id = $1`,
      [tournamentId]
    );
    if (tRes.rowCount === 0) return res.status(404).json({ error: "TournamentNotFound" });

    // Optional: block registrations if tournament clearly in the past
    const tournament = tRes.rows[0];
    if (tournament.date) {
      const todayISO = new Date().toISOString().slice(0, 10);
      if (tournament.date < todayISO) {
        return res.status(409).json({ error: "RegistrationClosed" });
      }
    }

    // Generate unique team_id_code
    let teamIdCode = null;
    for (let i = 0; i < 5; i++) {
      const candidate = generateTeamIdCode(10);
      const exists = await pool.query(`SELECT 1 FROM registrations WHERE team_id_code = $1`, [candidate]);
      if (exists.rowCount === 0) {
        teamIdCode = candidate;
        break;
      }
    }
    if (!teamIdCode) return res.status(500).json({ error: "TeamIdGenerationFailed" });

    const ins = await pool.query(
      `INSERT INTO registrations (
        tournament_id, team_id_code,
        status,
        club_name, team_name, manager_name, manager_email, manager_phone
      )
      VALUES ($1,$2,'submitted',$3,$4,$5,$6,$7)
      RETURNING id, team_id_code, status`,
      [
        tournamentId,
        teamIdCode,
        clubName.trim(),
        teamName.trim(),
        managerName.trim(),
        String(email).trim(),
        phone.trim()
      ]
    );

    // Email stub (replace later)
    await sendTeamIdEmailStub({
      to: String(email).trim(),
      tournamentName: `${tournament.year} ${tournament.age_group} ${tournament.gender}`.trim(),
      teamIdCode
    });

    res.status(201).json({
      registrationId: ins.rows[0].id,
      teamIdCode: ins.rows[0].team_id_code,
      status: ins.rows[0].status
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ServerError" });
  }
});

app.get("/api/registrations/:teamIdCode", async (req, res) => {
  try {
    const teamIdCode = normalizeTeamIdCode(req.params.teamIdCode);

    const regRes = await pool.query(
      `SELECT r.*,
              t.year, t.gender, t.age_group, t.venue, t.date, t.kickoff_time
       FROM registrations r
       JOIN tournaments t ON t.id = r.tournament_id
       WHERE r.team_id_code = $1`,
      [teamIdCode]
    );

    if (regRes.rowCount === 0) return res.status(404).json({ error: "RegistrationNotFound" });

    const registration = regRes.rows[0];

    const playersRes = await pool.query(
      `SELECT id, first_name, surname, dob
       FROM registration_players
       WHERE registration_id = $1
       ORDER BY surname, first_name`,
      [registration.id]
    );

    res.json({ registration, players: playersRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ServerError" });
  }
});

app.get("/api/kit-colours", (req, res) => {
  res.json({
    colours: KIT_COLOUR_OPTIONS,
     values: KIT_COLOUR_OPTIONS.map(c => c.value)
  });
});

app.get("/api/tournaments/:tournamentId/leagues", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tournamentId, 10);
    if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
      return res.status(400).json({ error: "ValidationError", field: "tournamentId" });
    }

    const { rows } = await pool.query(
      `SELECT id, name, tournament_id
       FROM leagues
       WHERE tournament_id = $1
       ORDER BY name ASC`,
      [tournamentId]
    );

    res.json({ leagues: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ServerError" });
  }
});

app.post("/api/registrations/:registrationId/assign-league", async (req, res) => {
  const client = await pool.connect();
  try {
    const registrationId = parseInt(req.params.registrationId, 10);
    const leagueId = parseInt(req.body?.leagueId, 10);

    if (!Number.isInteger(registrationId) || registrationId <= 0) {
      return res.status(400).json({ error: "ValidationError", field: "registrationId" });
    }
    if (!Number.isInteger(leagueId) || leagueId <= 0) {
      return res.status(400).json({ error: "ValidationError", field: "leagueId" });
    }

    await client.query("BEGIN");

    // Lock the registration row so two admins can't approve it twice
    const regRes = await client.query(
      `SELECT id, tournament_id, club_name, team_name, team_row_id, status
       FROM registrations
       WHERE id = $1
       FOR UPDATE`,
      [registrationId]
    );

    if (regRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "RegistrationNotFound" });
    }

    const reg = regRes.rows[0];

    if (reg.team_row_id) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "AlreadyAssigned", message: "This registration is already assigned to a league." });
    }

    // Ensure league exists and belongs to same tournament
    const leagueRes = await client.query(
      `SELECT id, tournament_id, name
       FROM leagues
       WHERE id = $1`,
      [leagueId]
    );

    if (leagueRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "LeagueNotFound" });
    }

    const league = leagueRes.rows[0];
    if (league.tournament_id !== reg.tournament_id) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "ValidationError", message: "League does not belong to the same tournament." });
    }

    // Create a team row.
    // teams.team is required; choose a consistent display string.
    const displayTeamName = `${reg.club_name} - ${reg.team_name}`.trim();

    const teamIns = await client.query(
      `INSERT INTO teams (team, league_id, tournament_id)
       VALUES ($1, $2, $3)
       RETURNING id, team, league_id, tournament_id`,
      [displayTeamName, league.id, reg.tournament_id]
    );

    const teamRow = teamIns.rows[0];

    // Link registration -> team row
    // Optionally update status, but only if your enum supports it.
    // We'll keep it safe: just link and leave status as-is.
    const upd = await client.query(
      `UPDATE registrations
       SET team_row_id = $1
       WHERE id = $2
       RETURNING id, team_row_id, status`,
      [teamRow.id, reg.id]
    );

    await client.query("COMMIT");

    res.json({
      ok: true,
      registration: upd.rows[0],
      team: teamRow,
      league: { id: league.id, name: league.name }
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "ServerError", message: err.message });
  } finally {
    client.release();
  }
});

app.get("/api/tournaments/:tournamentId/registered-teams", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tournamentId, 10);
    if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
      return res.status(400).json({ error: "ValidationError", field: "tournamentId" });
    }

    // ---- Web registrations (include league_name if approved) ----
  const regsRes = await pool.query(
  `SELECT
     r.id,
     r.team_row_id,
     r.club_name,
     r.team_name,
     r.manager_name,
     r.team_id_code,
     r.kit_colour_1,
     r.kit_colour_2,
     r.created_at,
     l.name AS league_name
   FROM registrations r
   LEFT JOIN teams tm ON tm.id = r.team_row_id
   LEFT JOIN leagues l ON l.id = tm.league_id
   WHERE r.tournament_id = $1
   ORDER BY r.created_at DESC`,
  [tournamentId]
);

    const linkedTeamIds = new Set(
      regsRes.rows
        .map(r => r.team_row_id)
        .filter(id => typeof id === "number")
    );

    const registrationTeams = regsRes.rows.map(r => ({
      source: "registration",
      id: `reg-${r.id}`,
      registration_id: r.id,
      team_row_id: r.team_row_id,
      team_name: r.team_name,
      club_name: r.club_name,
      team_id_code: r.team_id_code,
      manager_name: r.manager_name,
      league_name: r.league_name
    }));

    // ---- Admin teams (EXCLUDE those created from registrations) ----
    const teamsRes = await pool.query(
      `SELECT
         tm.id,
         tm.team,
         tm.league_id,
         l.name AS league_name
       FROM teams tm
       JOIN leagues l ON l.id = tm.league_id
       WHERE tm.tournament_id = $1
       ORDER BY tm.id DESC`,
      [tournamentId]
    );

    const adminTeams = teamsRes.rows
      .filter(t => !linkedTeamIds.has(t.id))   // ✅ key line: removes duplicates
      .map(t => ({
        source: "admin",
        id: `team-${t.id}`,
        registration_id: null,
        team_row_id: t.id,
        team_name: t.team,
        club_name: null,
        team_id_code: null,
        manager_name: null,
        league_name: t.league_name
      }));

    res.json({ teams: [...registrationTeams, ...adminTeams] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ServerError" });
  }
}); 





async function reloadRegisteredTeams() {
  const res = await fetch(`/api/tournaments/${selectedTournamentId}/registered-teams`);
  const data = await res.json();
  setRegisteredTeams(data.teams || []);
}




app.get("/api/tournaments/:tournamentId/registered-teams", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tournamentId, 10);
    if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
      return res.status(400).json({ error: "ValidationError", field: "tournamentId" });
    }

    // Admin teams (teams table)
    const teamsRes = await pool.query(
      `SELECT
         tm.id,
         tm.team,
         tm.league_id,
         l.name AS league_name
       FROM teams tm
       JOIN leagues l ON l.id = tm.league_id
       WHERE tm.tournament_id = $1
       ORDER BY tm.id DESC`,
      [tournamentId]
    );

    const adminTeams = teamsRes.rows.map(t => ({
      source: "admin",
      id: `team-${t.id}`,
      team_name: t.team,
      club_name: null,
      team_id_code: null,
      manager_name: null,
      registration_id: null,
      team_row_id: t.id,
      league_name: t.league_name
    }));

    // Web registrations (registrations table)
    // Join through approved team (team_row_id) to get league_name when approved
    const regsRes = await pool.query(
      `SELECT
         r.id,
         r.team_row_id,
         r.club_name,
         r.team_name,
         r.manager_name,
         r.team_id_code,
          r.kit_colour_1,
          r.kit_colour_2,
         r.created_at,
         l.name AS league_name
       FROM registrations r
       LEFT JOIN teams tm ON tm.id = r.team_row_id
       LEFT JOIN leagues l ON l.id = tm.league_id
       WHERE r.tournament_id = $1
       ORDER BY r.created_at DESC`,
      [tournamentId]
    );

    const registrationTeams = regsRes.rows.map(r => ({
      source: "registration",
      id: `reg-${r.id}`,
      team_name: r.team_name,
      club_name: r.club_name,
      team_id_code: r.team_id_code,
      manager_name: r.manager_name,
      registration_id: r.id,
      team_row_id: r.team_row_id,
      league_name: r.league_name
    }));

    res.json({ teams: [...registrationTeams, ...adminTeams] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ServerError" });
  }
});

// Get players for a registration (admin + public can use if you want)
app.get("/api/registrations/:registrationId/players", async (req, res) => {
  const { registrationId } = req.params;

  try {
    const { rows } = await pool.query(
      `
      SELECT id, registration_id, first_name, surname, dob, created_at, updated_at
      FROM public.registration_players
      WHERE registration_id = $1
      ORDER BY surname, first_name, dob
      `,
      [registrationId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Failed to fetch registration players", err);
    res.status(500).json({ error: "Failed to fetch players" });
  }
});

  // ----------------- SERVER START -----------------
  // ----------------- FRONTEND (Vite build) -----------------
const clientDistPath = path.join(__dirname, "client", "dist");
app.use(express.static(clientDistPath));

// SPA fallback (Express 5 safe) — do NOT catch /api
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});