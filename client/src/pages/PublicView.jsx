// src/pages/PublicView.jsx
import { useEffect, useState } from 'react';

import LeagueTable from '../LeagueTable';
import Fixtures from '../Fixtures';
import KnockoutBracket from '../KnockoutBracket';

import './PublicView.css';

export default function PublicView() {
  const [leagueA, setLeagueA] = useState([]);
  const [leagueB, setLeagueB] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [knockouts, setKnockouts] = useState([]);

  useEffect(() => {
    // League tables
    fetch('/api/league?leagueId=1')
      .then(res => res.json())
      .then(setLeagueA);

    fetch('/api/league?leagueId=2')
      .then(res => res.json())
      .then(setLeagueB);

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
    <div className="public-view">

      {/* Tables */}
      <section className="public-tables">
        <div className="table-column">
          <h2>League A</h2>
          <LeagueTable league={leagueA} />
        </div>

        <div className="table-column">
          <h2>League B</h2>
          <LeagueTable league={leagueB} />
        </div>
      </section>

      {/* Fixtures */}
      <section className="public-fixtures">
        <h2>Fixtures & Results</h2>
        <Fixtures fixtures={fixtures} />
      </section>

      {/* Knockouts */}
      <section className="public-knockouts">
        <h2>🏆 Knockout Stage</h2>
        <KnockoutBracket matches={knockouts} />
      </section>

    </div>
  );
}
