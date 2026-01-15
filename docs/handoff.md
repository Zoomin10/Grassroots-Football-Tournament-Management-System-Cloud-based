# Tournament Registration + Admin Approval Flow — Handoff

## Overview
This project is a Node/Express + Postgres + React (Vite) tournament management system deployed on Railway. It includes:
- Public views (scores/fixtures), TV view, and Admin control panel.
- **New public registration flow** (`/register`) that creates a unique **Team ID** for later edits.
- **Admin approval / assign-to-league** flow that converts a web registration into a real tournament `teams` row (required for fixtures).

---

## Database schema changes

### Existing tables (already present)
- `tournaments`
- `leagues` (per tournament)
- `teams` (requires `league_id` and `tournament_id`)
- `registrations`
- `registration_players`

### New column added
**Added link from web registration to created tournament team:**

```sql
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS team_row_id INTEGER;

ALTER TABLE registrations
ADD CONSTRAINT registrations_team_row_id_fkey
FOREIGN KEY (team_row_id) REFERENCES teams(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_registrations_team_row_id
ON registrations(team_row_id)
WHERE team_row_id IS NOT NULL;
```

**Why:** `teams.league_id` is NOT NULL, so a web registration cannot become a `teams` row until an admin assigns a league. `team_row_id` preserves the registration record while allowing the tournament engine (fixtures/matches) to use the `teams` table.

---

## Backend API routes

> All routes live in `app.js` and must be declared **above** the SPA fallback (`app.get(/^\/(?!api).*/...)`).

### Registration flow
#### 1) Create registration (public)
- `POST /api/registrations`
- Creates a `registrations` row and generates a `team_id_code` (unique).
- Email sending is currently a stub (`sendTeamIdEmailStub`) that logs to server.

Expected request body (minimum):
```json
{
  "tournamentId": 3,
  "clubName": "Draycott FC",
  "teamName": "Flames",
  "managerName": "Tom Smith",
  "email": "test@test.com",
  "phone": "0123456789"
}
```

Response (example):
```json
{
  "teamIdCode": "AQVCVRG9AW",
  "registrationId": 2
}
```

#### 2) Registration edit / enrichment (public)
- Uses `team_id_code` to fetch/update the registration and to add players.
- Routes depend on your current implementation (common patterns):
  - `GET /api/registrations/:teamIdCode`
  - `PUT /api/registrations/:teamIdCode`
  - `POST /api/registrations/:teamIdCode/players` (or `/api/registration_players`)
  - `DELETE /api/registrations/:teamIdCode/players/:playerId`

### Kit colours
- `GET /api/kit-colours`
  - Returns the list of allowed colour options for dropdowns.
  - Fix applied: JSON object uses commas (no semicolons).

### Tournaments
- `GET /api/tournaments/active`
  - Ensure only one route exists (there were duplicates at one point).
  - Used by `/register` page dropdown.

### Admin combined view (manual teams + web registrations)
#### Combined list for Admin “Registered Teams”
- `GET /api/tournaments/:tournamentId/registered-teams`
- Returns a unified list of:
  - `registrations` (web)
  - `teams` (admin-created)
- **De-duplication:** once a registration is approved and has `team_row_id`, the matching `teams.id` is filtered out so it does not render twice.

Output items use normalized fields used by the React list:
- `source`: `"registration"` or `"admin"`
- `id`: string key (`"reg-2"`, `"team-9"`)
- `team_name`, `club_name`, `team_id_code`, `manager_name`
- `registration_id` (for registrations)
- `team_row_id` (for both: teams.id or registrations.team_row_id)
- `league_name` (for approved registrations via join through team_row_id)

#### Approve / assign league (creates `teams` row)
- `POST /api/registrations/:registrationId/assign-league`
- Body:
```json
{ "leagueId": 12 }
```
- Transaction behavior:
  1) `SELECT ... FOR UPDATE` registration row
  2) Validate league belongs to same tournament
  3) Insert `teams (team, league_id, tournament_id)`
  4) Update `registrations.team_row_id = newTeamId`
- Returns `{ ok: true, registration, team, league }`

### Leagues
You currently load leagues in Admin via:
- `GET /api/leagues?tournamentId=...`

Optional (if added):
- `GET /api/tournaments/:tournamentId/leagues`

---

## Frontend changes

### New page: `/register`
A dedicated public registration page that:
1) Shows club header/badge + sponsor footer.
2) Has a dropdown list of active tournaments (from `/api/tournaments/active`).
3) Registration form captures minimum required details:
   - Club name
   - Team name
   - Manager name
   - Email
   - Phone
4) On submit:
   - calls `POST /api/registrations`
   - shows success screen with generated **Team ID**
   - Team ID is also logged via email stub (future: real email integration)

5) “Return later” flow:
   - user enters Team ID
   - can add:
     - Registered players (first name, surname, DoB)
     - Kit colours (Colour 1 & Colour 2 dropdowns)
     - Assistant coaches (assistant 1 & assistant 2)

Kit colour options: 15 common colours (e.g. red, black, white, light_blue, dark_blue, yellow, orange, green, purple, grey, navy, maroon, pink, brown, gold).

### Admin View — Registered Teams list
- Added `RegisteredTeamsList.jsx` which renders the unified list from `/registered-teams`.
- Shows:
  - **Web registrations**: Club + Team name, Team ID, manager name, approval controls.
  - **Admin teams**: Team name and league.
- Approval UI: league dropdown + ✅ button triggers `POST /api/registrations/:id/assign-league`.
- Duplicate rendering fixed by backend filtering of teams linked to registrations.

### Display format update
- For web registrations, display name is:
  - `"{club_name} – {team_name}"` (e.g. “Wroughton Youth FC – Magic”)

### Logo matching update (more forgiving)
- `getLogoSrc()` updated to **keyword-based matching**, e.g. any club string containing “wroughton” (any case) resolves to Wroughton Youth FC logo.
- This supports variants like:
  - “Wroughton Youth FC”, “wroughton youth fc”, “Wroughton FC”, “Wroughton”, etc.

---

## Important gotchas / lessons learned
- **Do not paste React hooks into `app.js`** (Node/Express backend). Hooks belong only in React components.
- Ensure `await` calls remain inside `async` route handlers; duplicate pasted code blocks outside routes will crash the server.
- Route ordering: keep API routes above the SPA fallback route.
- If a team appears twice after approval: it’s because the list included both `registrations` and the created `teams` row. Fix is the backend de-dup filter.

---

## Deployment notes (Railway)
- Uses `DATABASE_URL` environment variable.
- Postgres SSL config in `app.js` supports Railway.
- Test registration inserts verified in DB:
  - `registrations` populated with `team_id_code`
  - `registration_players` linked correctly
  - approval sets `registrations.team_row_id` and inserts into `teams`

---

## Next steps / roadmap
- Replace `sendTeamIdEmailStub` with real email delivery (SMTP, SendGrid, Mailgun, etc.).
- Optional: add admin override for club logos or a mapping UI.
- Optional: status transitions for registrations (`pending` → `approved`) if desired.
- Optional: prevent accidental duplicate registrations (same club/team/email for same tournament).
