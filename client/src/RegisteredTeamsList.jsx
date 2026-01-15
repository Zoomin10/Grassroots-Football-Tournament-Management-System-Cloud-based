import { useState } from "react";
import "./TeamList.css"; // reuse styles if you want
import { getLogoSrc } from "./utils/getLogoSrc";

export default function RegisteredTeamsList({
  items = [],          // combined list from /registered-teams
  leagues = [],        // from /tournaments/:id/leagues
  readOnly = false,
  onRefresh,           // callback to refetch after approve/delete
}) {
  const [approvingId, setApprovingId] = useState(null);
  const [selectedLeagueByReg, setSelectedLeagueByReg] = useState({});
const [playersOpenFor, setPlayersOpenFor] = useState(null); // registrationId or null
const [playersByRegId, setPlayersByRegId] = useState({});  // { [id]: players[] }
const [playersLoading, setPlayersLoading] = useState(false);
const [playersError, setPlayersError] = useState(null);

async function loadPlayers(registrationId) {
  setPlayersLoading(true);
  setPlayersError(null);

  try {
    const res = await fetch(`/api/registrations/${registrationId}/players`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    setPlayersByRegId((prev) => ({ ...prev, [registrationId]: Array.isArray(data) ? data : [] }));
  } catch (e) {
    setPlayersError("Failed to load players.");
    console.error(e);
  } finally {
    setPlayersLoading(false);
  }
}

  async function approveRegistration(registrationId) {
    const leagueId = selectedLeagueByReg[registrationId];
    if (!leagueId) return;

    try {
      setApprovingId(registrationId);

      const res = await fetch(`/api/registrations/${registrationId}/assign-league`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueId }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to approve registration");
      }

      onRefresh?.();
    } catch (err) {
      console.error("❌ Approve error:", err);
      alert("Failed to approve registration");
    } finally {
      setApprovingId(null);
    }
  }

  async function deleteTeam(teamRowId) {
    // delete only works for real teams table numeric IDs
    try {
      const res = await fetch(`/api/teams/${teamRowId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete team");
      onRefresh?.();
    } catch (err) {
      console.error("❌ Delete team error:", err);
      alert("Failed to delete team");
    }
  }

  // Sort: show unapproved registrations first, then alphabetical
  const sorted = [...items].sort((a, b) => {
    const aUnapproved = a.source === "registration" && !a.team_row_id;
    const bUnapproved = b.source === "registration" && !b.team_row_id;
    if (aUnapproved !== bUnapproved) return aUnapproved ? -1 : 1;

    const nameA = (a.team_name || "").toLowerCase();
    const nameB = (b.team_name || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="team-list">
      <h2>Registered Teams</h2>

      {sorted.length === 0 && (
        <p className="empty-state">No teams / registrations yet</p>
      )}

      {sorted.map((item) => {
        const teamName =
           item.club_name
             ? `${item.club_name} – ${item.team_name}`
             : item.team_name;
   const logoName = item.club_name || item.team_name || "default";

        const isReg = item.source === "registration";
        const isApproved = isReg && !!item.team_row_id;

  return (
  <div key={item.id} className="team-card">
    {/* Top row (logo + details + buttons) */}
    <div className="team-card-row">
      <img
        src={getLogoSrc(logoName)}
        alt={teamName}
        className="team-logo"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = "/logos/default.png";
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        <span className="team-name">{teamName}</span>

        <div style={{ fontSize: 12, opacity: 0.8 }}>
          {isReg ? (
            <>
              <strong>Web</strong>
              {item.team_id_code ? (
                <>
                  {" "}
                  • Team ID:{" "}
                  <span style={{ fontFamily: "monospace" }}>{item.team_id_code}</span>
                </>
              ) : null}
              {item.manager_name ? <> • {item.manager_name}</> : null}
            </>
          ) : (
            <>
              <strong>Admin</strong>
              {item.league_name ? <> • {item.league_name}</> : null}
            </>
          )}
        </div>

        {isReg && isApproved && item.league_name ? (
          <div style={{ fontSize: 12, opacity: 0.8 }}>Approved ✅ • {item.league_name}</div>
        ) : null}
      </div>

      {/* Players button (registrations only) */}
      {isReg ? (
        <button
          className="btn btn-secondary"
          onClick={async () => {
            const regId = item.registration_id;

            // Toggle close
            if (playersOpenFor === regId) {
              setPlayersOpenFor(null);
              return;
            }

            setPlayersOpenFor(regId);

            // Lazy-load once
            if (!playersByRegId[regId]) {
              await loadPlayers(regId);
            }
          }}
        >
          Players
        </button>
      ) : null}

      {/* Right-side actions */}
      {!readOnly ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Approve controls for unapproved registrations */}
          {isReg && !isApproved ? (
            <>
              <select
                value={selectedLeagueByReg[item.registration_id] || ""}
                onChange={(e) =>
                  setSelectedLeagueByReg((prev) => ({
                    ...prev,
                    [item.registration_id]: Number(e.target.value),
                  }))
                }
                disabled={approvingId === item.registration_id}
              >
                <option value="">Assign league…</option>
                {leagues.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>

              <button
                className="team-delete"
                title="Approve"
                onClick={() => approveRegistration(item.registration_id)}
                disabled={
                  approvingId === item.registration_id ||
                  !selectedLeagueByReg[item.registration_id]
                }
              >
                ✅
              </button>
            </>
          ) : null}

          {/* Delete only for admin teams */}
          {!isReg ? (
            <button
              className="team-delete"
              onClick={() => deleteTeam(item.team_row_id)}
              title="Delete team"
            >
              🗑️
            </button>
          ) : null}
        </div>
      ) : null}
    </div>

    {/* Players panel (full-width, below the row) */}
    {isReg && playersOpenFor === item.registration_id ? (
      <div className="team-card-players">
        {playersLoading ? (
          <div>Loading…</div>
        ) : playersError ? (
          <div className="error">{playersError}</div>
        ) : (playersByRegId[item.registration_id] || []).length === 0 ? (
          <div>No registered players yet.</div>
        ) : (
          <table className="players-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>DOB</th>
              </tr>
            </thead>
            <tbody>
              {playersByRegId[item.registration_id].map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.first_name} {p.surname}
                  </td>
                  <td>{new Date(p.dob).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    ) : null}
  </div>
);
) : null}
            {/* Right-side actions */}
            {!readOnly && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* Approve controls for unapproved registrations */}
                {isReg && !isApproved ? (
                  <>
                    <select
                      value={selectedLeagueByReg[item.registration_id] || ""}
                      onChange={(e) =>
                        setSelectedLeagueByReg((prev) => ({
                          ...prev,
                          [item.registration_id]: Number(e.target.value),
                        }))
                      }
                      disabled={approvingId === item.registration_id}
                    >
                      <option value="">Assign league…</option>
                      {leagues.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>

                    <button
                      className="team-delete"
                      title="Approve"
                      onClick={() => approveRegistration(item.registration_id)}
                      disabled={
                        approvingId === item.registration_id ||
                        !selectedLeagueByReg[item.registration_id]
                      }
                    >
                      ✅
                    </button>
                  </>
                ) : null}

                {/* Delete only for admin teams (teams table rows) */}
                {!isReg ? (
                  <button
                    className="team-delete"
                    onClick={() => deleteTeam(item.team_row_id)}
                    title="Delete team"
                  >
                    🗑️
                  </button>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
