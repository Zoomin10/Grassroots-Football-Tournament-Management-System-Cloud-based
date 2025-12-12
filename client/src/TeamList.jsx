import './TeamList.css';

function TeamList({ teams = [], onDelete }) {

  const getLogoSrc = (teamName) => {
    if (!teamName || typeof teamName !== 'string') {
      return '/logos/default.png';
    }

    const safeName = teamName
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');

    return `/logos/${safeName}.png`;
  };

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
// console.log('TeamList first team:', teams[0]);


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
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/logos/default.png';
              }}
              className="team-logo"
            />
            <span className="team-name">{teamName}</span>
            <button
              className="delete-btn"
              onClick={() => handleDelete(team.id)}
            >
              🗑️
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default TeamList;

