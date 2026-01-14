import { useEffect, useMemo, useState } from "react";
import "../styles/register.css";

/**
 * RegisterPage
 * - Mode 1: Select tournament -> initial registration -> success (Team ID)
 * - Mode 2: Enter Team ID -> load/edit registration -> add players + kit colours + assistants
 */
export default function RegisterPage() {
  const [tournaments, setTournaments] = useState([]);
  const [colours, setColours] = useState([]);

  const [loadingInit, setLoadingInit] = useState(true);
  const [error, setError] = useState("");

  // Choose mode state
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [teamIdInput, setTeamIdInput] = useState("");

  // Page mode: choose | new | success | edit
  const [mode, setMode] = useState("choose");

  // Registration session
  const [teamIdCode, setTeamIdCode] = useState("");
  const [registration, setRegistration] = useState(null);
  const [players, setPlayers] = useState([]);

  // Busy flags
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoadingInit(true);
        setError("");

        const [tRes, cRes] = await Promise.all([
          fetch("/api/tournaments/active"),
          fetch("/api/kit-colours"),
        ]);

        if (!tRes.ok) throw new Error("Failed to fetch tournaments");
        if (!cRes.ok) throw new Error("Failed to fetch kit colours");

        const tData = await tRes.json();
        const cData = await cRes.json();

        setTournaments(Array.isArray(tData.tournaments) ? tData.tournaments : []);
        setColours(Array.isArray(cData.colours) ? cData.colours : []);
      } catch (e) {
        console.error(e);
        setError("Could not load registration data. Please refresh and try again.");
      } finally {
        setLoadingInit(false);
      }
    })();
  }, []);

  const selectedTournament = useMemo(() => {
    const id = Number(selectedTournamentId);
    if (!id) return null;
    return tournaments.find((t) => t.id === id) || null;
  }, [selectedTournamentId, tournaments]);

  function resetAll() {
    setError("");
    setSelectedTournamentId("");
    setTeamIdInput("");
    setMode("choose");
    setTeamIdCode("");
    setRegistration(null);
    setPlayers([]);
  }

  async function loadByTeamId(codeRaw) {
    const code = String(codeRaw || "").trim().toUpperCase();
    if (!code) return;

    try {
      setBusy(true);
      setError("");

      const res = await fetch(`/api/registrations/${encodeURIComponent(code)}`);
      if (!res.ok) {
        setError("Team ID not found. Please check the code and try again.");
        return;
      }
      const data = await res.json();

      setTeamIdCode(code);
      setRegistration(data.registration);
      setPlayers(Array.isArray(data.players) ? data.players : []);
      setMode("edit");
    } catch (e) {
      console.error(e);
      setError("Could not load registration. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function createRegistration(payload) {
    try {
      setBusy(true);
      setError("");

      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // backend uses { error: "...", field?: "..." }
        const msg =
          data?.field
            ? `Please check the ${data.field} field.`
            : data?.message || "Could not submit registration. Please try again.";
        setError(msg);
        return null;
      }

      return data; // { registrationId, teamIdCode, status }
    } catch (e) {
      console.error(e);
      setError("Could not submit registration. Please try again.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function patchRegistration(patch) {
    if (!teamIdCode) return;

    try {
      setBusy(true);
      setError("");

      const res = await fetch(`/api/registrations/${encodeURIComponent(teamIdCode)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Could not save changes. Please try again.");
        return false;
      }

      setRegistration(data.registration);
      return true;
    } catch (e) {
      console.error(e);
      setError("Could not save changes. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function addPlayer(player) {
    if (!teamIdCode) return;

    try {
      setBusy(true);
      setError("");

      const res = await fetch(
        `/api/registrations/${encodeURIComponent(teamIdCode)}/players`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(player),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data?.field
            ? `Please check the ${data.field} field.`
            : data?.message || "Could not add player. Please try again.";
        setError(msg);
        return;
      }

      setPlayers((prev) => [...prev, data.player]);
    } catch (e) {
      console.error(e);
      setError("Could not add player. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function deletePlayer(playerId) {
    if (!teamIdCode) return;

    try {
      setBusy(true);
      setError("");

      const res = await fetch(
        `/api/registrations/${encodeURIComponent(teamIdCode)}/players/${playerId}`,
        { method: "DELETE" }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Could not delete player. Please try again.");
        return;
      }

      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    } catch (e) {
      console.error(e);
      setError("Could not delete player. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="register-page-wrap">
      <div className="register-container">
        {loadingInit ? (
          <div className="register-card">
            <h2>Loading…</h2>
            <p>Please wait a moment.</p>
          </div>
        ) : (
          <>
            <div className="register-hero">
              <h2>Tournament Registration</h2>
              <p>
                Register your team now, then come back later to add players, kit colours, and assistants.
              </p>
            </div>

            {error && <div className="register-error">{error}</div>}

            {mode === "choose" && (
              <ChoosePanel
                tournaments={tournaments}
                selectedTournamentId={selectedTournamentId}
                setSelectedTournamentId={setSelectedTournamentId}
                onContinue={() => {
                  if (!selectedTournamentId) {
                    setError("Please select a tournament.");
                    return;
                  }
                  setError("");
                  setMode("new");
                }}
                teamIdInput={teamIdInput}
                setTeamIdInput={setTeamIdInput}
                onLoadTeamId={() => loadByTeamId(teamIdInput)}
                busy={busy}
              />
            )}

            {mode === "new" && (
              <NewRegistrationPanel
                tournament={selectedTournament}
                onBack={() => setMode("choose")}
                busy={busy}
                onSubmit={async (form) => {
                  if (!selectedTournament) {
                    setError("Please select a tournament.");
                    setMode("choose");
                    return;
                  }
                  const payload = {
                    tournamentId: selectedTournament.id,
                    clubName: form.clubName,
                    teamName: form.teamName,
                    managerName: form.managerName,
                    email: form.email,
                    phone: form.phone,
                  };

                  const created = await createRegistration(payload);
                  if (created?.teamIdCode) {
                    setTeamIdCode(created.teamIdCode);
                    setMode("success");
                  }
                }}
              />
            )}

            {mode === "success" && (
              <SuccessPanel
                teamIdCode={teamIdCode}
                busy={busy}
                onCopy={() => navigator.clipboard?.writeText(teamIdCode)}
                onAddDetailsNow={() => loadByTeamId(teamIdCode)}
                onStartOver={resetAll}
              />
            )}

            {mode === "edit" && registration && (
              <EditPanel
                registration={registration}
                players={players}
                colours={colours}
                busy={busy}
                onBack={resetAll}
                onSaveRegistration={patchRegistration}
                onAddPlayer={addPlayer}
                onDeletePlayer={deletePlayer}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ----------------- UI Components ----------------- */

function ChoosePanel({
  tournaments,
  selectedTournamentId,
  setSelectedTournamentId,
  onContinue,
  teamIdInput,
  setTeamIdInput,
  onLoadTeamId,
  busy,
}) {
  return (
    <div className="register-card">
      <h3>Choose a tournament</h3>

      <label className="register-label">
        Tournament
        <select
          className="register-input"
          value={selectedTournamentId}
          onChange={(e) => setSelectedTournamentId(e.target.value)}
          disabled={busy}
        >
          <option value="">-- Select --</option>
          {tournaments.map((t) => {
            // if you added a server-side label, use that; else build one here
            const time = t.kickoff_time ? String(t.kickoff_time).slice(0, 5) : "";
            const gender = (t.gender || "").toString();
            const g = gender ? gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase() : "";
            const label =
              t.label ||
              `${t.year} ${t.age_group} ${g} – ${t.venue}${time ? ` (${time})` : ""}`;

            return (
              <option key={t.id} value={t.id}>
                {label}
              </option>
            );
          })}
        </select>
      </label>

      <button className="register-btn primary" onClick={onContinue} disabled={busy}>
        Continue
      </button>

      <div className="register-divider" />

      <h3>Already started?</h3>
      <p className="register-muted">
        Enter your Team ID to continue and add players, kit colours, or assistants.
      </p>

      <div className="register-row">
        <input
          className="register-input"
          value={teamIdInput}
          onChange={(e) => setTeamIdInput(e.target.value)}
          placeholder="Enter Team ID (e.g. ABCD1234EF)"
          disabled={busy}
        />
        <button className="register-btn" onClick={onLoadTeamId} disabled={busy}>
          Load
        </button>
      </div>
    </div>
  );
}

function NewRegistrationPanel({ tournament, onBack, onSubmit, busy }) {
  const [clubName, setClubName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <div className="register-card">
      <div className="register-card-head">
        <h3>Team registration</h3>
        <button className="register-link" onClick={onBack} disabled={busy}>
          Back
        </button>
      </div>

      {tournament && (
        <div className="register-summary">
          <strong>
            {tournament.year} {tournament.age_group} {tournament.gender}
          </strong>
          <div>{tournament.venue}</div>
        </div>
      )}

      <label className="register-label">
        Club name *
        <input className="register-input" value={clubName} onChange={(e) => setClubName(e.target.value)} disabled={busy} />
      </label>

      <label className="register-label">
        Team name *
        <input className="register-input" value={teamName} onChange={(e) => setTeamName(e.target.value)} disabled={busy} />
      </label>

      <label className="register-label">
        Manager name *
        <input className="register-input" value={managerName} onChange={(e) => setManagerName(e.target.value)} disabled={busy} />
      </label>

      <label className="register-label">
        Email *
        <input className="register-input" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} />
      </label>

      <label className="register-label">
        Contact phone number *
        <input className="register-input" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={busy} />
      </label>

      <button
        className="register-btn primary"
        onClick={() =>
          onSubmit({ clubName, teamName, managerName, email, phone })
        }
        disabled={busy}
      >
        Submit registration
      </button>
    </div>
  );
}

function SuccessPanel({ teamIdCode, onCopy, onAddDetailsNow, onStartOver, busy }) {
  return (
    <div className="register-card">
      <h3>Registration received ✅</h3>
      <p className="register-muted">
        Keep your Team ID safe. You’ll use it to return later and add players, kit colours, and assistants.
      </p>

      <div className="teamid-box">
        <div className="teamid">{teamIdCode}</div>
        <button className="register-btn" onClick={onCopy} disabled={busy}>
          Copy
        </button>
      </div>

      <div className="register-actions">
        <button className="register-btn primary" onClick={onAddDetailsNow} disabled={busy}>
          Add players & details now
        </button>
        <button className="register-btn" onClick={onStartOver} disabled={busy}>
          Finish
        </button>
      </div>
    </div>
  );
}

function EditPanel({
  registration,
  players,
  colours,
  busy,
  onBack,
  onSaveRegistration,
  onAddPlayer,
  onDeletePlayer,
}) {
  const [clubName, setClubName] = useState(registration.club_name || "");
  const [teamName, setTeamName] = useState(registration.team_name || "");
  const [managerName, setManagerName] = useState(registration.manager_name || "");
  const [email, setEmail] = useState(registration.manager_email || "");
  const [phone, setPhone] = useState(registration.manager_phone || "");

  const [assistant1Name, setAssistant1Name] = useState(registration.assistant1_name || "");
  const [assistant2Name, setAssistant2Name] = useState(registration.assistant2_name || "");

  const [kitColour1, setKitColour1] = useState(registration.kit_colour_1 || "");
  const [kitColour2, setKitColour2] = useState(registration.kit_colour_2 || "");

  // player add form
  const [pFirstName, setPFirstName] = useState("");
  const [pSurname, setPSurname] = useState("");
  const [pDob, setPDob] = useState("");

  return (
    <div className="register-card">
      <div className="register-card-head">
        <h3>Edit registration</h3>
        <button className="register-link" onClick={onBack} disabled={busy}>
          Back to start
        </button>
      </div>

      <div className="register-section">
        <h4>Team details</h4>

        <label className="register-label">
          Club name
          <input className="register-input" value={clubName} onChange={(e) => setClubName(e.target.value)} disabled={busy} />
        </label>

        <label className="register-label">
          Team name
          <input className="register-input" value={teamName} onChange={(e) => setTeamName(e.target.value)} disabled={busy} />
        </label>

        <label className="register-label">
          Manager name
          <input className="register-input" value={managerName} onChange={(e) => setManagerName(e.target.value)} disabled={busy} />
        </label>

        <label className="register-label">
          Email
          <input className="register-input" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} />
        </label>

        <label className="register-label">
          Phone
          <input className="register-input" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={busy} />
        </label>

        <label className="register-label">
          Assistant coach 1
          <input className="register-input" value={assistant1Name} onChange={(e) => setAssistant1Name(e.target.value)} disabled={busy} />
        </label>

        <label className="register-label">
          Assistant coach 2
          <input className="register-input" value={assistant2Name} onChange={(e) => setAssistant2Name(e.target.value)} disabled={busy} />
        </label>

        <button
          className="register-btn"
          onClick={() =>
            onSaveRegistration({
              clubName,
              teamName,
              managerName,
              email,
              phone,
              assistant1Name,
              assistant2Name,
            })
          }
          disabled={busy}
        >
          Save team details
        </button>
      </div>

      <div className="register-section">
        <h4>Kit colours</h4>

        <div className="register-two-col">
          <label className="register-label">
            Colour 1
            <select
              className="register-input"
              value={kitColour1}
              onChange={(e) => setKitColour1(e.target.value)}
              disabled={busy}
            >
              <option value="">-- Select --</option>
              {colours.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>

          <label className="register-label">
            Colour 2
            <select
              className="register-input"
              value={kitColour2}
              onChange={(e) => setKitColour2(e.target.value)}
              disabled={busy}
            >
              <option value="">-- Select --</option>
              {colours.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>
        </div>

        <button
          className="register-btn"
          onClick={() => onSaveRegistration({ kitColour1: kitColour1 || null, kitColour2: kitColour2 || null })}
          disabled={busy}
        >
          Save kit colours
        </button>

        <p className="register-muted">
          Tip: Colour 1 and Colour 2 must be different.
        </p>
      </div>

      <div className="register-section">
        <h4>Registered players</h4>

        {players.length === 0 ? (
          <p className="register-muted">No players added yet.</p>
        ) : (
          <div className="players-table">
            <div className="players-head">
              <div>First name</div>
              <div>Surname</div>
              <div>Date of birth</div>
              <div />
            </div>

            {players.map((p) => (
              <div className="players-row" key={p.id}>
                <div>{p.first_name}</div>
                <div>{p.surname}</div>
                <div>{String(p.dob).slice(0, 10)}</div>
                <div>
                  <button
                    className="register-btn danger"
                    onClick={() => onDeletePlayer(p.id)}
                    disabled={busy}
                    title="Remove player"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="register-divider" />

        <h5>Add a player</h5>
        <div className="register-two-col">
          <label className="register-label">
            First name *
            <input className="register-input" value={pFirstName} onChange={(e) => setPFirstName(e.target.value)} disabled={busy} />
          </label>

          <label className="register-label">
            Surname *
            <input className="register-input" value={pSurname} onChange={(e) => setPSurname(e.target.value)} disabled={busy} />
          </label>
        </div>

        <label className="register-label">
          Date of birth *
          <input className="register-input" type="date" value={pDob} onChange={(e) => setPDob(e.target.value)} disabled={busy} />
        </label>

        <button
          className="register-btn primary"
          onClick={() => {
            onAddPlayer({ firstName: pFirstName, surname: pSurname, dob: pDob });
            setPFirstName("");
            setPSurname("");
            setPDob("");
          }}
          disabled={busy}
        >
          Add player
        </button>
      </div>
    </div>
  );
}