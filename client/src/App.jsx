import { useEffect, useState } from 'react';
import './App.css';
import AddTeam from './AddTeam';
import TeamList from './TeamList';
import LeagueTable from './LeagueTable';
import Fixtures from './Fixtures';
import AddFixture from './AddFixture';
import KnockoutBracket from './KnockoutBracket';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PublicView from './pages/PublicView';
import AdminView from './pages/AdminView';


function App() {
  const [teams, setTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
const [fixturesA, setFixturesA] = useState([]);
const [fixturesB, setFixturesB] = useState([]);
  const [knockouts, setKnockouts] = useState([]);
  const [league, setLeague] = useState([]);
  const [leagueId, setLeagueId] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [fixturesKey, setFixturesKey] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const reloadAll = () => setReloadKey(prev => prev + 1);

<button onClick={() => setIsAdmin(a => !a)}>
  {isAdmin ? 'Switch to Public View' : 'Admin Login'}
</button>

  const reloadData = () => {
  // ✅ Fetch TEAMS
  fetch(`/api/teams?leagueId=${leagueId}`)
    .then(res => res.json())
    .then(setFixturesA)
    .catch(err => console.error('❌ Fetch teams error:', err));

// League B fixtures
fetch('/api/matches?leagueId=2')
  .then(res => res.json())
  .then(setFixturesB)
  .catch(err => console.error('❌ Fetch League B fixtures', err));

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
    <BrowserRouter>

      {/* Header always visible */}
      <header className="app-title">
        <img src="/logos/wroughtonyouthfc.png" alt="Logo" className="title-logo" />
        <h1>Wroughton Youth FC</h1>
        <h1>Summer Tournament</h1>
      </header>

      <Routes>
        <Route path="/" element={<PublicView />} />
        <Route path="/admin" element={<AdminView />} />
        <Route path="*" element={<PublicView />} />
      </Routes>

      {/* Footer always visible */}
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

    </BrowserRouter>
  );
}

export default App;