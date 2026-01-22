import { useState } from 'react';
import './KnockoutBracket.css';

function formatKickoff(start_time) {
  if (!start_time) return "TBC";
  const d = new Date(start_time);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function toTimeValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* =========================
   Reusable Fixture Card
========================= */
function FixtureCard({ match, tournamentId, onDelete, onResultsUpdated, readOnly }) {
  const [isDraw, setIsDraw] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [editTimeValue, setEditTimeValue] = useState("");

 const submitResult = async (home, away, ph, pa) => {
  try {
    const res = await fetch(`/api/matches/${match.id}/result`, { ... });

    if (!res.ok) throw new Error("Failed to submit result");

    if (match.round === "semi-final") {
      const gf = await fetch("/api/knockout/generate-final", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId, bracket: match.bracket })
      });

      if (!gf.ok) {
        const msg = await gf.text().catch(() => "");
        console.error("❌ generate-final failed:", gf.status, msg);
      }
    }
  } finally {
    onResultsUpdated?.();
  }
};

 // ✅ kickoff edit handlers
const startEditKickoff = () => {
  setEditingTime(true);
  setEditTimeValue(toTimeValue(match.start_time) || ""); // optional fallback below
};
const saveKickoff = async () => {
  try {
    const res = await fetch(`/api/matches/${match.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kickoff_time: editTimeValue || null,
        tournamentId
      })
    });

    if (!res.ok) throw new Error("Failed to update kickoff time");
    setEditingTime(false);
    setEditTimeValue("");
    onResultsUpdated?.();
  } catch (err) {
    console.error("❌ Update kickoff time error:", err);
    alert("Failed to update kickoff time");
  }
};

  return (
    <div className="fixture-card">
           <div className="fixture-line fixture-kickoff">
        <strong>KO:</strong>{" "}
        {editingTime ? (
          <>
            <input
               type="time"
              value={editTimeValue}
              onChange={(e) => setEditTimeValue(e.target.value)}
            />
            <button type="button" onClick={saveKickoff}>Save</button>
            <button
              type="button"
              onClick={() => {
                setEditingTime(false);
                setEditTimeValue("");
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <span>{formatKickoff(match.start_time)}</span>
            {!readOnly && (
              <button type="button" onClick={startEditKickoff}>Edit</button>
            )}
          </>
        )}
      </div>
      <div className="fixture-line">
        <strong>{match.home_team}</strong> vs{' '}
        <strong>{match.away_team}</strong>
      </div>

    {match.played && (
  <div className="fixture-score">
    {match.home_score} – {match.away_score}
    {match.decided_by_penalties &&
      match.penalties_home != null &&
      match.penalties_away != null && (
        <span className="fixture-pens">
          {" "}
          (pens {match.penalties_home}–{match.penalties_away})
        </span>
      )}
  </div>
)}

      {!match.played && !readOnly && (
        <form
          className="fixture-score-form"
  onSubmit={e => {
    e.preventDefault();
    const h = e.target.home.value;
    const a = e.target.away.value;
    submitResult(
      h,
      a,
      e.target.ph?.value,
      e.target.pa?.value
    );
  }}
>
  <input name="home" type="number" min="0" required
    onChange={e => setIsDraw(e.target.value === e.target.form.away.value)}
  />
  <span>-</span>
  <input name="away" type="number" min="0" required
    onChange={e => setIsDraw(e.target.value === e.target.form.home.value)}
  />

  {isDraw && match.round !== 'league' && (
    <div className="penalties">
      <small>Penalties</small>
      <input name="ph" type="number" min="0" required />
      <span>-</span>
      <input name="pa" type="number" min="0" required />
    </div>
  )}

  <button type="submit">Submit</button>
</form>
      )}

      {!match.played && readOnly && (
        <div className="fixture-score">TBD</div>
      )}

      {!readOnly && typeof onDelete === 'function' && (
        <button
          type="button"
          className="fixture-delete-btn"
          onClick={() => onDelete(match.id)}
        >
          🗑️
        </button>
      )}
    </div>
  );
}

/* =========================
   Placeholder Card
========================= */
function PlaceholderCard({ label }) {
  return (
    <div className="fixture-card placeholder">
      <div className="fixture-line placeholder-text">
        {label}
      </div>
    </div>
  );
}

/* =========================
   Section (Cup / Plate)
========================= */
function KnockoutSection({
   title,
  semis,
  finalMatch,
  placeholders,
  tournamentId,
  onDelete,
  onResultsUpdated,
  readOnly
}) {
  const hasSemis = semis.length === 2;

  return (
    <section className="knockout-section">
      {title && <h3 className="knockout-title">{title}</h3>}

      <div className="bracket-grid">
        {/* LEFT SEMI */}
        <div className="semi left">
          {hasSemis ? (
            <FixtureCard
              match={semis[0]}
              tournamentId={tournamentId}
              onDelete={onDelete}
              onResultsUpdated={onResultsUpdated}
              readOnly={readOnly}
            />
          ) : (
            <PlaceholderCard label={placeholders[0]} />
          )}
        </div>

        {/* LEFT ARROW */}
        <div className="flow-arrow left">➜</div>

        {/* FINAL */}
        <div className="final">
          {finalMatch ? (
            <FixtureCard
              match={finalMatch}
              tournamentId={tournamentId}
              onDelete={onDelete}
              onResultsUpdated={onResultsUpdated}
              readOnly={readOnly}
            />
          ) : (
            <PlaceholderCard label={placeholders[2]} />
          )}
        </div>

        {/* RIGHT ARROW */}
        <div className="flow-arrow right">➜</div>

        {/* RIGHT SEMI */}
        <div className="semi right">
          {hasSemis ? (
            <FixtureCard
              match={semis[1]}
              tournamentId={tournamentId}
              onDelete={onDelete}
              onResultsUpdated={onResultsUpdated}
              readOnly={readOnly}
            />
          ) : (
            <PlaceholderCard label={placeholders[1]} />
          )}
        </div>
      </div>
    </section>
  );
}

/* =========================
   Main Bracket Component
========================= */
export default function KnockoutBracket({
  matches = [],
  tournamentId,
  onDelete,
  onResultsUpdated,
  readOnly = false
}) {
  const cupSemis = matches.filter(
    m => m.round === 'semi-final' && m.bracket === 'cup'
  );

  const plateSemis = matches.filter(
    m => m.round === 'semi-final' && m.bracket === 'plate'
  );

  const cupFinal = matches.find(
    m => m.round === 'final' && m.bracket === 'cup'
  );

  const plateFinal = matches.find(
    m => m.round === 'final' && m.bracket === 'plate'
  );

  return (
    <div className="knockout-stage">
      <KnockoutSection
        title="🏆 Cup Competition"
        semis={cupSemis}
        finalMatch={cupFinal}
        tournamentId={tournamentId}
        placeholders={[
          'League A – 1st vs League B – 2nd',
          'League B – 1st vs League A – 2nd',
          '🏆 Cup Final'
        ]}
        onDelete={onDelete}
        onResultsUpdated={onResultsUpdated}
        readOnly={readOnly}
      />

      {/* Divider between Cup and Plate */}
      <div className="knockout-divider">
        <span className="divider-line" />
        <span className="divider-label">🥈 Plate Competition</span>
        <span className="divider-line" />
      </div>

      <KnockoutSection
        semis={plateSemis}
        finalMatch={plateFinal}
        tournamentId={tournamentId}
        placeholders={[
          'League A – 3rd vs League B – 4th',
          'League B – 3rd vs League A – 4th',
          '🥈 Plate Final'
        ]}
        onDelete={onDelete}
        onResultsUpdated={onResultsUpdated}
        readOnly={readOnly}
      />
    </div>
  );
}
