# context.md — Tournament App (New Thread Starter)

## What this project is
A full-stack tournament management web app:
- Public view: fixtures/results
- TV view: live updates
- Admin panel: create tournaments/leagues/teams, generate fixtures/knockouts, manage results
- Public registration (`/register`) with Team ID for later edits

## Stack
- Backend: Node.js + Express (`app.js`)
- DB: Postgres (Railway)
- Frontend: React + Vite (`client/`)
- Deployment: Railway (server serves Vite build)

## Key data model
- `tournaments` → has `leagues`, `teams`, `matches`, `registrations`
- `teams` rows are used by fixtures/matches and require `league_id`
- `registrations` store web registration info and produce a unique `team_id_code`
- `registration_players` stores player details linked to `registrations`

## New registration flow (public)
1) `/register` shows active tournaments dropdown (`GET /api/tournaments/active`)
2) User submits minimal details → `POST /api/registrations`
3) Backend generates `team_id_code` (Team ID) and stores in DB; email is stubbed
4) User can later re-enter Team ID to add:
   - players
   - kit colours (dropdown from `GET /api/kit-colours`)
   - assistant coaches

## Admin approval flow (important)
Web registrations are NOT automatically inserted into `teams` because `teams.league_id` is required.
Admin assigns league to a registration:
- `POST /api/registrations/:registrationId/assign-league` with `{ leagueId }`
- Creates a `teams` row and links it back via `registrations.team_row_id`

DB change:
- `registrations.team_row_id INTEGER NULL REFERENCES teams(id) ON DELETE SET NULL`
- Unique partial index on `team_row_id` to prevent double-linking

## Admin “Registered Teams” list
Admin list shows both:
- manual admin teams (`teams`)
- web registrations (`registrations`)
from:
- `GET /api/tournaments/:tournamentId/registered-teams`

De-duplication:
- Once a registration is approved (has `team_row_id`), the created `teams` row is filtered out from the combined list to avoid showing twice.

Frontend component:
- `RegisteredTeamsList.jsx` renders the unified list and provides approve controls.

## Logo handling
`getLogoSrc()` now uses keyword-based matching so variants like “Wroughton FC”, “wroughton youth fc”, “Wroughton” all map to the Wroughton Youth FC logo.

## Environment variables
- `DATABASE_URL` (Railway Postgres)

## Where to look in code
- Backend routes: `app.js`
- Registration UI: `client/src/pages/Register.jsx` (or similar)
- Admin UI: `client/src/pages/AdminView.jsx`
- Registered teams combined list: `client/src/RegisteredTeamsList.jsx`
- Logo matching: `client/src/utils/getLogoSrc.js` (path may vary)

## Current status
- Registration submission works and inserts into DB
- Player insert works (`registration_players`)
- Admin can approve registration → creates `teams` row and links via `team_row_id`
- Admin list shows club + team as “Club – Team” and no longer duplicates after approval

## Next Steps
 - we have introduced new database schema / new tables. We need to rework the db scripts to reflect the new schema
 
