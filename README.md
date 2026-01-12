# Wroughton Youth FC – Tournament Management System

A Cloud hosted, web application for managing youth football tournaments, fixtures, league tables, knockouts, and for tournament matchdays.

Designed for **simplicity, reliability, and readability on large screens**, this system supports admins on mobile/tablet/PC, public viewers on phones, and a dedicated TV mode for displaying on club-house / pavilion smart-TV (via TV web browser) for on-site spectators.

All club badges, logos, and team names are the property of their respective owners and are used for identification purposes only.
--- 
License / Usage - Licensed under Apache 2.0 license. Copyright 2025 Wroughton Youth Football Club (WYFC)

GitHub Repository : 
https://github.com/Zoomin10/Grassroots-Football-Tournament-Management-System-Cloud-based 



### ✨ Features

### Core
- 3 Page view : Admin page, Audience page (public), TV page for club-house Smart TV screen
- Tournament creation (year, gender, age group, date, location, pitch allocation)
- League A / League B structure
- Team allocation to leagues
- Round-robin fixture generation, or manual fixture creation
- Knockout stages (Cup & Plate)
- Result submission
- Automatic league tables adjustments based on results
- Cloud-hosted via Railway 

### Live TV View (`/tv`)
- Two-panel layout (Leagues + Latest Scores)
- Auto-rotating tournaments (15 seconds rotation)
- Latest 6 scores (auto-updating) 0 based on most recent time-stamp
- Club logos in league tables
- Digital clock showing real time
- Sponsors footer section always on display
- Designed for **no scrolling** on large screens

### Knockouts
- Cup & Plate semi-finals
- Manual final generation once semis complete


---
### Tech Stack
      Frontend
      React
      CSS (TV-specific styles)

Backend

      Node.js
      Express
      REST API

Database
      PostgreSQL


### Environments

### Local Development
      PostgreSQL installed locally
      Database name: users
      Fully rebuildable

Running Locally :

      npm install

      npm run dev

      Ensure PostgreSQL is running locally.


### Cloud Deployment (Railway)
      Node.js app deployed as Railway Web Service
      PostgreSQL managed by Railway
      Connected via DATABASE_URL

Environment Variables

      Create a .env file (not committed):

      RAILWAY_DATABASE_URL=postgresql://...
      LOCAL_DB_NAME=users

        ┌─────────────────────────────────────┐

        │              Railway                │

        │                                     │
        │  ┌──────────────┐   ┌─────────────┐ │
        │  │ Node Service │──▶│ Postgres DB │ │
        │  │ (app.js)     │   │ (managed)   │ │
        │  └──────────────┘   └─────────────┘ │
        │        ▲                            │
        │        │                            │
        │   GitHub Deploy                     │
        └────────┼─────────────────────────────┘
                 │
                 ▼
        ┌────────────────────────────┐
        │        Git Repository      │
        │                            │
        │ • React frontend           │
        │ • Express backend          │
        │ • SQL schema + seed        │
        │ • Reset / dump scripts     │
        └────────────────────────────┘

### TV Mode

TV mode is designed for 1920×1080 displays and above.

Access:
      /tv

Characteristics:
      Dark, high-contrast UI
      Auto-rotating tournaments and leagues
      Live score updates
      Winners banner
      Sponsors footer

### Database Operations (Critical)

      All database operations are script-driven and explicit.

      Scripts live in:  scripts/

      Snapshot Railway (Create Demo Dataset) :   ./scripts/dump-railway.sh

      Produces:

          db/schema.sql
          db/seed.sql

Rebuild Local Database :   ./scripts/rebuild-local.sh

      Drops and recreates the local DB using schema + seed.

Reset Railway – Schema Only :    ./scripts/railway-reset-schema-only.sh

      Deletes all data but keeps schema.

Reset Railway – Demo Dataset :    ./scripts/railway-reset-demo.sh

      Fully rebuilds Railway with demo data.

### Safety Rules

      Never auto-run Railway reset scripts
      Always confirm before destructive actions
      Treat local DB as disposable
      Prefer separate Railway projects for demo vs production

### Verification Query

select 'tournaments' t, count(*) c from public.tournaments
union all select 'leagues', count(*) from public.leagues
union all select 'teams', count(*) from public.teams
union all select 'matches', count(*) from public.matches;

                    ┌─────────────────────┐
                    │   Railway Database   │
                    │  (Source of Truth)   │
                    └─────────┬───────────┘
                              │
                      dump-railway.sh
                              │
                ┌─────────────▼─────────────┐
                │   schema.sql + seed.sql    │
                └─────────────┬─────────────┘
                              │
              ┌───────────────┼────────────────┐
              │               │                │
        rebuild-local.sh  railway-reset-demo.sh  railway-reset-schema-only.sh
              │               │                │
        ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
        │ Local DB  │   │ Demo DB   │   │ Empty DB  │
        │ (users)   │   │ (Railway) │   │ (Railway) │
        └───────────┘   └───────────┘   └───────────┘


## 🧭 Application Routes

| Route | Purpose |
|------|--------|
| `/` | Public view (fixtures & results) |
| `/admin` | Admin view (manage tournaments, teams, fixtures, results) |
| `/tv` | Large screen / TV live view |

---

## 🏗️ Architecture Overview



The frontend is a React SPA that communicates with a REST API. The TV view polls the backend at short intervals to keep displays up to date.

        ┌────────────────────────────┐
        │        Display Devices     │
        │  (TV, PC, Tablet, Browser) │
        └───────────────┬────────────┘
                        │ HTTPS
                        ▼
        ┌────────────────────────────┐
        │        Frontend (React)     │
        │                             │
        │ • Standard UI Pages         │
        │ • TV Mode (LargeScreenView) │
        │ • TV-specific CSS           │
        │ • Logo assets (/public)     │
        └───────────────┬────────────┘
                        │ REST API
                        ▼
        ┌────────────────────────────┐
        │     Backend (Node.js)       │
        │        Express API          │
        │                             │
        │ • /api/tournaments          │
        │ • /api/leagues              │
        │ • /api/league               │
        │ • /api/matches              │
        │ • Business logic            │
        │ • SQL aggregation           │
        └───────────────┬────────────┘
                        │ SQL (pg)
                        ▼
        ┌────────────────────────────┐
        │      PostgreSQL Database    │
        │                             │
        │ Tables:                     │
        │ • tournaments               │
        │ • leagues                   │
        │ • teams                     │
        │ • matches                   │
        │                             │
        │ Environments:               │
        │ • Railway (Cloud)           │
        │ • Local Dev                 │
        └────────────────────────────┘

        TV Screen loads /tv
                │
                ▼
        React LargeScreenView
                │
                ├─ GET /api/tournaments
                ├─ GET /api/leagues
                ├─ GET /api/league
                ├─ GET /api/matches/latest
                └─ GET /api/matches?round=final
                │
                ▼
        Node aggregates scores + tables
                │
                ▼
        Postgres executes league + match queries

---

## 📁 Project Structure

```
client/
  src/
    pages/
    components/
    styles/
    utils/
    App.jsx

server/
  app.js
  routes/
  db/
```

---

## 🗄️ Database (Summary)

Core tables:
- `tournaments`
- `leagues`
- `teams`
- `matches`

League tables are calculated dynamically from played matches.

Tie-break rules:
1. Points
2. Goal Difference (GD)
3. Goals For (GF)

---

## 🔌 API Highlights

Examples:

- `GET /api/tournaments`
- `POST /api/league/generate-fixtures`
- `POST /api/matches/:id/result`
- `GET /api/matches/latest?limit=6`

(See full API list in architecture documentation.)

---

## 🚀 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Backend
```bash
cd server
npm install
npm start
```

### Frontend
```bash
cd client
npm install
npm run dev
```

---

## 🖥️ Matchday Deployment 


**CLOUD-based deployment**

Required Files & Setup

1 Environment Variables (.env)
RAILWAY_DATABASE_URL=postgresql://...
LOCAL_DB_NAME=users
Notes:
    • .env is not committed
    

2. Script Reference
All scripts are located in the scripts/ directory.

URL for accessing the app (When hosted on Railway) : 

https://grassroots-football-tournament-management-system-production.up.railway.app/

https://grassroots-football-tournament-management-system-production.up.railway.app/tv

https://grassroots-football-tournament-management-system-production.up.railway.app/public

---

**LAN-based deployment** (no internet required):

1. Run server on a laptop or mini PC
2. Connect all devices to the same Wi-Fi
3. Open:
   - Admin: `http://<LAN-IP>:3000/admin`
   - TV: `http://<LAN-IP>:3000/tv`
4. Put TV browser in fullscreen / kiosk mode


## 🧩 Team Logos

- Stored in `/public/logos/`
- Filenames are derived automatically from team names
- Default fallback: `/logos/default.png`

Example:
```
Wroughton Youth FC → /logos/wroughtonyouthfc.png
```

---

## ⚠️ Important Notes

- Admin routes are **not authenticated** (LAN-trusted usage)
- `/api/admin/reset-matches` deletes **all matches** (use with care)
- Knockout seeding is currently based on team insertion order

---

## 🛣️ Roadmap


---

## 📄 License / Ownership

Developed for **Wroughton Youth FC**.

Internal club use unless otherwise agreed.

---

## 🙌 Credits

Built to support volunteers, referees, and spectators on matchday.
Designed for clarity, speed, and reliability.

