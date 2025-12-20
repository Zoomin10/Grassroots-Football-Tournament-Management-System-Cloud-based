import { useEffect, useState } from "react";
import { formatLeague } from "../utils/formatLeague";
import LeagueTable from "../LeagueTable";
import Fixtures from "../Fixtures";
import KnockoutBracket from "../KnockoutBracket";
import "../styles/public.css";

export default function PublicView() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);

  const [leagues, setLeagues] = useState([]);
  const [leagueA, setLeagueA] = useState([]);
  const [leagueB, setLeagueB] = useState([]);

  const [fixturesA, setFixturesA] = useState([]);
  const [fixturesB, setFixturesB] = useState([]);
  const [knockouts, setKnockouts] = useState([]);

  const selectedTournament = tournaments.find(
    t => t.id === selectedTournamentId
  );

  /* =========================
     Load tournaments
  ========================= */
  useEffect(() => {
    fetch("/api/tournaments")
      .then(res => res.json())
      .then(data => {
        setTournaments(data);
        if (data.length && !selectedTournamentId) {
          setSelectedTournamentId(data[0].id);
        }
      })
      .catch(err => console.error("❌ Failed to load tournaments", err));
  }, []);

  /* =========================
     Load leagues for tournament
  ========================= */
  useEffect(() => {
    if (!selectedTournamentId) {
      setLeagues([]);
      return;
    }

    fetch(`/api/leagues?tournamentId=${selectedTournamentId}`)
      .then(res => res.json())
      .then(setLeagues)
      .catch(err => console.error("❌ Fetch leagues error:", err));
  }, [selectedTournamentId]);

  const leagueAInfo = leagues.find(l => l.name === "League A");
  const leagueBInfo = leagues.find(l => l.name === "League B");

  /* =========================
     Load tables, fixtures, knockouts
  ========================= */
  useEffect(() => {
    if (!selectedTournamentId || !leagueAInfo || !leagueBInfo) {
      setLeagueA([]);
      setLeagueB([]);
      setFixturesA([]);
      setFixturesB([]);
      setKnockouts([]);
      return;
    }

    // League tables
    fetch(
      `/api/league?leagueId=${leagueAInfo.id}&tournamentId=${selectedTournamentId}`
    )
      .then(res => res.json())
      .then(data => setLeagueA(formatLeague(data)))
      .catch(console.error);

    fetch(
      `/api/league?leagueId=${leagueBInfo.id}&tournamentId=${selectedTournamentId}`
    )
      .then(res => res.json())
      .then(data => setLeagueB(formatLeague(data)))
      .catch(console.error);

    // League fixtures
    fetch(
      `/api/matches?round=league&leagueId=${leagueAInfo.id}&tournamentId=${selectedTournamentId}`
    )
      .then(res => res.json())
      .then(setFixturesA)
      .catch(console.error);

    fetch(
      `/api/matches?round=league&leagueId=${leagueBInfo.id}&tournamentId=${selectedTournamentId}`
    )
      .then(res => res.json())
      .then(setFixturesB)
      .catch(console.error);

    // Knockouts
    Promise.all([
      fetch(
        `/api/matches?round=semi-final&tournamentId=${selectedTournamentId}`
      ).then(r => r.json()),
      fetch(
        `/api/matches?round=final&tournamentId=${selectedTournamentId}`
      ).then(r => r.json())
    ])
      .then(([semis, finals]) =>
        setKnockouts([...semis, ...finals])
      )
      .catch(console.error);

  }, [selectedTournamentId, leagueAInfo, leagueBInfo]);

  return (
    <div className="public-view">
      <div className="public-container">
        <div className="public-dashboard">

          {selectedTournament ? (
            <h2 className="tournament-title">
              {selectedTournament.year} –{" "}
              {selectedTournament.gender.charAt(0).toUpperCase() +
                selectedTournament.gender.slice(1)}{" "}
              {selectedTournament.age_group}
            </h2>
          ) : (
            <h2 className="tournament-title">Select a tournament</h2>
          )}

          <div className="public-tournament-selector">
            <label>Select Tournament</label>
            <select
              value={selectedTournamentId || ""}
              onChange={e =>
                setSelectedTournamentId(Number(e.target.value))
              }
            >
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>
                  {t.year} – {t.gender} {t.age_group}
                </option>
              ))}
            </select>
          </div>

          <div className="public-leagues">
            <section className="league-section">
              <h2>League A</h2>
              <LeagueTable league={leagueA} />
              <Fixtures fixtures={fixturesA} readOnly />
            </section>

            <section className="league-section">
              <h2>League B</h2>
              <LeagueTable league={leagueB} />
              <Fixtures fixtures={fixturesB} readOnly />
            </section>
          </div>

          <section className="knockout-stage-wrapper">
            <h2 className="knockout-title">🏆 Knockout Stage 🏆</h2>
            <KnockoutBracket matches={knockouts} readOnly />
          </section>

        </div>
      </div>
    </div>
  );
}