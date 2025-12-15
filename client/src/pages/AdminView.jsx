// src/pages/AdminView.jsx
import LeagueTable from '../LeagueTable';
import TeamList from '../TeamList';
import AddTeam from '../AddTeam';
import Fixtures from '../Fixtures';
import AddFixture from '../AddFixture';
import KnockoutBracket from '../KnockoutBracket';

export default function AdminView({
  teams,
  league,
  fixtures,
  knockouts,
  leagueId,
  setLeagueId,
  reloadData,
  reloadAll,
  resetMatches,
  handleDeleteFixture
 

}) {
  return (
    <div className="admin-view">

      {/* 🔐 ADMIN BANNER */}
      <div className="admin-banner">
        🔐 Admin Mode
      </div>

      {/* League Selector */}
      <div className="league-selector">
        <span className="league-label">League:</span>

        <button
          className={leagueId === 1 ? 'league-btn active' : 'league-btn'}
          onClick={() => setLeagueId(1)}
        >
          League A
        </button>

        <button
          className={leagueId === 2 ? 'league-btn active' : 'league-btn'}
          onClick={() => setLeagueId(2)}
        >
          League B
        </button>
      </div>

      <h3 className="active-league-title">
        {leagueId === 1 ? 'League A' : 'League B'}
      </h3>

      {/* 🔥 ADMIN CONTROLS */}
      <div className="admin-controls">
        <button
          className="admin-danger-btn"
          onClick={resetMatches}
        >
          🔥 Reset Fixtures & Results
        </button>

        <button
          className="admin-btn"
          onClick={() => {
            if (!window.confirm('Regenerate knockout stage?')) return;

            fetch('/api/knockout/regenerate', { method: 'POST' })
              .then(res => {
                if (!res.ok) throw new Error('Failed');
                return res.json();
              })
              .then(() => reloadData())
              .catch(() => alert('Failed to regenerate knockouts'));
          }}
        >
          🔄 Regenerate Knockouts
        </button>
      </div>

      {/* MAIN ADMIN DASHBOARD */}
      <div className="dashboard-wrapper">

        {/* LEFT PANEL – TEAM & FIXTURE MANAGEMENT */}
        <div className="left-panel">
          <TeamList teams={teams} onDelete={reloadAll} />
          <AddTeam onAdd={reloadData} />

          <AddFixture
            leagueId={leagueId}
            onFixturesUpdated={reloadData}
          />
        </div>

        {/* RIGHT PANEL – TABLES & FIXTURES */}
        <div className="right-panel">
          <LeagueTable league={league} />

          <Fixtures
            fixtures={fixtures}
            onResultsUpdated={reloadData}
            onDelete={handleDeleteFixture}
          />
        </div>
      </div>

      {/* 🏆 KNOCKOUT STAGE */}
      <section className="knockout-stage-wrapper">
        <h2 className="knockout-stage-title">🏆 Knockout Stage (Admin)</h2>

        <KnockoutBracket
          matches={knockouts}
          onDelete={handleDeleteFixture}
          onResultsUpdated={reloadData}
        />
      </section>

    </div>
  );
}
