import './KnockoutBracket.css';



/* =========================
   Reusable Fixture Card
========================= */
function FixtureCard({ match, tournamentId, onDelete, onResultsUpdated, readOnly }) {
  const submitResult = (home, away) => {
    fetch(`/api/matches/${match.id}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        home_score: parseInt(home, 10),
        away_score: parseInt(away, 10)
      })
    })
      .then(() => {
  // If a semi-final was just completed, attempt to generate the final
  if (match.round === 'semi-final') {
    return fetch('/api/knockout/generate-final', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tournamentId,
        bracket: match.bracket
      })
    }).catch(() => {});
  }
})
.finally(() => {
  if (typeof onResultsUpdated === 'function') {
    onResultsUpdated();
  }
});
  };


  return (
    <div className="fixture-card">
      <div className="fixture-line">
        <strong>{match.home_team}</strong> vs{' '}
        <strong>{match.away_team}</strong>
      </div>

      {match.played && (
        <div className="fixture-score">
          {match.home_score} – {match.away_score}
        </div>
      )}

      {!match.played && !readOnly && (
        <form
          className="fixture-score-form"
          onSubmit={e => {
            e.preventDefault();
            submitResult(e.target.home.value, e.target.away.value);
          }}
        >
          <input name="home" type="number" min="0" required />
          <span>-</span>
          <input name="away" type="number" min="0" required />
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
