import { useEffect, useState } from "react";
import { formatLeague } from "../utils/formatLeague";
import LeagueTable from "../LeagueTable";
import Fixtures from "../Fixtures";
import KnockoutBracket from "../KnockoutBracket";
import "../styles/public.css";

export default function PublicView() {
  const [tournament, setTournament] = useState(null);
  const [leagues, setLeagues] = useState([]);

  const [leagueA, setLeagueA] = useState([]);
  const [leagueB, setLeagueB] = useState([]);

  const [fixturesA, setFixturesA] = useState([]);
  const [fixturesB, setFixturesB] = useState([]);

  const [knockouts, setKnockouts] = useState([]);

  /* =========================
     Load active tournament
  ========================= */
  useEffect(() => {
    fetch("/api/tournaments/active")
      .then(res => res.json())
      .then(setTournament)
      .catch(err =>
        console.error("❌ Failed to load active tournament", err)
      );
  }, []);

  /* =========================
     Load leagues for tournament
  ========================= */
  useEffect(() => {
    if (!tournament?.id) return;

    fetch(`/api/leagues?tournamentId=${tournament.id}`)
      .then(res => res.json())
      .then(setLeagues)
      .catch(console.error);
  }, [tournament]);

  const leagueAInfo = leagues.find(l => l.name === "League A");
  const leagueBInfo = leagues.find(l => l.name === "League B");

  /* =========================
     Load tables + fixtures
  ========================= */
  useEffect(() => {
    if (!leagueAInfo || !leagueBInfo || !tournament?.id) return;

    // League tables
    fetch(
      `/api/league?leagueId=${leagueAInfo.id}&tournamentId=${tournament.id}`
    )
      .then(res => res.json())
      .then(data => setLeagueA(formatLeague(data)))
      .catch(console.error);

    fetch(
      `/api/league?leagueId=${leagueBInfo.id}&tournamentId=${tournament.id}`
    )
      .then(res => res.json())
      .then(data => setLeagueB(formatLeague(data)))
      .catch(console.error);

    // League fixtures
    fetch(
      `/api/matches?round=league&leagueId=${leagueAInfo.id}&tournamentId=${tournament.id}`
    )
      .then(res => res.json())
      .then(setFixturesA)
      .catch(console.error);

    fetch(
      `/api/matches?round=league&leagueId=${leagueBInfo.id}&tournamentId=${tournament.id}`
    )
      .then(res => res.json())
      .then(setFixturesB)
      .catch(console.error);

    // Knockouts
    Promise.all([
      fetch(
        `/api/matches?round=semi-final&tournamentId=${tournament.id}`
      ).then(r => r.json()),
      fetch(
        `/api/matches?round=final&tournamentId=${tournament.id}`
      ).then(r => r.json())
    ])
      .then(([semis, finals]) =>
        setKnockouts([...semis, ...finals])
      )
      .catch(console.error);

  }, [leagueAInfo, leagueBInfo, tournament]);

  return (
    <div className="public-view">
      <div className="public-container">
        <div className="public-page">
          <div className="public-dashboard">

            {tournament ? (
              <h2 className="tournament-title">
                {tournament.year} –{" "}
                {tournament.gender.charAt(0).toUpperCase() +
                  tournament.gender.slice(1)}{" "}
                {tournament.age_group}
              </h2>
            ) : (
              <h2 className="tournament-title">
                Loading tournament…
              </h2>
            )}

            <div className="public-leagues">
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
              <h2 className="knockout-title">
                🏆 Knockout Stage 🏆
              </h2>
              <KnockoutBracket
                matches={knockouts}
                readOnly
              />
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}