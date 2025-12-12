import React, { useState } from 'react';
import './AddTeam.css';

function AddTeam({ onAdd }) {
  const [team, setTeam] = useState('');
  const [age, setAge] = useState('');
  
  const [leagueId, setLeagueId] = useState(1); 
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team, age, leagueId }),
      });

      if (!res.ok) throw new Error('Failed to add team');
      setTeam('');
      setAge('');
      if (onAdd) onAdd(); // Refresh parent state
    } catch (err) {
      console.error('❌ Add team error:', err);
    }
  };

  return (
    <form className="add-team-form" onSubmit={handleSubmit}>
      <h2>Add Team</h2>
      <input
        type="text"
        placeholder="Team name"
        value={team}
        onChange={(e) => setTeam(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Age group"
        value={age}
        onChange={(e) => setAge(e.target.value)}
      />
      <select
        value={leagueId}
        onChange={(e) => setLeagueId(Number(e.target.value))}
      >
        <option value={1}>League A</option>
        <option value={2}>League B</option>
      </select>
      <button type="submit">Add Team</button>
    </form>
  );
}

export default AddTeam;
