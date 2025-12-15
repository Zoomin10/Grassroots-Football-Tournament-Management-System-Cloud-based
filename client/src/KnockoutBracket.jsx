import './KnockoutBracket.css';

/* =========================
   Reusable Fixture Card
========================= */
function FixtureCard({ match, onDelete, onResultsUpdated }) {
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
        // Auto-generate final after semi-finals
        if (match.round === 'semi-final') {
          return fetch('/api/knockout/generate-final', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bracket: match.bracket })
          }).catch(() => {
            // Ignore 400 (other semi not finished yet)
          });
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
        <strong>{match.home_team}</strong> vs <strong>{match.away_team}</strong>
      </div>

      {match.played ? (
        <div className="fixture-score">
          {match.home_score} – {match.away_score}
        </div>
      ) : (
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

      {onDelete && (
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
  onDelete,
  onResultsUpdated
}) {
  const hasSemis = semis.length === 2;

  return (
    <section className="knockout-section">
      <h3 className="knockout-title">{title}</h3>

      <div className="knockout-bracket">
        {/* Left Semi */}
        <div className="bracket-column left">
          {hasSemis ? (
            <FixtureCard
              match={semis[0]}
              onDelete={onDelete}
              onResultsUpdated={onResultsUpdated}
            />
          ) : (
            <PlaceholderCard label={placeholders[0]} />
          )}
        </div>

        {/* Final */}
        <div className="bracket-column center">
          {finalMatch ? (
            <FixtureCard
              match={finalMatch}
              onDelete={onDelete}
              onResultsUpdated={onResultsUpdated}
            />
          ) : (
            <PlaceholderCard label={placeholders[2]} />
          )}
        </div>

        {/* Right Semi */}
        <div className="bracket-column right">
          {hasSemis ? (
            <FixtureCard
              match={semis[1]}
              onDelete={onDelete}
              onResultsUpdated={onResultsUpdated}
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
export default function KnockoutBracket({ matches = [], onDelete, onResultsUpdated }) {
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
        placeholders={[
          'League A – 1st vs League B – 2nd',
          'League B – 1st vs League A – 2nd',
          '🏆 Cup Final'
        ]}
        onDelete={onDelete}
        onResultsUpdated={onResultsUpdated}
      />

      <KnockoutSection
        title="🥈 Plate Competition"
        semis={plateSemis}
        finalMatch={plateFinal}
        placeholders={[
          'League A – 3rd vs League B – 4th',
          'League B – 3rd vs League A – 4th',
          '🥈 Plate Final'
        ]}
        onDelete={onDelete}
        onResultsUpdated={onResultsUpdated}
      />

    </div>
  );
}
