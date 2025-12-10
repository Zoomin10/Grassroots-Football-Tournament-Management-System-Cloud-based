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
  const [reloadKey, setReloadKey] = useState(0);

  // Load data from backend
  useEffect(() => {
    fetchTeams();
    fetchFixtures();
    fetchLeague();
  }, [reloadKey]);

  const reloadAll = () => setReloadKey(prev => prev + 1);

  const reloadData = () => {
    fetch('/api/teams')
      .then(res => res.json())
      .then(setTeams)
      .catch(err => console.error('❌ Fetch teams error:', err));

    fetch('/api/league')
      .then(res => res.json())
      .then(setLeague)
      .catch(err => console.error('❌ Fetch league error:', err));

    fetch('/api/matches')
      .then(res => res.json())
      .then(setFixtures)
      .catch(err => console.error('❌ Fetch fixtures error:', err));
  };

  useEffect(() => {
    reloadData();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setTeams(data);
    } catch (err) {
      console.error('❌ Fetch teams error:', err);
    }
  };

  const fetchFixtures = async () => {
    try {
      const res = await fetch('/api/matches');
      const data = await res.json();
      setFixtures(data);
    } catch (err) {
      console.error('❌ Fetch fixtures error:', err);
    }
  };

  const fetchLeague = async () => {
    try {
      const res = await fetch('/api/league');
      const data = await res.json();
      setLeague(data);
    } catch (err) {
      console.error('❌ Fetch league error:', err);
    }
  };

  const handleAddFixture = async (homeTeam, awayTeam) => {
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ home_team: homeTeam, away_team: awayTeam }),
      });
      if (!res.ok) throw new Error('Failed to create fixture');
      reloadAll();
    } catch (err) {
      console.error('❌ Add fixture error:', err);
    }
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

  const updateLeague = () => {
    fetchLeague();
    fetchFixtures();
  };

  return (
    <div className="App">
      <header className="app-title">
        <img src="/logos/wroughtonyouthfc.png" alt="Logo" className="title-logo" />
        <h1>Wroughton Youth FC - Summer Tournament</h1>
      </header>

      <div className="dashboard-wrapper">
        <div className="left-panel">
         
          <TeamList teams={teams} onDelete={reloadAll} />
           <AddTeam onAdd={reloadData} />
          <AddFixture teams={teams} onAdd={handleAddFixture} />
        </div>

        <div className="right-panel">
          <LeagueTable data={league} />
          
          
          <Fixtures
            fixtures={fixtures}
            onDelete={handleDeleteFixture}
            onUpdateResult={updateLeague}
          />
        </div>
      </div>
    </div>
  );
}

export default App;

