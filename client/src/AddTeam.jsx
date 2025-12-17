import { useState } from "react";
import "./AddTeam.css";

export default function AddTeam({ tournamentId, onAdd, disabled }) {
  const [team, setTeam] = useState("");
  const [leagueId, setLeagueId] = useState(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tournamentId) return;

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team,
          leagueId,
          tournamentId,
        }),
      });

      if (!res.ok) throw new Error("Failed to add team");

      setTeam("");
      if (onAdd) onAdd();
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
        onChange={(e) => setTeam(e.target.value)}
        disabled={disabled}
        required
      />

      <select
        value={leagueId}
        onChange={(e) => setLeagueId(Number(e.target.value))}
        disabled={disabled}
      >
        <option value={1}>League A</option>
        <option value={2}>League B</option>
      </select>

      <button type="submit" disabled={disabled || !tournamentId}>
        ➕ Add Team
      </button>
    </form>
  );
}
