import { useState } from "react";
import "./Fixtures.css";

// Display "TBC" if no kickoff
function formatKickoff(start_time) {
  if (!start_time) return "TBC";

  const d = new Date(start_time);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function toTimeValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Fixtures({
  fixtures = [],
  onResultsUpdated,
  onDelete,
  readOnly = false,
  tournamentId,
  tournamentStartTime = "" // "HH:MM"
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTimeValue, setEditTimeValue] = useState("");

  const handleSubmitResult = (id, homeScore, awayScore) => {
    fetch(`/api/matches/${id}/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        home_score: parseInt(homeScore),
        away_score: parseInt(awayScore)
      })
    })
      .then(async (res) => {
        if (!res.ok) {
          let msg = "Failed to submit result";
          try {
            const data = await res.json();
            if (data?.error) msg = data.error;
          } catch {}
          throw new Error(msg);
        }
        onResultsUpdated?.();
      })
      .catch((err) => {
        console.error("❌ Submit result error:", err);
        alert("Failed to submit result");
      });
  };

  const startEditingTime = (fx) => {
    setEditingId(fx.id);
    setEditTimeValue(toTimeValue(fx.start_time) || tournamentStartTime || "");
  };

  const saveTime = async (id) => {
    try {
      const res = await fetch(`/api/matches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kickoff_time: editTimeValue || null, // "HH:MM"
          tournamentId
        })
      });

      if (!res.ok) {
        let msg = "Failed to update kickoff time";
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {}
        throw new Error(msg);
      }

      setEditingId(null);
      setEditTimeValue("");
      onResultsUpdated?.(); // refetch + re-sort
    } catch (err) {
      console.error("❌ Update kickoff time error:", err);
      alert("Failed to update kickoff time");
    }
  };

  return (
    <div className="fixtures-container">
      <h2>Fixtures / Results</h2>

      <ul className="fixture-list">
        {fixtures.map((fx) => (
          <li key={fx.id} className="fixture-card">
            <div className="fixture-content">
              {/* Kickoff line */}
              <div className="fixture-line fixture-kickoff">
                <strong>KO:</strong>{" "}
                {editingId === fx.id ? (
                  <>
                    <input
                      type="time"
                      value={editTimeValue}
                      onChange={(e) => setEditTimeValue(e.target.value)}
                    />
                    <button type="button" onClick={() => saveTime(fx.id)}>
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditTimeValue("");
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span>{formatKickoff(fx.start_time)}</span>
                    {!readOnly && (
                      <button type="button" onClick={() => startEditingTime(fx)}>
                        Edit
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Team vs Team */}
              <div className="fixture-line fixture-teams-balanced">
                <span className="fixture-team home">{fx.home_team}</span>
                <span className="vs">vs</span>
                <span className="fixture-team away">{fx.away_team}</span>
              </div>

              {/* Score / TBD / Actions */}
              {fx.played ? (
                <div className="fixture-line fixture-score-centered">
                  {fx.home_score} - {fx.away_score}
                </div>
              ) : readOnly ? (
                <div className="fixture-line fixture-score-centered">TBD</div>
              ) : (
                <div className="fixture-actions">
                  <form
                    className="fixture-score-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSubmitResult(
                        fx.id,
                        e.target.home.value,
                        e.target.away.value
                      );
                    }}
                  >
                    <div className="fixture-score-inputs">
                      <input name="home" type="number" min="0" required />
                      <span>-</span>
                      <input name="away" type="number" min="0" required />
                    </div>

                    <div className="fixture-action-buttons">
                      <button type="submit" className="fixture-submit-btn">
                        Submit
                      </button>

                      {typeof onDelete === "function" && (
                        <button
                          type="button"
                          className="fixture-delete-btn"
                          onClick={() => onDelete(fx.id)}
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}