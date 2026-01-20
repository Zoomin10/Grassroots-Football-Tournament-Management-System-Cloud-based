import { useEffect, useState } from "react";

import TeamList from "../TeamList";
import AddTeam from "../AddTeam";
import AddFixture from "../AddFixture";
import LeagueTable from "../LeagueTable";
import Fixtures from "../Fixtures";
import KnockoutBracket from "../KnockoutBracket";
import { formatLeague } from "../utils/formatLeague";
import RegisteredTeamsList from "../RegisteredTeamsList";
import ApproveRegistration from "../ApproveRegistration";
import "../App.css";
import "../styles/admin.css";

export default function AdminView() {
  /* =========================
     STATE
  ========================= */
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);

  const [leagues, setLeagues] = useState([]);
  const [activeLeagueId, setActiveLeagueId] = useState(null);

  const [teams, setTeams] = useState([]);
  const [league, setLeague] = useState([]);

  const [fixtures, setFixtures] = useState([]);
  const [knockouts, setKnockouts] = useState([]);

  const [reloadKey, setReloadKey] = useState(0);

  const [showNewTournament, setShowNewTournament] = useState(false);
  const [year, setYear] = useState(2026);
  const [gender, setGender] = useState("boys");
  const [ageGroup, setAgeGroup] = useState("U11");
  const [tournamentDate, setTournamentDate] = useState("");
 
  const [matchLength, setMatchLength] = useState(10);
const [kickoffHour, setKickoffHour] = useState("09");
const [kickoffMinute, setKickoffMinute] = useState("00");
const kickoffTime = `${kickoffHour}:${kickoffMinute}`;
const selectedTournament = tournaments.find(
  t => t.id === selectedTournamentId
);
 const PITCHES = ["Pitch 1", "Pitch 2", "Pitch 3", "Pitch 4"];

const [pitchLeagueA, setPitchLeagueA] = useState("");
const [pitchLeagueB, setPitchLeagueB] = useState("");
const [registeredTeams, setRegisteredTeams] = useState([]);

  const reloadData = () => setReloadKey(k => k + 1);

  const formattedLeague = Array.isArray(league)
    ? formatLeague(league)
    : [];

    const reloadRegisteredTeams = async () => {
  if (!selectedTournamentId) {
    setRegisteredTeams([]);
    return;
  }

  try {
    const res = await fetch(
      `/api/tournaments/${selectedTournamentId}/registered-teams`
    );
    if (!res.ok) throw new Error("Failed to fetch registered teams");
    const data = await res.json();
    setRegisteredTeams(data.teams || []);
  } catch (err) {
    console.error("❌ Fetch registered teams error:", err);
    setRegisteredTeams([]);
  }
};



    console.log("ADMIN selectedTournamentId:", selectedTournamentId);
const [venue, setVenue] = useState("");
const VENUES = [
  "Wichelstowe Sports Hub",
  "Swindon Town Foundation Park",
  "The Deanery School",
  "The Ridgeway Leisure Center",
];



useEffect(() => {
  if (!selectedTournamentId) {
    setRegisteredTeams([]);
    return;
  }
  reloadRegisteredTeams();
}, [selectedTournamentId, reloadKey]);

  /* =========================
     LOAD TOURNAMENTS
  ========================= */
  useEffect(() => {
  fetch("/api/tournaments")
    .then(res => res.json())
    .then(data => {
      setTournaments(data);

      // ✅ auto-select most recent tournament
      if (data.length && !selectedTournamentId) {
        setSelectedTournamentId(data[0].id);
      }
    })
    .catch(err => console.error("❌ Fetch tournaments error:", err));
}, []);

useEffect(() => {
  if (!selectedTournamentId) {
    setLeagues([]);
    setRegisteredTeams([]);
    return;
  }

  // leagues for dropdowns
  fetch(`/api/tournaments/${selectedTournamentId}/leagues`)
    .then(r => r.json())
    .then(d => setLeagues(d.leagues || []))
    .catch(err => {
      console.error("❌ Fetch leagues error:", err);
      setLeagues([]);
    });

  // combined list
  reloadRegisteredTeams();
}, [selectedTournamentId]);

  /* =========================
     LOAD LEAGUES FOR TOURNAMENT
  ========================= */
  useEffect(() => {
    if (!selectedTournamentId) {
      setLeagues([]);
      setActiveLeagueId(null);
      return;
    }

    fetch(`/api/leagues?tournamentId=${selectedTournamentId}`)
      .then(res => res.json())
      .then(data => {
        setLeagues(data);
      })
      .catch(err => console.error("❌ Fetch leagues error:", err));
  }, [selectedTournamentId]);

  /* =========================
     AUTO-SELECT LEAGUE A
  ========================= */
  useEffect(() => {
    if (leagues.length > 0) {
      const leagueA = leagues.find(l => l.name === "League A");
      setActiveLeagueId(leagueA?.id ?? leagues[0].id);
    }
  }, [leagues]);

  /* =========================
     LOAD TEAMS
  ========================= */
  useEffect(() => {
    if (!selectedTournamentId) {
      setTeams([]);
      return;
    }

    fetch(`/api/teams?tournamentId=${selectedTournamentId}`)
      .then(res => res.json())
      .then(setTeams)
      .catch(err => console.error("❌ Fetch teams error:", err));
  }, [selectedTournamentId, reloadKey]);

  /* =========================
     LOAD LEAGUE DATA + FIXTURES
  ========================= */
  useEffect(() => {
    if (!selectedTournamentId || !activeLeagueId) {
      setLeague([]);
      setFixtures([]);
      setKnockouts([]);
      return;
    }

    fetch(
      `/api/league?leagueId=${activeLeagueId}&tournamentId=${selectedTournamentId}`
    )
      .then(res => res.json())
      .then(setLeague)
      .catch(err => console.error("❌ Fetch league error:", err));

    fetch(
      `/api/matches?leagueId=${activeLeagueId}&tournamentId=${selectedTournamentId}`
    )
      .then(res => res.json())
      .then(setFixtures)
      .catch(err => console.error("❌ Fetch fixtures error:", err));

    Promise.all([
      fetch(`/api/matches?round=semi-final&tournamentId=${selectedTournamentId}`).then(r => r.json()),
      fetch(`/api/matches?round=final&tournamentId=${selectedTournamentId}`).then(r => r.json())
    ])
      .then(([semis, finals]) => setKnockouts([...semis, ...finals]))
      .catch(err => console.error("❌ Fetch knockouts error:", err));

  }, [activeLeagueId, selectedTournamentId, reloadKey]);

  /* =========================
     ACTIONS
  ========================= */
  useEffect(() => {
  if (!year) return;

  // If no date picked yet OR year changed, reset date to Jan 1 of selected year
  if (!tournamentDate || !tournamentDate.startsWith(String(year))) {
    setTournamentDate(`${year}-01-01`);
  }
}, [year]);


  const createTournament = async () => {
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        year,
        gender,
        age_group: ageGroup,
        date: tournamentDate,
        kickoff_time: kickoffTime,
        match_length: matchLength,
        venue,
        pitchLeagueA,
        pitchLeagueB
}),
      });

      if (!res.ok) throw new Error("Create tournament failed");

      const tournament = await res.json();
      setTournaments(prev => [tournament, ...prev]);
      setSelectedTournamentId(tournament.id);
      setShowNewTournament(false);
      reloadData();

    } catch (err) {
      console.error("❌ Create tournament error:", err);
    }
  };

  const generateFixtures = async () => {
    if (!activeLeagueId || !selectedTournamentId) return;

    if (!window.confirm("Auto-generate fixtures for this league?")) return;

    try {
      const res = await fetch("/api/league/generate-fixtures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leagueId: activeLeagueId,
          tournamentId: selectedTournamentId
        }),
      });

      if (!res.ok) throw new Error("Generate fixtures failed");
      reloadData();
    } catch (err) {
      console.error("❌ Generate fixtures error:", err);
    }
  };

  const handleDeleteFixture = async (id) => {
  const ok = window.confirm(
    "Are you sure you want to delete this fixture?\n\nThis cannot be undone."
  );

  if (!ok) return;

  try {
    const res = await fetch(`/api/matches/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Delete failed");
    }

    reloadData();
  } catch (err) {
    console.error("❌ Delete fixture error:", err);
    alert("Failed to delete fixture. See console for details.");
  }
};


  const resetTournamentData = async () => {
  if (!selectedTournamentId) return;

  if (!window.confirm("This will delete all fixtures and results. Continue?")) return;

  try {
    const res = await fetch("/api/admin/reset-tournament", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tournamentId: selectedTournamentId }),
    });

    const text = await res.text(); // read raw response (works even if it's not JSON)
    console.log("RESET status:", res.status);
    console.log("RESET response:", text);

    if (!res.ok) throw new Error(text || "Reset failed");

    reloadData();
  } catch (err) {
    console.error("❌ Reset tournament error:", err);
    alert("Reset failed. Check console for details.");
  }
};

  const handleDeleteTournament = async () => {
    if (!selectedTournamentId) return;

    if (!window.confirm("Permanently delete this tournament?")) return;

    try {
      const res = await fetch(`/api/tournaments/${selectedTournamentId}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Delete failed");

      setTournaments(prev =>
        prev.filter(t => t.id !== selectedTournamentId)
      );
      setSelectedTournamentId(null);
    } catch (err) {
      console.error("❌ Delete tournament error:", err);
    }
  };

  const generateKnockouts = async () => {
  if (!selectedTournamentId) return;

  try {
    const res = await fetch("/api/knockout/regenerate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tournamentId: selectedTournamentId,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to generate knockout stages");
    }

    // Re-fetch all data including knockouts
    reloadData();
  } catch (err) {
    console.error(err);
    alert("Could not generate knockout stages");
  }
};
const generateFinal = async (bracket) => {
  if (!selectedTournamentId) return;

  try {
    const res = await fetch("/api/knockout/generate-final", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tournamentId: selectedTournamentId,
        bracket
      })
    });

    if (!res.ok) {
      // Not fatal — often means semis not ready yet
      return;
    }

    setReloadKey(prev => prev + 1);
  } catch (err) {
    console.error(`❌ Generate ${bracket} final error:`, err);
  }
};

const activeLeague = leagues.find(l => l.id === activeLeagueId);
const activeLeagueName = activeLeague?.name ?? "";

const handleTournamentToggle = async (field, value) => {
  if (!selectedTournamentId) return;

  // optimistic UI
  setTournaments((prev) =>
    prev.map((t) => (t.id === selectedTournamentId ? { ...t, [field]: value } : t))
  );

  try {
    const res = await fetch(`/api/tournaments/${selectedTournamentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error || "Update failed");
    }

    // sync with DB response (authoritative)
    if (data?.tournament) {
      setTournaments((prev) =>
        prev.map((t) => (t.id === selectedTournamentId ? data.tournament : t))
      );
    }
  } catch (err) {
    console.error("Failed to update tournament:", err);

    // revert
    setTournaments((prev) =>
      prev.map((t) => (t.id === selectedTournamentId ? { ...t, [field]: !value } : t))
    );

    alert("Could not save change. Please try again.");
  }
};

  /* =========================
     RENDER
  ========================= */
  return (
<div className="admin-view">
  <div className="admin-container">

    {/* Header */}
    <div className="admin-header">
      <h1>🔐 Admin Control Panel</h1>

<div className="admin-page">
<div className="tournament-actions">
  <div className="admin-tournament-content">
    <div className="admin-tournament-selector">
      <label htmlFor="admin-tournament-select">Active Tournament</label>
      <select
        id="admin-tournament-select"
        value={selectedTournamentId ?? ""}
        onChange={(e) => setSelectedTournamentId(Number(e.target.value))}
      >
        <option value="" disabled>
          Select tournament
        </option>
        {tournaments.map((t) => (
          <option key={t.id} value={t.id}>
            {t.year} – {t.gender} {t.age_group}
          </option>
        ))}
      </select>
    </div>

    {selectedTournament && (
      <div className="admin-tournament-info">
        <div className="admin-tournament-meta">
          {selectedTournament.date && (
            <span className="meta-pill">
              📅 {new Date(selectedTournament.date).toLocaleDateString("en-GB")}
            </span>
          )}
          {selectedTournament.kickoff_time && (
            <span className="meta-pill">
              ⏰ Kickoff {selectedTournament.kickoff_time.slice(0, 5)}
            </span>
          )}
          {selectedTournament.venue && (
            <span className="meta-pill">📍 {selectedTournament.venue}</span>
          )}
        </div>

        <div className="admin-tournament-leagues">
          {selectedTournament.pitch_league_a && (
            <span className="league-pill league-a">
              🟦 League A: {selectedTournament.pitch_league_a}
            </span>
          )}
          {selectedTournament.pitch_league_b && (
            <span className="league-pill league-b">
              ⬜ League B: {selectedTournament.pitch_league_b}
            </span>
          )}
        </div>
<div className="admin-tournament-flags">
  <div className="flag-control">
    <span className="flag-label">Registration open</span>
    <button
      type="button"
      className={`flag-toggle ${selectedTournament.registration_open ? "on" : "off"}`}
      onClick={() =>
        handleTournamentToggle("registration_open", !selectedTournament.registration_open)
      }
    >
      {selectedTournament.registration_open ? "On" : "Off"}
    </button>
  </div>

  <div className="flag-control">
    <span className="flag-label">Publish</span>
    <button
      type="button"
      className={`flag-toggle ${selectedTournament.published ? "on" : "off"}`}
      onClick={() =>
        handleTournamentToggle("published", !selectedTournament.published)
      }
    >
      {selectedTournament.published ? "On" : "Off"}
    </button>
  </div>
</div>
      </div>
    )}
  </div>
</div>

</div>


        {/* Admin Actions */}
        <div className="admin-actions">
          <button
            className="admin-button primary"
            onClick={() => setShowNewTournament(true)}
          >
            ➕ Create new tournament
          </button>

                <button
  className="admin-button secondary"
  onClick={() => {
    if (!selectedTournamentId) return;
    window.open(`/public?tournamentId=${selectedTournamentId}&print=true`, "_blank");
  }}
  disabled={!selectedTournamentId}
>
  🖨️ Print Public View

</button>

          <button
            className="admin-button warning"
            onClick={resetTournamentData}
            disabled={!selectedTournamentId}
          >
            ⚠️ Reset data
          </button>

          <button
            className="admin-button danger"
            onClick={handleDeleteTournament}
            disabled={!selectedTournamentId}
          >
            🗑️ Delete tournament
          </button>
        </div>
      </div>

      {/* NEW TOURNAMENT FORM */}
      {showNewTournament && (
        <div className="admin-card new-tournament-form">
          <h3>Create New Tournament</h3>

          <div className="admin-group">
            <label>Year</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
            />
          </div>

          <div className="admin-group">
            <label>Gender</label>
            <select
              value={gender}
              onChange={e => setGender(e.target.value)}
            >
              <option value="Boys">Boys</option>
              <option value="Girls">Girls</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>

          <div className="admin-group">
            <label>Age Group</label>
            <select
              value={ageGroup}
              onChange={e => setAgeGroup(e.target.value)}
            >
              {["U7","U8","U9","U10","U11","U12","U13","U14","U15","U16"].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

       <div className="admin-group">
  <label>Date</label>
 <input
  type="date"
  value={tournamentDate || ""}
  min={year ? `${year}-01-01` : undefined}
  max={year ? `${year}-12-31` : undefined}
  onChange={e => setTournamentDate(e.target.value)}
  onFocus={e => e.target.showPicker?.()}
  required
/>

</div>

 <div className="admin-group">
  <label>Kickoff Time</label>

  <div className="time-select">
    {/* Hour */}
    <select
      value={kickoffHour}
      onChange={e => setKickoffHour(e.target.value)}
    >
      {Array.from({ length: 17 }, (_, i) => {
        const hour = String(i + 6).padStart(2, "0"); // 06 → 22
        return (
          <option key={hour} value={hour}>
            {hour}
          </option>
        );
      })}
    </select>

    <span>:</span>

    {/* Minute */}
    <select
      value={kickoffMinute}
      onChange={e => setKickoffMinute(e.target.value)}
    >
      {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(
        m => (
          <option key={m} value={m}>
            {m}
          </option>
        )
      )}
    </select>
  </div>
</div>


          <div className="admin-group">
  <label>Match Length</label>
  <select
    value={matchLength}
    onChange={e => setMatchLength(Number(e.target.value))}
  >
    {Array.from({ length: 26 }, (_, i) => i + 5).map(mins => (
      <option key={mins} value={mins}>
        {mins} minutes
      </option>
    ))}
  </select>
</div>
<div className="admin-group">
  <label>Venue</label>
  <select
    value={venue}
    onChange={e => setVenue(e.target.value)}
  >
    <option value="">Select venue</option>
    {VENUES.map(v => (
      <option key={v} value={v}>
        {v}
      </option>
    ))}
  </select>
</div>
<div className="admin-group">
  <label>Pitch Allocation – League A</label>
  <select
    value={pitchLeagueA}
    onChange={e => setPitchLeagueA(e.target.value)}
  >
    <option value="">Select pitch</option>
    {PITCHES.map(p => (
      <option key={p} value={p}>{p}</option>
    ))}
  </select>
</div>

<div className="admin-group">
  <label>Pitch Allocation – League B</label>
  <select
    value={pitchLeagueB}
    onChange={e => setPitchLeagueB(e.target.value)}
  >
    <option value="">Select pitch</option>
    {PITCHES.map(p => (
      <option key={p} value={p}>{p}</option>
    ))}
  </select>
</div>

          <div className="admin-actions admin-actions--form">
  <button
    className="admin-button primary"
    onClick={createTournament}
  >
    ✅ Create Tournament
  </button>

  <button
    className="admin-button secondary"
    onClick={() => setShowNewTournament(false)}
  >
    Cancel
  </button>
</div>

        </div>
      )}

      {/* Dashboard */}
  <div className="dashboard-wrapper">
  {/* LEFT PANEL — Teams */}

  <div className="left-panel">
    <RegisteredTeamsList
  items={registeredTeams}
  leagues={leagues}
  onRefresh={reloadRegisteredTeams}
/>


    <AddTeam
      tournamentId={selectedTournamentId}
      leagues={leagues}
      onAdd={reloadData}
      disabled={!selectedTournamentId}
    />
  </div>


  {/* RIGHT PANEL — League + Fixtures */}
  <div className="league-column">
    <div className="admin-card">
      <div className="admin-card-header">
        <h3>🏆 League</h3>

        <div className="league-toggle">
          {leagues.map(l => (
            <button
              key={l.id}
             className={`league-btn ${l.id === activeLeagueId ? "active" : ""}`}
              onClick={() => setActiveLeagueId(l.id)}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>

      <LeagueTable league={formattedLeague} />
    </div>
{activeLeagueId && (
  <div className="admin-card fixtures-create-card">
 <div className="admin-card-header fixtures-create-header centered">
  <h3>
    ⚽ Fixtures Creation
    {activeLeagueName && (
      <span className="fixtures-league-label">
        — {activeLeagueName}
      </span>
    )}
  </h3>
</div>

  <div className="fixtures-create-actions">
    <button
      className="admin-button primary fixtures-btn"
      onClick={generateFixtures}
    >
        🔁 Auto-generate Fixtures (Round Robin)
    </button>

    <AddFixture
      leagueId={activeLeagueId}
      tournamentId={selectedTournamentId}
      onFixturesUpdated={reloadData}
    />
  </div>
</div>
)}

    <Fixtures
      fixtures={fixtures}
      onResultsUpdated={reloadData}
      onDelete={handleDeleteFixture}
    />
  </div>
</div>


      {/* Knockouts */}
      <section className="knockout-stage-wrapper">
        <h2 className="knockout-title">🏆 Knockout Stage 🏆</h2>

        <div className="admin-knockout-actions">
          <button
            className="admin-button primary"
            onClick={generateKnockouts}
            disabled={!selectedTournamentId}
          >
            🏆 Generate Knockout Stages
          </button>
        </div>

        <KnockoutBracket
          matches={knockouts}
          tournamentId={selectedTournamentId}
          onDelete={handleDeleteFixture}
          onResultsUpdated={reloadData}
          readOnly={false}
        />
      </section>

    </div>
  </div>
);
}