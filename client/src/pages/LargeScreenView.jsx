import { useEffect, useMemo, useRef, useState } from "react";
import { getLogoSrc } from "../utils/getLogoSrc";

const ROTATE_MS = 15000;
const LEAGUE_ROTATE_MS = 5000; // league A/B rotation (5 sceonds)
const POLL_SCORES_MS = 4000;
const POLL_TOURNAMENTS_MS = 20000;
const LATEST_LIMIT = 6;

function getWinnerFromFinal(match) {
  if (!match || !match.played) return null;

  const hs = Number(match.home_score);
  const as = Number(match.away_score);

  if (Number.isNaN(hs) || Number.isNaN(as)) return null;

  if (hs > as) return match.home_team;
  if (as > hs) return match.away_team;
  return "Draw";
}

function formatGender(gender) {
  if (!gender) return "";
  return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
}

function formatBracket(bracket) {
  if (!bracket) return "";
  const b = bracket.toLowerCase();
  if (b === "cup") return "Cup";
  if (b === "plate") return "Plate";
  return bracket.charAt(0).toUpperCase() + bracket.slice(1).toLowerCase();
}

function formatRound(round) {
  if (!round) return "";
  const r = round.toLowerCase();
  if (r === "league") return "";
  if (r === "semi-final" || r === "semifinal") return "Semi-Final";
  if (r === "final") return "Final";
  return round
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function scorePrefix(s) {
  const gender = formatGender(s.gender);
  const age = s.age_group ? s.age_group.toUpperCase() : "";
  const bracket = formatBracket(s.bracket);
  const round = formatRound(s.round);
  return [gender, age, bracket, round].filter(Boolean).join(" ");
}



function scoreLine(s) {
  const prefix = scorePrefix(s);
  return `${prefix ? prefix + ": " : ""}${s.home_team} ${s.home_score}–${s.away_score} ${s.away_team}`;
}

function tournamentLabel(t) {
  const parts = [];
  if (t.gender) parts.push(formatGender(t.gender));
  if (t.age_group) parts.push(t.age_group);
  if (t.year) parts.push(t.year);
  return parts.join(" • ");
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
  const [status, setStatus] = useState("loading");
  const [isFading, setIsFading] = useState(false);

  const [winners, setWinners] = useState({ cup: null, plate: null });
  const [activeLeague, setActiveLeague] = useState("A"); // "A" | "B"
  const leagueRotateTimer = useRef(null);
  const FADE_MS = 800;
  const rotateTimer = useRef(null);
  const tournamentsPoll = useRef(null);
  const scoresPoll = useRef(null);

  const activeTournament = useMemo(() => {
    if (!tournaments.length) return null;
    const idx = Math.max(0, Math.min(activeIndex, tournaments.length - 1));
    return tournaments[idx];
  }, [tournaments, activeIndex]);

  const hasWinners =
  winners.cup &&
  winners.plate &&
  winners.cup !== "Draw" &&
  winners.plate !== "Draw";

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

  async function fetchFinalWinners(tournamentId) {
    try {
      const res = await fetch(`/api/matches?tournamentId=${tournamentId}&round=final`);
      const finals = await res.json();

      const cupFinal = finals.find((m) => (m.bracket || "").toLowerCase() === "cup");
      const plateFinal = finals.find((m) => (m.bracket || "").toLowerCase() === "plate");

      setWinners({
        cup: getWinnerFromFinal(cupFinal),
        plate: getWinnerFromFinal(plateFinal),
      });
    } catch (e) {
      console.error("TV: failed to fetch final winners", e);
      setWinners({ cup: null, plate: null });
    }
  }

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

  useEffect(() => {
  if (leagueRotateTimer.current) clearInterval(leagueRotateTimer.current);

  leagueRotateTimer.current = setInterval(() => {
    setActiveLeague((prev) => (prev === "A" ? "B" : "A"));
  }, LEAGUE_ROTATE_MS);

  return () => {
    if (leagueRotateTimer.current) clearInterval(leagueRotateTimer.current);
  };
}, []);

useEffect(() => {
  setActiveLeague("A");
}, [activeTournament?.id]);

  useEffect(() => {
    if (rotateTimer.current) clearInterval(rotateTimer.current);

    rotateTimer.current = setInterval(() => {
      if (!tournaments.length) return;

      setIsFading(true);
      setTimeout(() => {
        setActiveIndex((i) => (i + 1) % tournaments.length);
        setIsFading(false);
      }, FADE_MS);
    }, ROTATE_MS);

    return () => {
      if (rotateTimer.current) clearInterval(rotateTimer.current);
    };
  }, [tournaments.length]);

  useEffect(() => {
    if (!activeTournament?.id) return;
    fetchLeaguesAndTables(activeTournament.id);
    fetchFinalWinners(activeTournament.id);
  }, [activeTournament?.id]);

  useEffect(() => {
    if (!activeTournament?.id) return;
    const t = setInterval(() => fetchFinalWinners(activeTournament.id), 5000);
    return () => clearInterval(t);
  }, [activeTournament?.id]);

  return (
    <div className="tv-main">
      {/* LEFT PANEL */}
      <section className={`tv-panel tv-left ${isFading ? "tv-fade" : ""}`}>
  <div className="tv-panel-header">
    <div className="tv-panel-subtitle">
      {activeTournament ? tournamentLabel(activeTournament) : ""}
    </div>
  </div>

  {status === "loading" ? (
    <div className="tv-panel-body">
      <div className="tv-loading">Loading…</div>
    </div>
  ) : !activeTournament ? (
    <div className="tv-panel-body">
      <div className="tv-empty">No tournaments found.</div>
    </div>
  ) : (
    <>
      {/* Scrollable area (tables only) */}
      <div className="tv-panel-body tv-left-scroll">
       {activeLeague === "A" ? (
  <LeagueTable title="League A" rows={leagueA} />
) : (
  <LeagueTable title="League B" rows={leagueB} />
)}

             </div>

      {/* Fixed footer (winners) */}
      {hasWinners ? (
        <div className="tv-left-footer">
          <div className="tv-winners-banner tv-winners-banner--celebrate">
            <div className="tv-winners-title">🏆 Tournament Winners</div>

            <div className="tv-winners-row">
              <span className="tv-winners-label">Cup:</span>

              <div className="tv-winners-team-wrap">
                <img
                  src={getLogoSrc(winners.cup)}
                  alt={winners.cup}
                  className="tv-winners-logo tv-winners-logo--cup"
                />
                <span className="tv-winners-team">{winners.cup}</span>
              </div>

              <span className="tv-winners-badge tv-winners-badge--cup">CUP</span>
            </div>

            <div className="tv-winners-row">
              <span className="tv-winners-label">Plate:</span>

              <div className="tv-winners-team-wrap">
                <img
                  src={getLogoSrc(winners.plate)}
                  alt={winners.plate}
                  className="tv-winners-logo"
                />
                <span className="tv-winners-team">{winners.plate}</span>
              </div>

              <span className="tv-winners-badge tv-winners-badge--plate">PLATE</span>
            </div>

            <div className="tv-winners-congrats">Congratulations 🎉</div>
          </div>
        </div>
      ) : null}
    </>
  )}
</section>

      {/* RIGHT PANEL */}
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
                  className={[
                    "tv-score-item",
                    idx === 0 ? "tv-score-item--new" : "",
                    s.bracket ? "tv-score-item--knockout" : "",
                  ].join(" ")}
                >
                  <div className="tv-score-line">
                    {scoreLine(s)}

                    {s.bracket && (
                      <span
                        className={
                          s.bracket === "cup"
                            ? "tv-badge tv-badge--cup"
                            : "tv-badge tv-badge--plate"
                        }
                      >
                        {s.bracket.toUpperCase()}
                      </span>
                    )}
                  </div>

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