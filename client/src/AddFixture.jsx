// client/src/AddFixture.jsx
import { useEffect, useState } from 'react';

export default function AddFixture({ onFixtureAdded }) {
  const [teams, setTeams] = useState([]);
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(setTeams)
      .catch(err => console.error('❌ Load teams error:', err));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (home === away || !home || !away) {
      alert('Choose two different teams');
      return;
    }

    fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        home_team_id: +home,
        away_team_id: +away
      }),
    })
      .then(res => res.json())
      .then(() => {
        alert('Fixture created!');
        if (onFixtureAdded) onFixtureAdded();
      })
      .catch(err => {
        console.error('❌ Fixture error:', err);
        alert('Error creating fixture');
      });
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
      <h3>Add Fixture</h3>
      <select value={home} onChange={e => setHome(e.target.value)}>
        <option value="">Home team</option>
        {teams.map(t => <option key={t.id} value={t.id}>{t.team}</option>)}
      </select>
      <select value={away} onChange={e => setAway(e.target.value)}>
        <option value="">Away team</option>
        {teams.map(t => <option key={t.id} value={t.id}>{t.team}</option>)}
      </select>
      <button type="submit">Add Fixture</button>
    </form>
  );
}
