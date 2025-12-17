import { useEffect, useState } from "react";

import TeamList from "../TeamList";
import AddTeam from "../AddTeam";
import AddFixture from "../AddFixture";
import LeagueTable from "../LeagueTable";
import Fixtures from "../Fixtures";
import KnockoutBracket from "../KnockoutBracket";
import { formatLeague } from "../utils/formatLeague";

import "../App.css";

export default function AdminView() {
  /* =========================
     STATE
  ========================= */
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);

  const [teams, setTeams] = useState([]);
  const [league, setLeague] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [knockouts, setKnockouts] = useState([]);

  const [leagueId, setLeagueId] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [showNewTournament, setShowNewTournament] = useState(false);
  const [year, setYear] = useState(2026);
  const [gender, setGender] = useState("boys");
  const [ageGroup, setAgeGroup] = useState("U7");

  const reloadData = () => setReloadKey(k => k + 1);
  const formattedLeague = formatLeague(league);

  /* =========================
     LOAD TOURNAMENTS
  ========================= */
  useEffect(() => {
    fetch("/api/tournaments")
      .then(res => res.json())
      .then(data => {
        setTournaments(data);
        if (data.length && !selectedTournamentId) {
          setSelectedTournamentId(data[0].id);
        }
      })
      .catch(err => console.error("❌ Fetch tournaments error:", err));
  }, []);

  /* =========================
     LOAD TOURNAMENT DATA
  ========================= */
  useEffect(() => {
    if (!selectedTournamentId) {
      setTeams([]);
      setLeague([]);
      setFixtures([]);
      setKnockouts([]);
      return;
    }

    // Teams
    fetch(
      `/api/teams?leagueId=${leagueId}&tournamentId=${selectedTournamentId}`
    )
      .then(res => res.json())
      .then(setTeams)
      .catch(err => console.error("❌ Fetch teams error:", err));

    // League table
    fetch(
      `/api/league?leagueId=${leagueId}&tournamentId=${selectedTournamentId}`
    )
      .then(res => res.json())
      .then(setLeague)
      .catch(err => console.error("❌ Fetch league error:", err));

    // League fixtures
    fetch(
      `/api/matches?leagueId=${leagueId}&tournamentId=${selectedTournamentId}`
    )
      .then(res => res.json())
      .then(setFixtures)
      .catch(err => console.error("❌ Fetch fixtures error:", err));

    // Knockouts
    Promise.all([
      fetch(
        `/api/matches?round=semi-final&tournamentId=${selectedTournamentId}`
      ).then(r => r.json()),
      fetch(
        `/api/matches?round=final&tournamentId=${selectedTournamentId}`
      ).then(r => r.json())
    ])
      .then(([semis, finals]) => setKnockouts([...semis, ...finals]))
      .catch(err => console.error("❌ Fetch knockouts error:", err));

  }, [leagueId, selectedTournamentId, reloadKey]);

  /* =========================
     ACTIONS
  ========================= */
  const createTournament = async () => {
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, gender, ageGroup }),
      });

      if (!res.ok) throw new Error("Create tournament failed");

      const tournament = await res.json();
      setTournaments(prev => [...prev, tournament]);
      setSelectedTournamentId(tournament.id);
      setShowNewTournament(false);
      reloadData();
    } catch (err) {
      console.error("❌ Create tournament error:", err);
    }
  };

  const generateFixtures = async () => {
    if (!window.confirm("Auto-generate fixtures for this league?")) return;

    try {
      const res = await fetch("/api/league/generate-fixtures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leagueId,
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
    try {
      const res = await fetch(`/api/matches/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      reloadData();
    } catch (err) {
      console.error("❌ Delete fixture error:", err);
    }
  };
const resetTournamentData = async () => {
  if (!selectedTournamentId) return;

  const confirm = window.confirm(
    "⚠️ This will delete ALL fixtures and results for this tournament.\n\nTeams will be kept.\n\nContinue?"
  );

  if (!confirm) return;

  try {
    const res = await fetch("/api/admin/reset-tournament", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tournamentId: selectedTournamentId }),
    });

    if (!res.ok) throw new Error("Reset failed");

    reloadData();
  } catch (err) {
    console.error("❌ Reset tournament error:", err);
    alert("Failed to reset tournament data");
  }
};
const handleDeleteTournament = async () => {
  if (!selectedTournamentId) return;

  const tournament = tournaments.find(
    t => t.id === selectedTournamentId
  );

  const label = tournament
    ? `${tournament.year} – ${tournament.gender} ${tournament.age_group}`
    : "this tournament";

  const firstConfirm = window.confirm(
    `⚠️ This will PERMANENTLY delete:\n\n${label}\n\nAll teams, fixtures and results will be lost.\n\nContinue?`
  );

  if (!firstConfirm) return;

  const secondConfirm = window.confirm(
    "❗ FINAL WARNING ❗\n\nThis action CANNOT be undone.\n\nDelete tournament?"
  );

  if (!secondConfirm) return;

  try {
    const res = await fetch(
      `/api/tournaments/${selectedTournamentId}`,
      { method: "DELETE" }
    );

    if (!res.ok) throw new Error("Delete failed");

    // Remove tournament from local state
    setTournaments(prev =>
      prev.filter(t => t.id !== selectedTournamentId)
    );

    // Clear selection
    setSelectedTournamentId(null);

    reloadData();
  } catch (err) {
    console.error("❌ Delete tournament error:", err);
    alert("Failed to delete tournament");
  }
};

  /* =========================
     RENDER
  ========================= */
  return (
  <div className="App">

    {/* ================= HEADER ================= */}
    <header className="admin-header">
      <h1>🔐 Admin Control Panel</h1>
    </header>

    {/* ================= TOURNAMENT CONTROLS ================= */}
    <div className="admin-card tournament-actions">

      <div className="admin-group">
        <label>Select Active Tournament</label>

        <select
          value={selectedTournamentId || ""}
          onChange={e => setSelectedTournamentId(Number(e.target.value))}
        >
          <option value="" disabled>Select tournament</option>
          {tournaments.map(t => (
            <option key={t.id} value={t.id}>
              {t.year} – {t.gender} {t.age_group}
            </option>
          ))}
        </select>

        <button
          className="admin-button"
          onClick={() => setShowNewTournament(true)}
        >
          ➕ New Tournament
        </button>
      </div>

      {/* Danger zone */}
      <div className="danger-zone">
        <span className="danger-label">Tournament actions</span>

        <button
          className="admin-button danger"
          onClick={resetTournamentData}
          disabled={!selectedTournamentId}
        >
          Reset data
        </button>

        <button
          className="admin-button danger outline"
          onClick={handleDeleteTournament}
          disabled={!selectedTournamentId}
        >
          Delete tournament
        </button>
      </div>
    </div>

    {/* ================= DASHBOARD ================= */}
    <div className="dashboard-wrapper">

      {/* -------- LEFT PANEL (Teams) -------- */}
      <div className="left-panel">
        <TeamList
          teams={teams}
          onDelete={reloadData}
        />

        <AddTeam
          tournamentId={selectedTournamentId}
          leagueId={leagueId}
          onAdd={reloadData}
          disabled={!selectedTournamentId}
        />
      </div>

   
      {/* -------- RIGHT PANEL (League) -------- */}
<div className="league-column">

  {/* League card */}
  <div className="admin-card">
    <div className="admin-card-header">
      <h3>🏆 League</h3>

      <div className="league-toggle">
        <button
          className={leagueId === 1 ? "league-btn active" : "league-btn"}
          onClick={() => setLeagueId(1)}
        >
          League A
        </button>

        <button
          className={leagueId === 2 ? "league-btn active" : "league-btn"}
          onClick={() => setLeagueId(2)}
        >
          League B
        </button>
      </div>
    </div>

    <LeagueTable league={formattedLeague} />
  </div>

  {/* Auto-generate fixtures */}
  <button
    className="admin-button"
    onClick={generateFixtures}
    disabled={!selectedTournamentId}
  >
    ⚽ Auto-generate League Fixtures
  </button>

  {/* Manual add fixture */}
  <AddFixture
    leagueId={leagueId}
    tournamentId={selectedTournamentId}
    onFixturesUpdated={reloadData}
  />

  {/* Fixtures list */}
  <Fixtures
    fixtures={fixtures}
    onResultsUpdated={reloadData}
    onDelete={handleDeleteFixture}
  />
</div>
</div>




    {/* ================= KNOCKOUTS ================= */}
    <section className="knockout-stage-wrapper">
      <h2 className="knockout-stage-title">🏆 Knockout Stage</h2>

      <KnockoutBracket
        matches={knockouts}
        onDelete={handleDeleteFixture}
        onResultsUpdated={reloadData}
      />
    </section>

  </div>
);
}