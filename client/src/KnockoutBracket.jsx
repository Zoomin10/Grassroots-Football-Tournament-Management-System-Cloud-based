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
          method: 'POST'
        }).catch(() => {
          // ❌ ignore 400: second semi not ready yet
        });
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

/* ✅ THIS WAS MISSING ENTIRELY */
function KnockoutBracket({ matches, onDelete, onResultsUpdated }) {
  const semiFinals = matches.filter(m => m.round === 'semi-final');
  const finalMatch = matches.find(m => m.round === 'final');

  return (
    <div className="knockout-bracket">
      <div className="bracket-column left">
        {semiFinals[0] && (
          <FixtureCard
            match={semiFinals[0]}
            onDelete={onDelete}
            onResultsUpdated={onResultsUpdated}
          />
        )}
      </div>

      <div className="bracket-column center">
        {finalMatch ? (
          <FixtureCard
            match={finalMatch}
            onDelete={onDelete}
            onResultsUpdated={onResultsUpdated}
          />
        ) : (
          <div className="final-placeholder">🏆 Final</div>
        )}
      </div>

      <div className="bracket-column right">
        {semiFinals[1] && (
          <FixtureCard
            match={semiFinals[1]}
            onDelete={onDelete}
            onResultsUpdated={onResultsUpdated}
          />
        )}
      </div>
    </div>
  );
}

export default KnockoutBracket;
