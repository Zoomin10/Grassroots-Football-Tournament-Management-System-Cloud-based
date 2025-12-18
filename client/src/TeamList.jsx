import './TeamList.css';
import { getLogoSrc } from './utils/getLogoSrc';

function TeamList({ teams = [], onDelete, readOnly = false }) {

  const handleDelete = async (teamId) => {
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete team');
      if (typeof onDelete === 'function') onDelete();
    } catch (err) {
      console.error('❌ Delete team error:', err);
    }
  };

  return (
    <div className="team-list">
      <h2>Teams</h2>

      {teams.map(team => {
        const teamName = team.team || team.name || '';

        return (
          <div key={team.id} className="team-card">
            <img
              src={getLogoSrc(teamName)}
              alt={teamName}
              className="team-logo"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = '/logos/default.png';
              }}
            />

            <span className="team-name">{teamName}</span>

            {!readOnly && typeof onDelete === 'function' && (
              <button
                className="delete-btn"
                onClick={() => handleDelete(team.id)}
              >
                🗑️
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default TeamList;
