import React from 'react';
import './TeamList.css';

function TeamList({ teams, onDelete }) {
  const getLogoSrc = (teamName) => {
    const safeName = teamName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    return `/logos/${safeName}.png`;
  };

  const handleDelete = async (teamName) => {
    try {
      const res = await fetch(`/api/teams/${encodeURIComponent(teamName)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete team');
      if (onDelete) onDelete();
    } catch (err) {
      console.error('❌ Delete team error:', err);
    }
  };

  return (
    <div className="team-list">
      <h2>Teams</h2>
      {teams.map(team => (
        <div key={team.team} className="team-card">
          <img
            src={getLogoSrc(team.team)}
            alt={team.team}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/logos/default.png';
            }}
            className="team-logo"
          />
          <span className="team-name">{team.team}</span>
          <button className="delete-btn" onClick={() => handleDelete(team.id)}>
  🗑️
</button>

        </div>
      ))}
    </div>
  );
}

export default TeamList;

