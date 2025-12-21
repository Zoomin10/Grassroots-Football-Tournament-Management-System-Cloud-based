import { useEffect, useState } from "react";
import "./AddFixture.css";


export default function AddFixture({
  leagueId,
  tournamentId,
  onFixturesUpdated
}) {
  const [teams, setTeams] = useState([]);
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!tournamentId) {
      setTeams([]);
      return;
    }

    fetch(`/api/teams?leagueId=${leagueId}&tournamentId=${tournamentId}`)
      .then(res => res.json())
      .then(setTeams)
      .catch(err => {
        console.error("❌ Load teams error:", err);
      });
  }, [leagueId, tournamentId]);

  const handleAddFixture = async (e) => {
    e.preventDefault();

    if (!tournamentId) return;

    if (homeTeam === awayTeam) {
      alert("A team cannot play against itself.");
      return;
    }

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeTeamId: homeTeam,
          awayTeamId: awayTeam,
          leagueId,
          tournamentId,
        }),
      });

      if (!res.ok) throw new Error("Failed to add fixture");

      setHomeTeam("");
      setAwayTeam("");

      if (typeof onFixturesUpdated === "function") {
        onFixturesUpdated();
      }
    } catch (err) {
      console.error("❌ Add fixture error:", err);
      alert("Failed to add fixture");
    }
  };

  const leagueTeams = teams.filter(t => t.league_id === leagueId);

  return (
  <div className="add-fixture-form">
    <p className="fixture-league-note">
      Manually Creating Fixture for{" "}
      <strong>{leagueId === 1 ? "League A" : "League B"}</strong>
    </p>

    <h3>Manually Add Fixture</h3>

    {/* Toggle button */}
    <button
      className="admin-button"
      onClick={() => setShowForm(prev => !prev)}
    >
      ➕ Add Fixture
    </button>

    {/* Warning ONLY when user tries */}
    {showForm && leagueTeams.length < 2 && (
      <p className="fixture-hint">
        Add at least two teams to this league before creating fixtures.
      </p>
    )}

    {/* ✅ Form only renders when usable */}
    {showForm && leagueTeams.length >= 2 && (
      <form onSubmit={handleAddFixture}>
        <select
          value={homeTeam}
          onChange={(e) => setHomeTeam(e.target.value)}
          required
        >
          <option value="">Select Home Team</option>
          {leagueTeams.map(team => (
            <option key={team.id} value={team.id}>
              {team.team}
            </option>
          ))}
        </select>

        <select
          value={awayTeam}
          onChange={(e) => setAwayTeam(e.target.value)}
          required
        >
          <option value="">Select Away Team</option>
          {leagueTeams.map(team => (
            <option key={team.id} value={team.id}>
              {team.team}
            </option>
          ))}
        </select>

        <button type="submit" className="admin-button primary">
          Save Fixture
        </button>
      </form>
    )}
  </div>
);
}