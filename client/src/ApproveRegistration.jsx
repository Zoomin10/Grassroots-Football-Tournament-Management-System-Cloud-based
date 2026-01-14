import { useState } from "react";
import "./AddTeam.css"; // reuse same styling if you want

export default function ApproveRegistration({
  registrationId,
  leagues = [],
  onApproved,
  disabled = false
}) {
  const [leagueId, setLeagueId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!registrationId || !leagueId) return;

    try {
      setLoading(true);

      const res = await fetch(`/api/registrations/${registrationId}/assign-league`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueId })
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to approve registration");
      }

      onApproved?.();
    } catch (err) {
      console.error("❌ Approve registration error:", err);
      alert("Failed to approve registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="add-team-form" onSubmit={handleApprove}>
      <h3>Approve Registration</h3>

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

      <button type="submit" disabled={disabled || loading || !leagueId}>
        {loading ? "Approving…" : "✅ Approve"}
      </button>
    </form>
  );
}
