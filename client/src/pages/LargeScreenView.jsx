import { useEffect, useMemo, useRef, useState } from "react";
import { getLogoSrc } from "../utils/getLogoSrc";

const ROTATE_MS = 15000;
const POLL_SCORES_MS = 4000;
const POLL_TOURNAMENTS_MS = 20000;
const LATEST_LIMIT = 6;


function formatGender(gender) {
  if (!gender) return "";
  return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
}

function tournamentLabel(t) {
  const parts = [];
  if (t.gender) parts.push(formatGender(t.gender));
  if (t.age_group) parts.push(t.age_group);
  if (t.year) parts.push(t.year);
  return parts.join(" • ");
}

function scoreLine(s) {
  // from /api/matches/latest: gender, age_group, home_team, away_team, home_score, away_score
  const prefix = [s.gender, s.age_group].filter(Boolean).join(" ");
  return `${prefix ? prefix + ": " : ""}${s.home_team} ${s.home_score}–${s.away_score} ${s.away_team}`;
}

function LeagueTable({ title, rows }) {
  return (
    <div className="tv-league-block">
      <div className="tv-league-title">{title}</div>

      {!rows ? (
        <div className="tv-loading">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="tv-empty">No teams yet.</div>
      ) : (
        <table className="tv-table">
          <thead>
              <tr>
    <th className="tv-col-team">Team</th>
    <th>P</th>
    <th>GF</th>
    <th>GA</th>
    <th>GD</th>
    <th className="tv-col-pts">Pts</th>
  </tr>
          </thead>
   <tbody>
  {rows.map((r) => {
    const goalDiff = r.goals_for - r.goals_against;

    return (
      <tr key={r.id}>
       <td className="tv-col-team">
  <div className="tv-team-cell">
    <img
      src={getLogoSrc(r.team)}
      alt={r.team}
      className="tv-team-logo"
    />
    <span className="tv-team-name">{r.team}</span>
  </div>
</td>
        <td>{r.played}</td>
        <td>{r.goals_for}</td>
        <td>{r.goals_against}</td>
        <td>{goalDiff}</td>
        <td className="tv-col-pts">{r.points}</td>
      </tr>
    );
  })}
</tbody>
        </table>
      )}
    </div>
  );
}

export default function LargeScreenView() {
  const [tournaments, setTournaments] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const [leagueA, setLeagueA] = useState(null);
  const [leagueB, setLeagueB] = useState(null);

  const [latestScores, setLatestScores] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  const rotateTimer = useRef(null);
  const tournamentsPoll = useRef(null);
  const scoresPoll = useRef(null);

  const activeTournament = useMemo(() => {
    if (!tournaments.length) return null;
    const idx = Math.max(0, Math.min(activeIndex, tournaments.length - 1));
    return tournaments[idx];
  }, [tournaments, activeIndex]);

  async function fetchTournaments() {
    try {
      const res = await fetch("/api/tournaments");
      const data = await res.json();
      setTournaments(Array.isArray(data) ? data : []);
      setStatus("ready");
    } catch (e) {
      console.error("TV: failed to fetch tournaments", e);
      setStatus("error");
    }
  }

  async function fetchLeaguesAndTables(tournamentId) {
    // Reset so the UI shows "Loading..." during tournament switch
    setLeagueA(null);
    setLeagueB(null);

    try {
      const leaguesRes = await fetch(`/api/leagues?tournamentId=${tournamentId}`);
      const leagues = await leaguesRes.json();

      const a = leagues.find((l) => l.name === "League A");
      const b = leagues.find((l) => l.name === "League B");

      const [aRows, bRows] = await Promise.all([
        a
          ? fetch(`/api/league?leagueId=${a.id}&tournamentId=${tournamentId}`).then((r) => r.json())
          : Promise.resolve([]),
        b
          ? fetch(`/api/league?leagueId=${b.id}&tournamentId=${tournamentId}`).then((r) => r.json())
          : Promise.resolve([]),
      ]);

      setLeagueA(Array.isArray(aRows) ? aRows : []);
      setLeagueB(Array.isArray(bRows) ? bRows : []);
    } catch (e) {
      console.error("TV: failed to fetch leagues/tables", e);
      setLeagueA([]);
      setLeagueB([]);
    }
  }

  async function fetchLatestScores() {
    try {
      const res = await fetch(`/api/matches/latest?limit=${LATEST_LIMIT}`);
      const data = await res.json();
      setLatestScores(Array.isArray(data) ? data.slice(0, LATEST_LIMIT) : []);
    } catch (e) {
      console.error("TV: failed to fetch latest scores", e);
    }
  }

  // Initial load + polling
  useEffect(() => {
    fetchTournaments();
    fetchLatestScores();

    tournamentsPoll.current = setInterval(fetchTournaments, POLL_TOURNAMENTS_MS);
    scoresPoll.current = setInterval(fetchLatestScores, POLL_SCORES_MS);

    return () => {
      if (tournamentsPoll.current) clearInterval(tournamentsPoll.current);
      if (scoresPoll.current) clearInterval(scoresPoll.current);
    };
  }, []);

  // Rotate tournaments
  useEffect(() => {
    if (rotateTimer.current) clearInterval(rotateTimer.current);

    rotateTimer.current = setInterval(() => {
      setActiveIndex((i) => {
        if (!tournaments.length) return 0;
        return (i + 1) % tournaments.length;
      });
    }, ROTATE_MS);

    return () => {
      if (rotateTimer.current) clearInterval(rotateTimer.current);
    };
  }, [tournaments.length]);

  // When active tournament changes, load its league tables
  useEffect(() => {
    if (!activeTournament?.id) return;
    fetchLeaguesAndTables(activeTournament.id);
  }, [activeTournament?.id]);

  return (
    
      <div className="tv-main">
        {/* Left panel */}
        <section className="tv-panel tv-left">
          <div className="tv-panel-header">
        
            <div className="tv-panel-subtitle">
              {activeTournament ? tournamentLabel(activeTournament) : ""}
            </div>
          </div>

          <div className="tv-panel-body">
            {status === "loading" ? (
              <div className="tv-loading">Loading…</div>
            ) : !activeTournament ? (
              <div className="tv-empty">No tournaments found.</div>
            ) : (
              <>
                <LeagueTable title="League A" rows={leagueA} />
                <LeagueTable title="League B" rows={leagueB} />

                <div className="tv-rotate-hint">
                  Rotating tournaments every {Math.round(ROTATE_MS / 1000)}s
                </div>
              </>
            )}
          </div>
        </section>

        {/* Right panel */}
        <section className="tv-panel tv-right">
          <div className="tv-panel-header">
            <div className="tv-panel-subtitle">Latest Scores</div>
            
          </div>

          <div className="tv-panel-body tv-scores">
            {latestScores.length === 0 ? (
              <div className="tv-empty">No scores submitted yet.</div>
            ) : (
              <ul className="tv-score-list">
                {latestScores.map((s, idx) => (
                  <li
                    key={s.id ?? idx}
                    className={idx === 0 ? "tv-score-item tv-score-item--new" : "tv-score-item"}
                  >
                    <div className="tv-score-line">{scoreLine(s)}</div>
                    {s.updated_at ? (
                      <div className="tv-score-time">
                        {new Date(s.updated_at).toLocaleTimeString()}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
   
    
  );
}
