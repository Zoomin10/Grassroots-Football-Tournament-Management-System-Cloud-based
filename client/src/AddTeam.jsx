import { useState } from "react";
import "./AddTeam.css";

export default function AddTeam({
  tournamentId,
  leagues = [],
  onAdd,
  disabled = false
}) {
  const [team, setTeam] = useState("");
  const [leagueId, setLeagueId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tournamentId || !team.trim() || !leagueId) return;

    const payload = {
      team: team.trim(),
      leagueId,
      tournamentId
    };

    console.log("ADD TEAM payload:", payload);

    try {
      setLoading(true);

      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to add team");
      }

      setTeam("");
      setLeagueId("");

      onAdd?.();
    } catch (err) {
      console.error("❌ Add team error:", err);
      alert("Failed to add team");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="add-team-form" onSubmit={handleSubmit}>
      <h3>Add Team</h3>

      <input
        type="text"
        placeholder="Team name"
        value={team}
        onChange={(e) => setTeam(e.target.value)}
        disabled={disabled || loading}
        required
      />

      <select
        value={leagueId}
        onChange={(e) => setLeagueId(Number(e.target.value))}
        disabled={disabled || loading || leagues.length === 0}
        required
      >
        <option value="">Select league</option>
        {leagues.map(l => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={disabled || loading || !leagueId}
      >
        {loading ? "Adding…" : "➕ Add Team"}
      </button>
    </form>
  );
}