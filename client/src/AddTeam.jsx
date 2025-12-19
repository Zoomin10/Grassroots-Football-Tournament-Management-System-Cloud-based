import { useState } from "react";
import "./AddTeam.css";

export default function AddTeam({
  tournamentId,
  leagues = [],
  onAdd,
  disabled
}) {
  const [team, setTeam] = useState("");
  const [leagueId, setLeagueId] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!team || !leagueId || !tournamentId) return;

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team,
          leagueId,        // ← real DB id
          tournamentId
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add team");
      }

      setTeam("");
      setLeagueId("");
      onAdd?.();
    } catch (err) {
      console.error("❌ Add team error:", err);
    }
  };

  return (
    <form className="add-team-form" onSubmit={handleSubmit}>
      <h3>Add Team</h3>

      <input
        type="text"
        placeholder="Team name"
        value={team}
        onChange={e => setTeam(e.target.value)}
        disabled={disabled}
        required
      />

      <select
        value={leagueId}
        onChange={e => setLeagueId(Number(e.target.value))}
        disabled={disabled || leagues.length === 0}
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
        disabled={disabled || !leagueId}
      >
        ➕ Add Team
      </button>
    </form>
  );
}