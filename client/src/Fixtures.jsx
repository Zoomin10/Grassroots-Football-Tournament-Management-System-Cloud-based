import './Fixtures.css';

export default function Fixtures({ fixtures = [], onResultsUpdated, onDelete }) {

  const handleSubmitResult = (id, homeScore, awayScore) => {
    fetch(`/api/matches/${id}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        home_score: parseInt(homeScore),
        away_score: parseInt(awayScore)
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to submit result');
        if (typeof onResultsUpdated === 'function') {
          onResultsUpdated();
        }
      })
      .catch(err => {
        console.error('❌ Submit result error:', err);
        alert('Failed to submit result');
      });
  };

  return (
    <div className="fixtures-container">
      <h2>Results / Fixtures</h2>

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

              {/* Score or Submit Form */}
              {fx.played ? (
                <div className="fixture-line fixture-score-centered">
                  {fx.home_score} - {fx.away_score}
                </div>
              ) : (
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
                  <input name="home" type="number" min="0" placeholder="Home" required />
                  <span>-</span>
                  <input name="away" type="number" min="0" placeholder="Away" required />
                  <button type="submit">Submit</button>
                </form>
              )}

              {/* Delete Button */}
 <button
  type="button"
  className="delete-btn"
  onClick={() => {
    console.log('🔥 DELETE CLICKED', fx.id);
    if (typeof onDelete === 'function') {
      onDelete(fx.id);
    }
  }}
>
  🗑️
</button>

            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
