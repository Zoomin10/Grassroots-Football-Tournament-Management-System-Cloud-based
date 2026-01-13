import './Fixtures.css';

export default function Fixtures({
  fixtures = [],
  onResultsUpdated,
  onDelete,
  readOnly = false
}) {



  const handleSubmitResult = (id, homeScore, awayScore) => {
    fetch(`/api/matches/${id}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  if (typeof onResultsUpdated === "function") onResultsUpdated();
})
      .catch(err => {
        console.error('❌ Submit result error:', err);
        alert('Failed to submit result');
      });
  };

return (
  <div className="fixtures-container">
    <h2>Fixtures / Results</h2>

    <ul className="fixture-list">
      {fixtures.map(fx => (
        <li key={fx.id} className="fixture-card">
          <div className="fixture-content">

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
              <div className="fixture-line fixture-score-centered">
                TBD
              </div>
            ) : (
              <div className="fixture-actions">
                <form
                  className="fixture-score-form"
                  onSubmit={e => {
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