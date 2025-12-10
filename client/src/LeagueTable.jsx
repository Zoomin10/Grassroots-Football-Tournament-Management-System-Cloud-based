import './LeagueTable.css';

export default function LeagueTable({ league = [] }) {
  const getLogo = (teamName) => {
    const cleanName = teamName.toLowerCase().replace(/\s/g, '');
    return `/logos/${cleanName}.png`; // expects logos in public/logos/
  };

  return (
    <div className="league-table">
      <h2>🏆 League Table</h2>
      <table>
        <thead>
          <tr>
            <th>Team</th>
            <th>Points</th>
            <th>GD</th>
          </tr>
        </thead>
        <tbody>
          {league.length > 0 ? (
            league.map((team, index) => (
              <tr key={team.team || index}>
                <td className="team-name-cell">
                  <img
                    src={getLogo(team.team)}
                    onError={(e) => (e.target.src = '/logos/default.png')}
                    alt="logo"
                    className="team-logo"
                  />
                  {team.team}
                </td>
                <td>{team.points}</td>
                <td>{team.goal_difference}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">No data available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
