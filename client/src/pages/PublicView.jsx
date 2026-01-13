import { useEffect, useState } from "react";
import { useRef } from "react";
import { formatLeague } from "../utils/formatLeague";
import LeagueTable from "../LeagueTable";
import Fixtures from "../Fixtures";
import KnockoutBracket from "../KnockoutBracket";
import "../styles/public.css";
import "../styles/print.css";


export default function PublicView() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);

  const [leagues, setLeagues] = useState([]);
  const [leagueA, setLeagueA] = useState([]);
  const [leagueB, setLeagueB] = useState([]);
  const params = new URLSearchParams(window.location.search);
  const isPrintMode = params.get("print") === "true";


  const hasPrinted = useRef(false);

  const [fixturesA, setFixturesA] = useState([]);
  const [fixturesB, setFixturesB] = useState([]);
  const [knockouts, setKnockouts] = useState([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const selectedTournament = tournaments.find(
    t => t.id === selectedTournamentId
  );

  const tournamentIdFromUrl = params.get("tournamentId")
  ? Number(params.get("tournamentId"))
  : null;

useEffect(() => {
  if (isPrintMode) return;

  const interval = setInterval(() => {
    setRefreshTick(t => t + 1);
  }, 60000);

  return () => clearInterval(interval);
}, [isPrintMode]);

useEffect(() => {
  if (!isPrintMode) return;
  if (!selectedTournamentId) return;
  if (hasPrinted.current) return;

  hasPrinted.current = true;

  // Give React + layout time to settle
  const timeout = setTimeout(() => {
    window.print();
  }, 800);

  return () => clearTimeout(timeout);
}, [isPrintMode, selectedTournamentId]);


  /* =========================
     Load tournaments
  ========================= */
useEffect(() => {
  fetch("/api/tournaments")
    .then(res => res.json())
    .then(data => {
      setTournaments(data);

      if (!selectedTournamentId) {
        if (tournamentIdFromUrl) {
          setSelectedTournamentId(tournamentIdFromUrl);
        } else if (data.length) {
          setSelectedTournamentId(data[0].id);
        }
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

    // Knockouts (semis + finals)
    Promise.all([
      fetch(
        `/api/matches?round=semi-final&tournamentId=${selectedTournamentId}`
      ).then(r => r.json()),
      fetch(
        `/api/matches?round=final&tournamentId=${selectedTournamentId}`
      ).then(r => r.json())
    ])
      .then(([semis, finals]) => {
        setKnockouts([...semis, ...finals]);
      })
      .catch(console.error);

  }, [selectedTournamentId, leagueAInfo, leagueBInfo, refreshTick]);

  /* =========================
     Derive winners (robust)
  ========================= */
  const getFinalResult = (bracket) => {
    const final = knockouts.find(
      m =>
        m.round === "final" &&
        m.bracket === bracket &&
        m.home_score !== null &&
        m.away_score !== null
    );

    if (!final) return null;

    const homeName =
      final.home_team_name || final.home_team || `Team ${final.home_team_id}`;
    const awayName =
      final.away_team_name || final.away_team || `Team ${final.away_team_id}`;

  let winner = null;
let runnerUp = null;

if (final.home_score > final.away_score) {
  winner = homeName;
  runnerUp = awayName;
} else if (final.away_score > final.home_score) {
  winner = awayName;
  runnerUp = homeName;
} else if (
  final.decided_by_penalties &&
  final.penalties_home != null &&
  final.penalties_away != null
) {
  const homeWonPens = Number(final.penalties_home) > Number(final.penalties_away);
  winner = homeWonPens ? homeName : awayName;
  runnerUp = homeWonPens ? awayName : homeName;
} else {
  // still unresolved / should not happen for finals, but safe
  return null;
}

return { winner, runnerUp };

    const runnerUp =
      final.home_score > final.away_score ? awayName : homeName;

    return { winner, runnerUp };
  };

  const cupResult = getFinalResult("cup");
  const plateResult = getFinalResult("plate");

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  return timeStr.slice(0, 5); // HH:MM
};

  /* =========================
     Render
  ========================= */
  return (
  <div className="public-view">
    <div className="public-container">
      <div className="public-dashboard">

        {/* 🎉 Celebration Banner */}
        {(cupResult || plateResult) && (
          <section className="celebration-banner celebration-banner--public">
            <h2>🎉 Tournament Results 🎉</h2>

            {cupResult && (
              <div className="celebration-card cup">
                <h3>🏆 Cup Competition</h3>
                <p><strong>Winners:</strong> {cupResult.winner}</p>
                <p><strong>Runners-up:</strong> {cupResult.runnerUp}</p>
              </div>
            )}

            {plateResult && (
              <div className="celebration-card plate">
                <h3>🥈 Plate Competition</h3>
                <p><strong>Winners:</strong> {plateResult.winner}</p>
                <p><strong>Runners-up:</strong> {plateResult.runnerUp}</p>
              </div>
            )}
          </section>
        )}

        {/* Header */}
        <div className="public-header">
          {selectedTournament ? (
            <>
              <h2 className="tournament-title">
                {selectedTournament.year} –{" "}
                {selectedTournament.gender.charAt(0).toUpperCase() +
                  selectedTournament.gender.slice(1)}{" "}
                {selectedTournament.age_group}
              </h2>

              {(selectedTournament.date ||
                selectedTournament.kickoff_time ||
                selectedTournament.venue) && (
                <div className="tournament-meta">
                  {selectedTournament.date && (
                    <span>📅 {formatDate(selectedTournament.date)}</span>
                  )}
                  {selectedTournament.kickoff_time && (
                    <span>⏰ Kickoff {formatTime(selectedTournament.kickoff_time)}</span>
                  )}
                  {selectedTournament.venue && (
                    <span>📍 {selectedTournament.venue}</span>
                  )}
                </div>
              )}

              {(selectedTournament.pitch_league_a ||
                selectedTournament.pitch_league_b) && (
                <div className="tournament-meta">
                  {selectedTournament.pitch_league_a && (
                    <span>🟦 League A – {selectedTournament.pitch_league_a}</span>
                  )}
                  {selectedTournament.pitch_league_b && (
                    <span>⬜ League B  – {selectedTournament.pitch_league_b}</span>
                  )}
                </div>
              )}
            </>
          ) : (
            <h2 className="tournament-title">Select a tournament</h2>
          )}

          <div className="public-tournament-selector">
            <label htmlFor="tournament-select">Select Tournament</label>
            <select
              id="tournament-select"
              value={selectedTournamentId || ""}
              onChange={e => setSelectedTournamentId(Number(e.target.value))}
            >
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>
                  {t.year} – {t.gender} {t.age_group}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p style={{ fontSize: "0.85rem", color: "#666", textAlign: "center" }}>
          🔄 Scores update automatically
        </p>

        {/* Leagues */}
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

        {/* Knockouts */}
        <section className="knockout-stage-wrapper">
          <h2 className="knockout-title">🏆 Knockout Stage 🏆</h2>
          <KnockoutBracket matches={knockouts} readOnly />
        </section>

      </div>
    </div>
  </div>
);
}