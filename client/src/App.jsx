import { useEffect, useState } from 'react';
import './App.css';
import AddTeam from './AddTeam';
import TeamList from './TeamList';
import LeagueTable from './LeagueTable';
import Fixtures from './Fixtures';
import AddFixture from './AddFixture';
import KnockoutBracket from './KnockoutBracket';


function App() {
  const [teams, setTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [knockouts, setKnockouts] = useState([]);
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

  // ✅ Fetch LEAGUE FIXTURES
  fetch(`/api/matches?leagueId=${leagueId}`)
    .then(res => res.json())
    .then(setFixtures)
    .catch(err => console.error('❌ Fetch fixtures error:', err));

  // 🔥 Fetch KNOCKOUTS (semi-finals + final)
  Promise.all([
    fetch('/api/matches?round=semi-final').then(r => r.json()),
    fetch('/api/matches?round=final').then(r => r.json())
  ])
    .then(([semis, finals]) => {
      setKnockouts([...semis, ...finals]);
    })
    .catch(err => console.error('❌ Fetch knockouts error:', err));
};


 const handleDeleteFixture = async (id) => {
  console.log('🔥 HANDLE DELETE FIXTURE', id);

  try {
    const res = await fetch(
      'http://localhost:3000/api/matches/' + id,
      { method: 'DELETE' }
    );

    console.log('🔥 DELETE RESPONSE STATUS', res.status);

    if (!res.ok) throw new Error('Failed to delete fixture');

    await reloadAll();
  } catch (err) {
    console.error('❌ Delete fixture error:', err);
  }
};

const resetMatches = async () => {
  const ok = window.confirm(
    '⚠️ This will delete ALL fixtures and results.\nTeams and logos will be kept.\n\nContinue?'
  );

  if (!ok) return;

  try {
    const res = await fetch('/api/admin/reset-matches', {
      method: 'POST'
    });

    if (!res.ok) throw new Error('Reset failed');

    reloadAll(); // refresh league, fixtures, knockouts
    alert('All match data cleared. Tournament reset.');
  } catch (err) {
    console.error(err);
    alert('Failed to reset match data');
  }
};

useEffect(() => {
  reloadData();
}, [leagueId, reloadKey]);


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
<button
  onClick={resetMatches}
  style={{
    background: '#b00020',
    color: 'white',
    padding: '8px 12px',
    marginTop: '1rem',
    borderRadius: '4px'
  }}
>
  🔥 Reset Fixtures & Results (Admin)
</button>

           


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

  <h2>Knockout Stage</h2>

  <KnockoutBracket
    matches={knockouts}
    onDelete={handleDeleteFixture}
    onResultsUpdated={reloadData}
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
      <button
  className="regenerate-btn"
  onClick={() => {
    if (!window.confirm('Regenerate knockout stage?')) return;

    fetch('/api/knockout/regenerate', { method: 'POST' })
      .then(res => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then(() => reloadData())
      .catch(err => alert('Failed to regenerate knockouts'));
  }}
>
  🔄 Regenerate Knockouts
</button>

    </div>
  );
}

export default App;
