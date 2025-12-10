import React, { useState } from 'react';
import './AddTeam.css';

function AddTeam({ onAdd }) {
  const [team, setTeam] = useState('');
  const [age, setAge] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team, age }),
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
      <button type="submit">Add Team</button>
    </form>
  );
}

export default AddTeam;
