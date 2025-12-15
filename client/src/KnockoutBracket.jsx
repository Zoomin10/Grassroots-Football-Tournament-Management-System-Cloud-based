import './KnockoutBracket.css';

function FixtureCard({ match, onDelete, onResultsUpdated }) {
  const submitResult = (home, away) => {
    fetch(`/api/matches/${match.id}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        home_score: parseInt(home),
        away_score: parseInt(away)
      })
    })
      .then(() => {
        if (match.round === 'semi-final') {
          return fetch('/api/knockout/generate-final', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bracket: match.bracket })
          }).catch(() => {});
        }
      })
      .finally(() => {
        onResultsUpdated();
      });
  };

  return (
    <div className="fixture-card">
      <div className="fixture-line">
        <strong>{match.home_team}</strong> vs <strong>{match.away_team}</strong>
      </div>

      {match.played ? (
        <div className="fixture-score">
          {match.home_score} - {match.away_score}
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

function KnockoutSection({ title, semis, final, onDelete, onResultsUpdated }) {
  return (
    <>
      <h3>{title}</h3>
      <div className="knockout-bracket">
        <div className="bracket-column left">
          {semis[0] && (
            <FixtureCard
              match={semis[0]}
              onDelete={onDelete}
              onResultsUpdated={onResultsUpdated}
            />
          )}
        </div>

        <div className="bracket-column center">
          {final ? (
            <FixtureCard
              match={final}
              onDelete={onDelete}
              onResultsUpdated={onResultsUpdated}
            />
          ) : (
            <div className="final-placeholder">🏆 Final</div>
          )}
        </div>

        <div className="bracket-column right">
          {semis[1] && (
            <FixtureCard
              match={semis[1]}
              onDelete={onDelete}
              onResultsUpdated={onResultsUpdated}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default function KnockoutBracket({ matches, onDelete, onResultsUpdated }) {
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
    <div>
      <KnockoutSection
        title="🏆 Cup"
        semis={cupSemis}
        final={cupFinal}
        onDelete={onDelete}
        onResultsUpdated={onResultsUpdated}
      />

      <KnockoutSection
        title="🥈 Plate"
        semis={plateSemis}
        final={plateFinal}
        onDelete={onDelete}
        onResultsUpdated={onResultsUpdated}
      />
    </div>
  );
}
