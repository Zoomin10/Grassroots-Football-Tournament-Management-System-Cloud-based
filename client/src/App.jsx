import { useEffect, useState } from 'react';
import './App.css';
import AddTeam from './AddTeam';
import TeamList from './TeamList';
import LeagueTable from './LeagueTable';
import Fixtures from './Fixtures';
import AddFixture from './AddFixture';

function App() {
  const [teams, setTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [league, setLeague] = useState([]);
  const [leagueId, setLeagueId] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [fixturesKey, setFixturesKey] = useState(0);
  

  const reloadAll = () => setReloadKey(prev => prev + 1);

  const reloadData = () => {
  // ✅ Fetch TEAMS
  fetch(`/api/teams?leagueId=${leagueId}`)
    .then(res => res.json())
    .then(setTeams)
    .catch(err => console.error('❌ Fetch teams error:', err));

  // ✅ Fetch LEAGUE TABLE
  fetch(`/api/league?leagueId=${leagueId}`)
    .then(res => res.json())
    .then(data => {
      const formatted = data.map(t => ({
        ...t,
        games_played: t.played,
        goal_difference: t.goals_for - t.goals_against
      }));
      setLeague(formatted);
    })
    .catch(err => console.error('❌ Fetch league error:', err));

  // ✅ Fetch FIXTURES
  fetch(`/api/matches?leagueId=${leagueId}`)
    .then(res => res.json())
    .then(setFixtures)
    .catch(err => console.error('❌ Fetch fixtures error:', err));
};


  useEffect(() => {
    reloadData();
  }, [leagueId, reloadKey]);

  const refreshFixtures = () => {
    setFixturesKey(prev => prev + 1);
  };

  const handleDeleteFixture = async (id) => {
    try {
      const res = await fetch(`/api/matches/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete fixture');
      reloadAll();
    } catch (err) {
      console.error('❌ Delete fixture error:', err);
    }
  };

  return (
    <div className="App">
      <header className="app-title">
        <img src="/logos/wroughtonyouthfc.png" alt="Logo" className="title-logo" />
        <h1>Wroughton Youth FC</h1>
        <h1>Summer Tournament</h1>
      </header>

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

          <div style={{ margin: '1rem 0' }}>
            <label style={{ fontWeight: 'bold' }}>
              League:&nbsp;
              <select
                value={leagueId}
                onChange={e => setLeagueId(Number(e.target.value))}
              >
                <option value={1}>League A</option>
                <option value={2}>League B</option>
              </select>
            </label>
          </div>

           


      <div className="dashboard-wrapper">
        <div className="left-panel">
          <TeamList teams={teams} onDelete={reloadAll} />
          <AddTeam onAdd={reloadData} />
          <AddFixture  leagueId={leagueId}
            onFixturesUpdated={reloadData} 
          />
        </div>

        <div className="right-panel">
          <LeagueTable league={league} />
          <Fixtures
            key={fixturesKey}
            fixtures={fixtures} 
            onResultsUpdated={reloadData}
            onDelete={handleDeleteFixture}
          />
        </div>
      </div>

      <footer className="sponsor-footer">
        <h4>This WYFC tournament is proudly sponsored by :</h4>
        <div className="sponsor-logos">
          <img src="/sponsors/iew.png" alt="iew" />
          <img src="/sponsors/southby.png" alt="southby" />
          <img src="/sponsors/ajwaste.png" alt="ajwaste" />
          <img src="/sponsors/oceanescape.png" alt="oceanescape" />
          <img src="/sponsors/headstart.png" alt="headstart" />
          <img src="/sponsors/holloway.png" alt="holloway" />
          <img src="/sponsors/mjd.png" alt="mjd" />
        </div>
      </footer>
    </div>
  );
}

export default App;
