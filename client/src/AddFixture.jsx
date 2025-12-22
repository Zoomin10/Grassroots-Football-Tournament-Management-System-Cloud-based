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

  if (!tournamentId || !leagueId || !homeTeam || !awayTeam) {
    console.error("❌ Missing data", {
      tournamentId,
      leagueId,
      homeTeam,
      awayTeam
    });
    return;
  }

  if (homeTeam === awayTeam) {
    alert("Home and away team must be different.");
    return;
  }

  try {
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tournamentId,                 // ✅ camelCase
        leagueId,                     // ✅ camelCase
        home_team_id: Number(homeTeam),
        away_team_id: Number(awayTeam)
      })
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("❌ Add fixture backend response:", res.status, text);
      throw new Error("Failed to add fixture");
    }

    setHomeTeam("");
    setAwayTeam("");
    setShowForm(false);
    onFixturesUpdated?.();
  } catch (err) {
    console.error("❌ Add fixture error:", err);
  }
};


  const leagueTeams = teams.filter(t => t.league_id === leagueId);

  return (
 <div className="add-fixture">
    {/* Toggle button */}
    <button
      className="admin-button primary"
      onClick={() => setShowForm(prev => !prev)}
    >
     🔧 Add Fixture Manually
    </button>

    {showForm && leagueTeams.length < 2 && (
      <p className="fixture-hint">
        Add at least two teams to this league before creating fixtures.
      </p>
    )}

    {showForm && leagueTeams.length >= 2 && (
      <form onSubmit={handleAddFixture} className="add-fixture-form-inner">
        <select
          value={homeTeam}
          onChange={e => setHomeTeam(e.target.value)}
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
          onChange={e => setAwayTeam(e.target.value)}
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