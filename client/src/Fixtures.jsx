import { useEffect, useState } from 'react';
import './Fixtures.css';

export default function Fixtures({ onResultsUpdated, onDelete, fixturesKey }) {
  const [localFixtures, setLocalFixtures] = useState([]);

  const loadFixtures = () => {
    fetch('/api/matches')
      .then(res => res.json())
      .then(data => setLocalFixtures(data))
      .catch(err => {
        console.error('❌ Load fixtures error:', err);
        alert('Failed to load fixtures');
      });
  };

  // Reload when fixturesKey changes
  useEffect(() => {
    console.log("📦 Fixtures loading..."); 
    loadFixtures();    
  }, [fixturesKey]);

  const handleSubmitResult = (id, homeScore, awayScore) => {
    fetch(`/api/matches/${id}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        home_score: parseInt(homeScore),
        away_score: parseInt(awayScore)
      })
    })
      .then(() => {
        if (typeof onResultsUpdated === 'function') onResultsUpdated();
        loadFixtures(); // Local update
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
        {localFixtures.map(fx => (
          <li key={fx.id} className="fixture-card">
            <div className="fixture-content">

              {/* Team vs Team Line */}
             <div className="fixture-line fixture-teams-balanced">
                <span className="fixture-team home">{fx.home_team}</span>
                <span className="vs">vs</span>
  <             span className="fixture-team away">{fx.away_team}</span>
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
                    const home = e.target.home.value;
                    const away = e.target.away.value;
                    handleSubmitResult(fx.id, home, away);
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
                className="delete-btn"
                onClick={() => {
                  if (typeof onDelete === 'function') {
                  onDelete(fx.id);
                  }                
                  loadFixtures();
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
