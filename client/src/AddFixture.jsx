import { useEffect, useState } from 'react';
import './AddFixture.css';

export default function AddFixture({ onFixturesUpdated }) {
  const [teams, setTeams] = useState([]);
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');

  useEffect(() => {
    fetch('/api/teams')
      .then(res => res.json())
      .then(data => setTeams(data))
      .catch(err => {
        console.error('❌ Load teams error:', err);
        alert('Failed to load teams');
      });
  }, []);

  const handleAddFixture = (e) => {
    e.preventDefault();

    if (homeTeam === awayTeam) {
      alert('A team cannot play against itself.');
      return;
    }

    fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        home_team_id: parseInt(homeTeam),
        away_team_id: parseInt(awayTeam)
      })
    })
      .then(() => {
        setHomeTeam('');
        setAwayTeam('');
        console.log("✅ Fixture added")
        if (typeof onFixturesUpdated === 'function') {
          onFixturesUpdated(); // Trigger reload in parent
        }
      })
      .catch(err => {
        console.error('❌ Add fixture error:', err);
        alert('Failed to add fixture');
      });
  };

  return (
    <div className="add-fixture-form">
      <h3>Add Fixture</h3>
      <form onSubmit={handleAddFixture}>
        <select value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} required>
          <option value="">Select Home Team</option>
          {teams.map(team => (
            <option key={team.id} value={team.id}>
              {team.team}
            </option>
          ))}
        </select>

        <select value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} required>
          <option value="">Select Away Team</option>
          {teams.map(team => (
            <option key={team.id} value={team.id}>
              {team.team}
            </option>
          ))}
        </select>

        <button type="submit">Add Fixture</button>
      </form>
    </div>
  );
}

