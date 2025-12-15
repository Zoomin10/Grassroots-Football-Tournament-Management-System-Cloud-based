export function formatLeague(data = []) {
  return data.map(t => ({
    ...t,
    games_played: t.played ?? 0,
    goal_difference:
      t.goal_difference ??
      ((Number(t.goals_for) || 0) - (Number(t.goals_against) || 0))
  }));
}
