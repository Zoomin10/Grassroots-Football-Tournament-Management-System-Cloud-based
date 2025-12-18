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

  const reloadData = () => setReloadKey(k => k + 1);
  const formattedLeague = formatLeague(league);
  const [showNewTournament, setShowNewTournament] = useState(false);
const [year, setYear] = useState(new Date().getFullYear());
const [gender, setGender] = useState("boys");
const [ageGroup, setAgeGroup] = useState("U7");


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
     LOAD ALL TEAMS (BOTH LEAGUES)
  ========================= */
  
  useEffect(() => {
  if (!selectedTournamentId) {
    setTeams([]);
    return;
  }

  fetch(`/api/teams?tournamentId=${selectedTournamentId}`)
    .then(res => res.json())
    .then(data => {
      console.log("🧪 Teams from /api/teams:", data);
      setTeams(data);
    })
    .catch(err => console.error("❌ Fetch teams error:", err));

}, [selectedTournamentId, reloadKey]);


  



  /* =========================
     LOAD LEAGUE DATA
  ========================= */
  useEffect(() => {
    if (!selectedTournamentId) {
      setLeague([]);
      setFixtures([]);
      setKnockouts([]);
      return;
    }

    // League table
    fetch(`/api/league?leagueId=${leagueId}&tournamentId=${selectedTournamentId}`)
      .then(res => res.json())
      .then(setLeague)
      .catch(err => console.error("❌ Fetch league error:", err));

    // League fixtures
    fetch(`/api/matches?leagueId=${leagueId}&tournamentId=${selectedTournamentId}`)
      .then(res => res.json())
      .then(setFixtures)
      .catch(err => console.error("❌ Fetch fixtures error:", err));

    // Knockouts
    Promise.all([
      fetch(`/api/matches?round=semi-final&tournamentId=${selectedTournamentId}`)
        .then(r => r.json()),
      fetch(`/api/matches?round=final&tournamentId=${selectedTournamentId}`)
        .then(r => r.json())
    ])
      .then(([semis, finals]) => setKnockouts([...semis, ...finals]))
      .catch(err => console.error("❌ Fetch knockouts error:", err));

  }, [leagueId, selectedTournamentId, reloadKey]);

  /* =========================
     ACTIONS
  ========================= */
  const resetTournamentData = async () => {
    if (!selectedTournamentId) return;

    if (!window.confirm("⚠️ Reset all fixtures & results?")) return;

    await fetch("/api/admin/reset-tournament", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tournamentId: selectedTournamentId })
    });

    reloadData();
  };

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
  } catch (err) {
    console.error("❌ Create tournament error:", err);
  }
};

  const handleDeleteTournament = async () => {
    if (!selectedTournamentId) return;

    if (!window.confirm("❗ DELETE tournament permanently?")) return;

    await fetch(`/api/tournaments/${selectedTournamentId}`, { method: "DELETE" });

    setSelectedTournamentId(null);
    reloadData();
  };

  const generateFixtures = async () => {
    if (!window.confirm("Generate fixtures for this league?")) return;

    await fetch("/api/league/generate-fixtures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leagueId,
        tournamentId: selectedTournamentId
      })
    });

    reloadData();
  };

  const handleDeleteFixture = async (id) => {
    await fetch(`/api/matches/${id}`, { method: "DELETE" });
    reloadData();
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="App">

      <header className="admin-header">
        <h1>🔐 Admin Control Panel</h1>
      </header>

      {/* Tournament controls */}
      <div className="tournament-actions">
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

        <div className="tournament-actions-buttons">
          <button
  className="admin-button primary"
  onClick={() => setShowNewTournament(true)}
>
  ➕ Create new tournament
</button>

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
        <option value="boys">Boys</option>
        <option value="girls">Girls</option>
        <option value="mixed">Mixed</option>
      </select>
    </div>

    <div className="admin-group">
      <label>Age Group</label>
      <select
        value={ageGroup}
        onChange={e => setAgeGroup(e.target.value)}
      >
        <option value="U7">U7</option>
        <option value="U8">U8</option>
        <option value="U9">U9</option>
        <option value="U10">U10</option>
        <option value="U11">U11</option>
        <option value="U12">U12</option>
      </select>
    </div>

    <div className="admin-actions">
      <button
        className="admin-button primary"
        onClick={createTournament}
      >
        ✅ Create Tournament
      </button>

      <button
        className="admin-button outline"
        onClick={() => setShowNewTournament(false)}
      >
        Cancel
      </button>
    </div>

  </div>
)}

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

      {/* Dashboard */}
      <div className="dashboard-wrapper">

        {/* Teams */}
        <div className="left-panel">
          <TeamList
            teams={teams}
            onDelete={reloadData}
          />

          <AddTeam
            tournamentId={selectedTournamentId}
            onAdd={reloadData}
            disabled={!selectedTournamentId}
          />
        </div>

        {/* League */}
        <div className="league-column">
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

          <button
            className="admin-button"
            onClick={generateFixtures}
            disabled={!selectedTournamentId}
          >
            ⚽ Auto-generate League Fixtures
          </button>

          <AddFixture
            leagueId={leagueId}
            tournamentId={selectedTournamentId}
            onFixturesUpdated={reloadData}
          />

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

        <KnockoutBracket
          matches={knockouts}
          onDelete={handleDeleteFixture}
          onResultsUpdated={reloadData}
        />
      </section>

    </div>
  );
}
