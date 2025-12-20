import "./TeamList.css";
import { getLogoSrc } from "./utils/getLogoSrc";

export default function TeamList({
  teams = [],
  onDelete,
  readOnly = false
}) {
  const handleDelete = async (teamId) => {
    if (typeof teamId !== "number") {
      console.error(
        "🚫 Cannot delete team without numeric ID:",
        teamId
      );
      return;
    }

    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        throw new Error("Failed to delete team");
      }

      if (typeof onDelete === "function") {
        onDelete();
      }
    } catch (err) {
      console.error("❌ Delete team error:", err);
      alert("Failed to delete team");
    }
  };

  const sortedTeams = [...teams].sort((a, b) => {
    const nameA = (a.team || "").toLowerCase();
    const nameB = (b.team || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="team-list">
      <h2>Registered Teams</h2>

      {sortedTeams.length === 0 && (
        <p className="empty-state">No teams added yet</p>
      )}

      {sortedTeams.map((team) => {
        console.log("🧪 Team object in TeamList:", team);
        const teamName = team.team;

        return (
          <div key={team.id} className="team-card">
            <img
              src={getLogoSrc(teamName)}
              alt={teamName}
              className="team-logo"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "/logos/default.png";
              }}
            />

            <span className="team-name">{teamName}</span>

            {!readOnly && (
              <button
                className="team-delete"
                onClick={() => handleDelete(team.id)}
                title="Delete team"
              >
                🗑️
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
