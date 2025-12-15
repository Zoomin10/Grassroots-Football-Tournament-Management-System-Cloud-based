// src/pages/PublicView.jsx
import { useEffect, useState } from 'react';
import { formatLeague } from '../utils/formatLeague';
import LeagueTable from '../LeagueTable';
import Fixtures from '../Fixtures';
import KnockoutBracket from '../KnockoutBracket';

import './PublicView.css';

export default function PublicView() {
  const [leagueA, setLeagueA] = useState([]);
  const [leagueB, setLeagueB] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [knockouts, setKnockouts] = useState([]);
  const fixturesA = fixtures.filter(f => f.league_id === 1);
  const fixturesB = fixtures.filter(f => f.league_id === 2);


  useEffect(() => {
    // League tables
  fetch('/api/league?leagueId=1')
  .then(res => res.json())
  .then(data => setLeagueA(formatLeague(data)))
  .catch(err => console.error('❌ Fetch League A error:', err));

fetch('/api/league?leagueId=2')
  .then(res => res.json())
  .then(data => setLeagueB(formatLeague(data)))
  .catch(err => console.error('❌ Fetch League B error:', err));


    // League fixtures
    fetch('/api/matches')
      .then(res => res.json())
      .then(setFixtures);

    // Knockouts
    Promise.all([
      fetch('/api/matches?round=semi-final').then(r => r.json()),
      fetch('/api/matches?round=final').then(r => r.json())
    ]).then(([semis, finals]) => {
      setKnockouts([...semis, ...finals]);
    });
  }, []);

  return (
    <div className="public-dashboard">

  {/* LEAGUE A */}
  <section className="league-section">
    <h2 className="league-title">League A</h2>

    <LeagueTable league={leagueA} />

    <Fixtures
      fixtures={fixturesA}
      readOnly   // optional flag to hide delete/buttons
    />
  </section>

  {/* LEAGUE B */}
  <section className="league-section">
    <h2 className="league-title">League B</h2>

    <LeagueTable league={leagueB} />

    <Fixtures
      fixtures={fixturesB}
      readOnly
    />
  </section>

  {/* KNOCKOUTS */}
  <section className="knockout-stage-wrapper">
    <h2>🏆 Knockout Stage</h2>

    <KnockoutBracket
      matches={knockouts}
      readOnly
    />
  </section>

</div>

  );
}
