# Wroughton Youth FC – Tournament Management System

A Multi-view, Cloud hosted, web application for managing youth football tournaments. Tournament creation, fixtures, league tables, knockouts etc. For use on tournament matchdays.
---
Designed for **simplicity, reliability, and readability on large screens**, this system supports admins on mobile/tablet/PC, public viewers on phones, a dedicated TV mode for displaying on club-house / pavilion smart-TV (via TV web browser) for on-site spectators and a dedicated page for handling registrations.

All club badges, logos, and team names are the property of their respective owners and are used for identification purposes only.

License / Usage - Licensed under Apache 2.0 license. Copyright 2025 Wroughton Youth Football Club (WYFC)

GitHub Repository : 
https://github.com/Zoomin10/Grassroots-Football-Tournament-Management-System-Cloud-based 



### ✨ Features


### Core
- 4 Page views (each with own URL) : Tournament Admin page, Tournament registration page, Audience page (public) and TV page for club-house Smart TV screen
- Tournament creation (year, gender, age group, date, location, pitch allocation)
- League A / League B structure
- Team allocation to leagues
- Round-robin fixture generation, or manual fixture creation
- Knockout stages (Cup & Plate)
- Result submission
- Automatic league tables adjustments based on results
- Cloud-hosted via Railway 

📝 NEW: Public Team Registration System

        A full self-service registration flow for teams entering tournaments.      
        Club-branded registration page with sponsor footer  Public Registration (/register)        
        Dropdown list of active tournaments - select which one to register for
        
        Minimum required details:
            Club name
            Team name
            Manager name
            Email address
            Contact phone number
        
        On submission:

            Registration is stored in the database
            A unique Team ID is generated and returned via email
            (Email delivery currently stubbed; ready for SMTP integration)
            Post-registration (via Team ID)
        
        Using their Team ID, teams can later:
        
            Add registered players (name + DoB)
            Select kit colours (Colour 1 & Colour 2 dropdowns)
            Add assistant coaches

        This allows teams to complete details gradually without admin intervention.


        🛂 Admin Approval Flow (Important Design)
        
        Why approval is required    

        The tournament engine (fixtures, matches, knockouts) depends on the teams table, which requires a league assignment.
        Web registrations do not immediately become tournament teams.
        
        Approval process (Admin)
        
        Admin opens Admin View
            Sees a unified list of:
            Web registrations
            Manually added teams

        For a web registration:
            Admin selects a league
            Clicks Approve

        System:
            Creates a teams row
            Links it back to the registration
            Preserves the original registration data

        Result
            Registrations remain intact for audit/history
            Tournament engine works with teams
            No duplicate rendering in Admin UI



### 🆕 Tournament Visibility Controls (Important)

    Each tournament has two admin-controlled flags:

    registration_open : Controls visibility on which tournaments are visible on the Registration page.

            ON → tournament appears in /register  
            OFF → tournament hidden from registration

    Tournament published : Controls visibility of which tournaments are visible on - 

            Public View (/public)  
            TV View (/tv)  
            Latest Results feeds

    This allows:

         Registration before matchday  
         Hidden setup & testing  
         Explicit “go live” control on tournament day





    
###    🛂 Admin Approval Flow (Design Rationale)

    The tournament engine (fixtures, matches, knockouts) depends on the teams table, which requires league assignment.

    Therefore:

    Web registrations do not immediately become teams
    
    Approval Process (Admin) : Admin opens Admin View
    
    Sees a unified list of:

        Web registrations
        Manually added teams
    
    For a registration:

        Select league
        Click Approve

    System action:

        Creates a teams row
        Links it back to the registration via team_row_id
        Preserves original registration data

    Result

        Registrations remain intact for audit/history
        Tournament engine works exclusively with teams
        No duplication in the Admin UI
        

### Live TV View (`/tv`)
- Two-panel layout (Leagues + Latest Scores)
- Auto-rotating tournaments (15 seconds rotation)
- Latest 6 scores (auto-updating) 0 based on most recent time-stamp
- Club logos in league tables
- Digital clock showing real time
- Sponsors footer section always on display
- Designed for **no scrolling** on large screens
- Only published tournaments appear.



### 🌍 Public View (/public)


- Headline: Live Tournament Tracker
- Tournament selector (published tournaments only)
- League tables + fixtures
- Knockout bracket
- Winners banner (shown when finals complete)
- Auto-refresh (non-print mode) 


### Knockouts
- Cup & Plate semi-finals
- Manual final generation once semis complete


### Architecture Overview
        ┌────────────────────────────┐
        │     Display Devices        │
        │  (TV, PC, Tablet, Phone)   │
        └───────────────┬────────────┘
                        │ HTTPS
                        ▼
        ┌────────────────────────────┐
        │      React Frontend        │
        │                            │
        │ • Public View              │
        │ • Registration (/register) │
        │ • Admin View               │
        │ • TV Mode                  │
        │ • Logo assets              │
        └───────────────┬────────────┘
                        │ REST API
                        ▼
        ┌────────────────────────────┐
        │   Node.js + Express API    │
        │                            │
        │ • Tournament logic         │
        │ • Registration handling    │
        │ • Admin approval           │
        │ • Fixtures & results       │
        └───────────────┬────────────┘
                        │ SQL (pg)
                        ▼
        ┌────────────────────────────┐
        │     PostgreSQL Database    │
        │                            │
        │ • tournaments              │
        │ • leagues                  │
        │ • teams                    │
        │ • registrations            │
        │ • registration_players     │
        │ • matches                  │
        └────────────────────────────┘

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

### 🗄️ Database Summary
    Core Tables

    tournaments
    leagues
    teams
    matches
    Registration Tables
    registrations
    registration_players

    Key Design Addition :
    registrations.team_row_id → teams.id
        Nullable  
        Set only when approved  
        Prevents duplicate team creation  
        Preserves registration history  

    Tournament Flags

        registration_open BOOLEAN 
        published BOOLEAN

### Database Operations (Critical)

- All database operations are script-driven and explicit.

- Scripts live in:  scripts/

- ⚠️ Never run reset scripts without confirmation ⚠️

        dump-railway.sh – snapshot Railway DB (schema + seed) :  Snapshot Railway (Create Demo Dataset) 
              Produces:
                      db/schema.sql
                      db/seed.sql
                      
        rebuild-local.sh – rebuild local DB : Rebuilds Local Database
        
        railway-reset-schema-only.sh – wipe data, keep schema : Reset Railway – Schema Only 
        
        railway-reset-demo.sh – reset Railway with demo dataset : Resets Railway to demo dataset 

     
        

  
### Safety Rules

      Never auto-run Railway reset scripts
      Always confirm before destructive actions
      Treat local DB as disposable
      Prefer separate Railway projects for demo vs production


### Verification Query

- select 'tournaments' t, count(*) c from public.tournaments
- union all select 'leagues', count(*) from public.leagues
- union all select 'teams', count(*) from public.teams
- union all select 'matches', count(*) from public.matches;

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

    | Route              | Purpose |
    |------              |--------|
    | `/`                | Public view (fixtures & results) |
    | `/admin`           |  Admin view (manage tournaments, teams, fixtures, results) |
    | `/tv`              | Large screen / TV live view |
    | `/register`        | Public team registration|
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

📊 Database Schema Overview

This application uses PostgreSQL to model a youth football tournament system, including league stages, knockout rounds (Cup & Plate), and penalty shootouts.

All data is scoped to a tournament.

- Core Tables

        tournaments
        leagues
        teams
        matches
        Registration Tables (NEW)
        registrations
        registration_players

- Key Design Addition
    registrations.team_row_id → teams.id


- This links a web registration to the created tournament team after admin approval.

    team_row_id is nullable
    Set only when approved
    Unique partial index prevents double-linking
    
---
   

### 🏆 tournaments

- Represents a single tournament event (e.g. 2026 Boys U11).

- Key fields

    id — primary key
    year — tournament year
    gender — boys / girls
    age_group — e.g. U11, U12
    date — tournament date
    kickoff_time — first kickoff time
    match_length — match duration (minutes)
    venue — location
    pitch_league_a, pitch_league_b — pitch assignments
    created_at


- Relationships

    One tournament → many leagues
    One tournament → many teams
    One tournament → many matches
    

### 🧩 leagues

- Represents group stages within a tournament (typically League A and League B).

    Key fields

        id — primary key
        name — e.g. "League A"
        tournament_id — foreign key → tournaments.id
    
    Relationships

        One league → many teams
        One league → many league-stage matches

### 👕teams

- Represents a team participating in a specific tournament.

    Key fields

        id — primary key
        team — team name
        league_id — foreign key → leagues.id
        tournament_id — foreign key → tournaments.id

- Notes

        Teams belong to one league per tournament
        Teams are tournament-scoped (no global team registry)




### ⚽ matches

- Represents all fixtures in the system:

        League matches
        Semi-finals
        Finals (Cup & Plate)
            
- This is the central and most flexible table.

        Match identity
        id — primary key
        tournament_id — foreign key → tournaments.id
        league_id — foreign key → leagues.id
        (NULL for knockout matches)
        home_team_id, away_team_id — foreign keys → teams.id

- Match classification

    round

        'league'
        'semi-final'
        'final'

    bracket

        'cup'
        'plate'

        NULL for league matches

- Scores & status

        home_score, away_score — normal-time scores

        played — set to true once a result is submitted
        

- 🥅 Penalty shootouts (knockout matches)

        Knockout matches may be decided by penalties if normal time ends in a draw.
        Penalty-related fields
        decided_by_penalties — boolean
        penalties_home, penalties_away — penalty shootout scores
        

- Rules

        League matches never use penalties
        Knockout matches may use penalties only when scores are level
        Finals may be decided by penalties
        
- Timestamps

        created_at
        updated_at

- 🔗 Relationship overview

        tournaments
         ├─ leagues
         │   └─ teams
         │       └─ matches (league)
         └─ matches (semi-finals & finals)


### 🧠 Design principles
 League tables are calculated dynamically from played matches.

    Tie-break rules:
    1. Points
    2. Goal Difference (GD)
    3. Goals For (GF)



- Tournament-scoped data
        All leagues, teams, and matches belong to a tournament.

- Single matches table
        League and knockout fixtures share one schema, differentiated by round and bracket.

- Explicit penalty support
        Penalty shootouts are stored explicitly rather than inferred.

- Safe resets
        Foreign keys and cascading deletes allow full tournament resets and demo rebuilds.


### 🧪 Example queries

- Find finals decided by penalties

        select *
        from matches
        where round = 'final'
          and decided_by_penalties = true;


- Get all Cup knockout matches

        select *
        from matches
        where bracket = 'cup'
          and round in ('semi-final', 'final');

---

### 🔌 API Highlights

- Examples:

    Public

        GET /api/tournaments/active
        POST /api/registrations
        GET /api/registrations/:teamIdCode
        PUT /api/registrations/:teamIdCode
        GET /api/kit-colours
        
    Admin

        GET /api/tournaments/:tournamentId/registered-teams
        POST /api/registrations/:registrationId/assign-league
        POST /api/league/generate-fixtures
        POST /api/knockout/regenerate
        POST /api/matches/:id/result
        
        (See full API list in architecture documentation.)

---

### 👕 Team Logos (Improved)

- Logos stored in /public/logos/

- Logo detection is keyword-based, not exact-match

        Example:
        All of the following resolve to the Wroughton Youth FC logo:

        Wroughton Youth FC
        wroughton youth fc
        Wroughton FC
        Wroughton

        This makes the system tolerant of real-world data entry.

        Fallback: defaut logo for teams that dont have a logo matched.

        /logos/default.png
    
    
### 🚀 Installation

## Prerequisites
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


### **CLOUD-based deployment**

Required Files & Setup

1 Environment Variables (.env)
RAILWAY_DATABASE_URL=postgresql://...
LOCAL_DB_NAME=users
Notes:
    • .env is not committed
    

2. Script Reference
All scripts are located in the scripts/ directory.

URL for accessing the app (When hosted on Railway) : 

    https://grassroots-football-tournament-management-system-production.up.railway.app/admin

    https://grassroots-football-tournament-management-system-production.up.railway.app/tv

    https://grassroots-football-tournament-management-system-production.up.railway.app/public
    
    https://grassroots-football-tournament-management-system-production.up.railway.app/register

---

**LAN-based deployment** (no internet required):

1. Run server on a laptop or mini PC
2. Connect all devices to the same Wi-Fi
3. Open:
   - Admin: `http://<LAN-IP>:3000/admin`
   - TV: `http://<LAN-IP>:3000/tv`
4. Put TV browser in fullscreen / kiosk mode


---

## ⚠️ Important Notes

- Admin routes are **not authenticated** (LAN-trusted usage)
- `/api/admin/reset-matches` deletes **all matches** (use with care)


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


Copyright © 2026 - Wroughton Youth Football Club (WYFC)
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
