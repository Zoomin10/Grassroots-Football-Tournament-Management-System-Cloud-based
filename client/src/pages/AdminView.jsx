// src/pages/AdminView.jsx
import { useEffect, useState } from 'react';

import TeamList from '../TeamList';
import AddTeam from '../AddTeam';
import AddFixture from '../AddFixture';
import LeagueTable from '../LeagueTable';
import Fixtures from '../Fixtures';
import KnockoutBracket from '../KnockoutBracket';
import { formatLeague } from "../utils/formatLeague";


import '../App.css'; // reuse existing layout styles

export default function AdminView() {
  const [teams, setTeams] = useState([]);
  const [league, setLeague] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [knockouts, setKnockouts] = useState([]);
  const [leagueId, setLeagueId] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const formattedLeague = formatLeague(league);

  const reloadData = () => setReloadKey(k => k + 1);

  /* =========================
     DATA LOADING
  ========================= */
  useEffect(() => {
    // Teams
    fetch(`/api/teams?leagueId=${leagueId}`)
      .then(res => res.json())
      .then(setTeams)
      .catch(err => console.error('❌ Fetch teams error:', err));

    // League table
    fetch(`/api/league?leagueId=${leagueId}`)
      .then(res => res.json())
      .then(setLeague)
      .catch(err => console.error('❌ Fetch league error:', err));

    // League fixtures
    fetch(`/api/matches?leagueId=${leagueId}`)
      .then(res => res.json())
      .then(setFixtures)
      .catch(err => console.error('❌ Fetch fixtures error:', err));

    // Knockouts (Cup + Plate)
    Promise.all([
      fetch('/api/matches?round=semi-final').then(r => r.json()),
      fetch('/api/matches?round=final').then(r => r.json())
    ])
      .then(([semis, finals]) => setKnockouts([...semis, ...finals]))
      .catch(err => console.error('❌ Fetch knockouts error:', err));

  }, [leagueId, reloadKey]);

  /* =========================
     ADMIN ACTIONS
  ========================= */
  const handleDeleteFixture = async (id) => {
    try {
      const res = await fetch(`/api/matches/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      reloadData();
    } catch (err) {
      console.error('❌ Delete fixture error:', err);
    }
  };

  const resetMatches = async () => {
    if (!window.confirm('⚠️ Delete ALL fixtures & results?')) return;

    try {
      const res = await fetch('/api/admin/reset-matches', { method: 'POST' });
      if (!res.ok) throw new Error('Reset failed');
      reloadData();
    } catch (err) {
      console.error('❌ Reset error:', err);
    }
  };

  const regenerateKnockouts = async () => {
    if (!window.confirm('Regenerate knockout stage?')) return;

    try {
      const res = await fetch('/api/knockout/regenerate', { method: 'POST' });
      if (!res.ok) throw new Error('Regenerate failed');
      reloadData();
    } catch (err) {
      console.error('❌ Regenerate error:', err);
    }
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="App">

      <header className="app-title">
        <h1>🔐 Admin Control Panel</h1>
      </header>

      {/* League selector */}
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

      {/* Admin controls */}
      <div style={{ textAlign: 'center', margin: '1rem' }}>
        <button
          onClick={resetMatches}
          style={{ background: '#b00020', color: 'white', marginRight: '1rem' }}
        >
          🔥 Reset Tournament
        </button>

        <button onClick={regenerateKnockouts}>
          🔄 Regenerate Knockouts
        </button>
      </div>

      {/* Main admin dashboard */}
      <div className="dashboard-wrapper">
        <div className="left-panel">
          <TeamList teams={teams} onDelete={reloadData} />
          <AddTeam onAdd={reloadData} />
          <AddFixture leagueId={leagueId} onFixturesUpdated={reloadData} />
        </div>

        <div className="right-panel">
          
<LeagueTable league={formattedLeague} />

          <Fixtures
            fixtures={fixtures}
            onResultsUpdated={reloadData}
            onDelete={handleDeleteFixture}
          />
        </div>
      </div>

      {/* Knockouts */}
      <section className="knockout-stage-wrapper">
        <h2 className="knockout-stage-title">🏆 Knockout Stage</h2>

        <KnockoutBracket
          matches={knockouts}
          onDelete={handleDeleteFixture}
          onResultsUpdated={reloadData}
        />
      </section>
    </div>
  );
}
