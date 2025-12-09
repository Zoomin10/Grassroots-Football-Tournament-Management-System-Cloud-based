import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then(data => setTeams(data))
      .catch(err => console.error('❌ Fetch error:', err));
  }, []);

  const handleAddTeam = (e) => {
    e.preventDefault();
    const form = e.target;
    const team = form.team.value.trim();
    const age = form.age.value.trim();

    if (!team) {
      alert('Team name is required');
      return;
    }

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team, age: age || null }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to add team');
        return res.json();
      })
      .then(newTeam => {
        setTeams(prev => [...prev, newTeam]);
        form.reset();
      })
      .catch(err => {
        console.error('❌ Add team error:', err);
        alert('Failed to add team');
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this team?')) return;

    fetch(`/api/users/${id}`, {
      method: 'DELETE',
  

    })
      .then(res => {
        if (res.status === 204) {
          setTeams(prev => prev.filter(team => team.id !== id));
        } else {
          throw new Error('Failed to delete');
        }
      })
      .catch(err => {
        console.error('❌ Delete error:', err);
        alert('Failed to delete team');
      });
  };

  const getLogoPath = (name) => {
    const slug = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '');
    return `/logos/${slug}.png`;
  };

  const sortedLeague = [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = (a.gf || 0) - (a.ga || 0);
    const gdB = (b.gf || 0) - (b.ga || 0);
    return gdB - gdA;
  });

  return (
    <div style={{ display: 'flex', gap: '2rem', padding: '2rem' }}>
      {/* TEAM LIST + ADD FORM */}
      <div style={{ flex: 1 }}>
        <h1 className="page-title">Wroughton Youth FC – Summer Tournament</h1>

        <form onSubmit={handleAddTeam}
          style={{
            marginBottom: '2rem',
            background: '#f9f9f9',
            padding: '1rem',
            borderRadius: '8px',
            maxWidth: '400px'
          }}
        >
          <h2>Add New Team</h2>
          <input
            type="text"
            name="team"
            placeholder="Team Name"
            required
            style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
          />
          <input
            type="number"
            name="age"
            placeholder="Age (optional)"
            style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
          />
          <button type="submit" style={{ padding: '0.5rem 1rem' }}>
            Add Team
          </button>
        </form>

        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {teams.map(team => (
            <li key={`team-${team.id || team.team}`} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              border: '1px solid #ddd',
              padding: '0.5rem 1rem',
              borderRadius: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img
                  src={getLogoPath(team.team)}
                  alt={`${team.team} logo`}
                  style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/logos/default.png';
                  }}
                />
                <div>
                  <strong>{team.team}</strong>
                  {team.age && <div style={{ fontSize: '0.9rem' }}>Age: {team.age}</div>}
                </div>
              </div>
              <button onClick={() => handleDelete(team.id)} style={{
                background: '#f44336',
                color: '#fff',
                border: 'none',
                padding: '0.4rem 0.7rem',
                cursor: 'pointer',
                borderRadius: '4px'
              }}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* LEAGUE TABLE */}
      <div style={{ flex: 1 }}>
        <h2>League Table</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#eee' }}>
              <th style={cellStyle}>Team</th>
              <th style={cellStyle}>P</th>
              <th style={cellStyle}>W</th>
              <th style={cellStyle}>D</th>
              <th style={cellStyle}>L</th>
              <th style={cellStyle}>GF</th>
              <th style={cellStyle}>GA</th>
              <th style={cellStyle}>GD</th>
              <th style={cellStyle}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {sortedLeague.map(team => {
              const gd = (team.gf || 0) - (team.ga || 0);
              return (
                <tr key={`row-${team.id || team.team}`}>
                  <td style={cellStyle}>{team.team}</td>
                  <td style={cellStyle}>{team.played}</td>
                  <td style={cellStyle}>{team.won}</td>
                  <td style={cellStyle}>{team.drawn}</td>
                  <td style={cellStyle}>{team.lost}</td>
                  <td style={cellStyle}>{team.gf}</td>
                  <td style={cellStyle}>{team.ga}</td>
                  <td style={cellStyle}>{gd}</td>
                  <td style={cellStyle}><strong>{team.points}</strong></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cellStyle = {
  border: '1px solid #ccc',
  padding: '0.4rem',
  textAlign: 'center'
};

export default App;
