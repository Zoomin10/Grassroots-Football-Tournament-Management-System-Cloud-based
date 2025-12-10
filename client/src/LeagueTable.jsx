import React from 'react';
import './LeagueTable.css';

function LeagueTable({ data }) {
  return (
    <div className="league-table">
      <h2>League Table</h2>
      <table>
        <thead>
          <tr>
            <th>Team</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GD</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {data.map((team, idx) => (
            <tr key={`team-${team.team || idx}`}>
              <td>{team.team}</td>
              <td>{team.played}</td>
              <td>{team.wins}</td>
              <td>{team.draws}</td>
              <td>{team.losses}</td>
              <td>{team.goal_difference}</td>
              <td>{team.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LeagueTable;
