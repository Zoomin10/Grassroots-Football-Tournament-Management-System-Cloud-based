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
  const [tournament, setTournament] = useState(null);
  const fixturesA = fixtures.filter(f => f.league_id === 1);
  const fixturesB = fixtures.filter(f => f.league_id === 2);

  useEffect(() => {
    fetch("/api/tournaments/active")
    .then(res => res.json())
    .then(data => setTournament(data))
    .catch(err => console.error("Failed to load tournament", err));

    fetch('/api/league?leagueId=1')
      .then(res => res.json())
      .then(data => setLeagueA(formatLeague(data)))
      .catch(console.error);

    fetch('/api/league?leagueId=2')
      .then(res => res.json())
      .then(data => setLeagueB(formatLeague(data)))
      .catch(console.error);

    fetch('/api/matches')
      .then(res => res.json())
      .then(setFixtures)
      .catch(console.error);

    Promise.all([
      fetch('/api/matches?round=semi-final').then(r => r.json()),
      fetch('/api/matches?round=final').then(r => r.json())
    ])
      .then(([semis, finals]) => {
        setKnockouts([...semis, ...finals]);
      })
      .catch(console.error);
  }, []);

  return (
  
   <div className="public-page">
  <div className="public-dashboard">
{tournament ? (
  <h2 className="tournament-title">
    {tournament.year} –{" "}
    {tournament.gender.charAt(0).toUpperCase() + tournament.gender.slice(1)}{" "}
    {tournament.age_group}
  </h2>
) : (
  <h2 className="tournament-title">Loading tournament…</h2>
)}



    <div className="leagues-row">
      <section className="league-section">
        <h2>League A</h2>
         <div className="league-table-wrapper">
            <LeagueTable league={leagueA} />
          </div>        
        <Fixtures fixtures={fixturesA} readOnly />
        
        </section>
       <section className="league-section">   
        <h2>League B</h2>
         <div className="league-table-wrapper">
        <LeagueTable league={leagueB} />
        </div>
        <Fixtures fixtures={fixturesB} readOnly />
      </section>
    </div>

    <section className="knockout-stage-wrapper">
      <h2>🏆 Knockout Stage 🏆 </h2>
      <KnockoutBracket matches={knockouts} readOnly />
    </section>

  </div>
</div>

  );
}
