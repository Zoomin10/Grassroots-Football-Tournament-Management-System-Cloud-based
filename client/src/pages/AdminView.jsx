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

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="App">
      {/* HEADER */}
      <header className="admin-header">
        <h1>🔐 Admin Control Panel</h1>

        <div className="tournament-bar">
          <label>Tournament:</label>

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
      </header>

      {/* NEW TOURNAMENT MODAL */}
      {showNewTournament && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create Tournament</h2>

            <select value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2026, 2027, 2028, 2029, 2030].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <select value={gender} onChange={e => setGender(e.target.value)}>
              <option value="boys">Boys</option>
              <option value="girls">Girls</option>
              <option value="mixed">Mixed</option>
            </select>

            <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => `U${i + 7}`).map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>

            <div className="modal-actions">
              <button onClick={createTournament} className="admin-button">
                Create
              </button>
              <button onClick={() => setShowNewTournament(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD */}
      <div className="dashboard-wrapper">
        <div className="left-panel">
          <TeamList teams={teams} onDelete={reloadData} />
          <AddTeam
            tournamentId={selectedTournamentId}
            onAdd={reloadData}
            disabled={!selectedTournamentId}
          />
        </div>

        <div className="right-panel">
          <div className="league-actions">
            <button
              className="admin-button"
              onClick={generateFixtures}
              disabled={!selectedTournamentId}
            >
              ⚽ Auto-generate League Fixtures
            </button>
          </div>

          <LeagueTable league={formattedLeague} />

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

      {/* KNOCKOUTS */}
      <section className="knockout-stage-wrapper">
        <h2>🏆 Knockout Stage</h2>

        <KnockoutBracket
          matches={knockouts}
          onDelete={handleDeleteFixture}
          onResultsUpdated={reloadData}
        />
      </section>
    </div>
  );
}

  