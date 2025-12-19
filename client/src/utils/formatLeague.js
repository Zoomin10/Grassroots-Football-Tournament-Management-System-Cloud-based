export function formatLeague(data) {
  if (!Array.isArray(data)) {
    console.warn("⚠️ formatLeague received non-array:", data);
    return [];
  }

  return data.map(row => ({
    team: row.team,
    games_played: Number(row.played ?? 0),
    points: Number(row.points ?? 0),
    goal_difference:
      Number(row.goals_for ?? 0) - Number(row.goals_against ?? 0),
  }));
}