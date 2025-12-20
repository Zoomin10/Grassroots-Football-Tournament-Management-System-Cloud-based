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

  const reloadData = () => setReloadKey(k => k + 1);

  const formattedLeague = Array.isArray(league)
    ? formatLeague(league)
    : [];

  /* =========================
     LOAD TOURNAMENTS
  ========================= */
  useEffect(() => {
    fetch("/api/tournaments")
      .then(res => res.json())
      .then(data => setTournaments(data))
      .catch(err => console.error("❌ Fetch tournaments error:", err));
  }, []);

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
  const createTournament = async () => {
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, gender, ageGroup }),
      });

      if (!res.ok) throw new Error("Create tournament failed");

      const tournament = await res.json();
      setTournaments(prev => [tournament, ...prev]);
      setSelectedTournamentId(tournament.id);
      setShowNewTournament(false);
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

    if (!window.confirm("This will delete all fixtures and results. Continue?")) return;

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

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="admin-view">
  <div className="admin-container">

      <div className="admin-header">
  <h1>🔐 Admin Control Panel</h1>

<div className="admin-tournament-card">
  <div className="admin-tournament-selector">
    <label htmlFor="admin-tournament-select">Active Tournament</label>
    <select
      id="admin-tournament-select"
      value={selectedTournamentId ?? ""}
      onChange={e => setSelectedTournamentId(Number(e.target.value))}
    >
      <option value="" disabled>Select tournament</option>
      {tournaments.map(t => (
        <option key={t.id} value={t.id}>
          {t.year} – {t.gender} {t.age_group}
        </option>
      ))}
    </select>
  </div>
</div>


  <div className="admin-actions">
    <button
      className="admin-button primary"
      onClick={() => setShowNewTournament(true)}
    >
      ➕ Create new tournament
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


      {/* Dashboard */}
      <div className="dashboard-wrapper">
        <div className="left-panel">
          <TeamList teams={teams} onDelete={reloadData} />
         <AddTeam
         tournamentId={selectedTournamentId}
         leagues={leagues}
         onAdd={reloadData}
         disabled={!selectedTournamentId}
        />
        </div>

        <div className="league-column">
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>🏆 League</h3>
              <div className="league-toggle">
                {leagues.map(l => (
                  <button
                    key={l.id}
                    className={l.id === activeLeagueId ? "league-btn active" : "league-btn"}
                    onClick={() => setActiveLeagueId(l.id)}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>

            <LeagueTable league={formattedLeague} />
          </div>

          <button
            className="admin-button"
            onClick={generateFixtures}
            disabled={!activeLeagueId}
          >
            ⚽ Auto-generate League Fixtures
          </button>

          <AddFixture
            leagueId={activeLeagueId}
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
  onDelete={handleDeleteFixture}
  onResultsUpdated={() => {
    reloadData();
    generateFinal("cup");
    generateFinal("plate");
  }}
  />
</section>

    </div>
    </div>
  );
}