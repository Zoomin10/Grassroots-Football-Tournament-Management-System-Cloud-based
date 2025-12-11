import './LeagueTable.css';

export default function LeagueTable({ league = [] }) {
  return (
    <div className="league-table">
      <h2>🏆   League Table   🏆</h2>

      <table>
        <thead>
          <tr>
            <th>Team</th>
             <th>Pl</th>
            <th>Pts</th>
            <th>GD</th>
          </tr>
        </thead>
        <tbody>
          {league.length > 0 ? (
            league.map((team, index) => (
              <tr key={team.name || index}>
                <td>{team.team}</td>
                <td>{team.games_played ?? 0}</td>
                <td>{team.points}</td>
                <td>{team.goal_difference}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No data available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
