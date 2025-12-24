# Wroughton Youth Football Club - Summer Tournament App

A full-stack web application for managing youth football tournaments, replacing paper schedules and WhatsApp updates with a live admin dashboard and public-facing results view.

Built for Wroughton Youth Football Club (WYFC)

WYFC Summer Tournament App
Copyright 2025 Wroughton Youth Football Club

This product includes software developed by Wroughton Youth Football Club (WYFC)
## 📄 License
Apache License 2.0 © 2025 Wroughton Youth Football Club
https://www.apache.org/licenses/LICENSE-2.0
---

## 📌 Features

### Admin Control Panel
- Create and manage tournaments
- Define **Year, Gender, Age Group, Date, Kickoff Time, Match Length, Venue**
- Add teams and assign to leagues
- Auto-generate **round-robin league fixtures**
- Enter results and update league tables
- Generate **Cup & Plate knockout stages**
- Delete fixtures, teams, or tournaments
- Print-ready public view

### Public View
- Read-only tournament display
- Live league tables and fixtures
- Knockout brackets
- Tournament winners banner
- Auto-refresh (polling)
- Optimised print mode for spectators

---

## 🧱 Software Architecture

### High-level architecture
┌────────────┐ REST API ┌──────────────┐
│ Frontend │ ───────────────▶ │ Backend │
│ React │ │ Express.js │
│ (Vite) │ ◀─────────────── │ │
└────────────┘ JSON └──────────────┘
│
▼
┌──────────────┐
│ PostgreSQL │
│ Database │
└──────────────┘

yaml
Copy code

- **Frontend**: React + Vite (AdminView, PublicView)
- **Backend**: Node.js + Express REST API
- **Database**: PostgreSQL

---

## 📂 Repository

**GitHub**  
👉 https://github.com/Zoomin10/WYFC-summer-tournament-app

---

## 📁 Project Structure

### Frontend (Vite + React)
src/
├── pages/
│ ├── AdminView.jsx
│ └── PublicView.jsx
│
├── components/
│ ├── TeamList.jsx
│ ├── AddTeam.jsx
│ ├── AddFixture.jsx
│ ├── Fixtures.jsx
│ ├── LeagueTable.jsx
│ └── KnockoutBracket.jsx
│
├── utils/
│ └── formatLeague.js
│
├── styles/
│ ├── public.css
│ ├── fixtures.css
│ └── print.css
│
├── App.jsx
└── main.jsx

shell
Copy code

### Backend (Express)
backend/
├── app.js
├── package.json
├── .env
└── public/

yaml
Copy code

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL
- npm
- pgAdmin or `psql`

---

## 🔐 Database Setup (PostgreSQL)

### Create / use database
```sql
CREATE DATABASE users;
Tables
tournaments
sql
Copy code
CREATE TABLE tournaments (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  gender TEXT NOT NULL,
  age_group TEXT NOT NULL,
  date DATE,
  kickoff_time TIME,
  match_length INTEGER,
  venue TEXT,
  created_at TIMESTAMP DEFAULT now()
);
leagues
sql
Copy code
CREATE TABLE leagues (
  id SERIAL PRIMARY KEY,
  name TEXT,
  tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE
);
teams
sql
Copy code
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  team TEXT,
  league_id INTEGER REFERENCES leagues(id),
  tournament_id INTEGER REFERENCES tournaments(id)
);
matches
sql
Copy code
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  home_team_id INTEGER REFERENCES teams(id),
  away_team_id INTEGER REFERENCES teams(id),
  league_id INTEGER REFERENCES leagues(id),
  tournament_id INTEGER REFERENCES tournaments(id),
  round TEXT,
  home_score INTEGER,
  away_score INTEGER,
  played BOOLEAN DEFAULT false
);
🔐 Environment Variables (Backend)
.env (backend root)
env
Copy code
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_NAME=users
DB_PORT=5432
PORT=3000
⚠️ Ensure .env is in .gitignore.

🚀 Running the App (Local Dev)
Backend
bash
Copy code
cd backend
npm install
node app.js
Runs on: http://localhost:3000

Frontend
bash
Copy code
cd frontend
npm install
npm run dev
Runs on: http://localhost:5173

🔁 API Routes
Tournaments
GET /api/tournaments

POST /api/tournaments

DELETE /api/tournaments/:id

Leagues
GET /api/leagues?tournamentId=

Teams
GET /api/teams?tournamentId=

POST /api/teams

DELETE /api/teams/:id

Matches / Fixtures
GET /api/matches

POST /api/matches

DELETE /api/matches/:id

Admin / Automation
POST /api/league/generate-fixtures

POST /api/knockout/regenerate

POST /api/knockout/generate-final

POST /api/admin/reset-tournament

🖨️ Print Mode
Public view supports print mode:

arduino
Copy code
/public?tournamentId=XX&print=true
Auto-triggers window.print()

Disables auto-refresh

Optimised layout via print.css

AdminView includes a Print Public View button.

⚠️ Known Constraints
Tournament creation must also create League A & League B

Knockouts require completed league fixtures

PublicView uses polling (60s refresh), not websockets

CSS files can overlap — layout bugs may be style conflicts

Frontend (5173) and Backend (3000) are separate servers

🔒 Security Notes
Do not commit database credentials

Consider creating a dedicated DB user instead of postgres

Use .env files in all environments

🧭 Future Enhancements
Inline editing of tournament metadata

Role-based admin access

Venue → Google Maps links

WebSocket live updates

Tournament archiving

Mobile-first admin layout

👤 Author
Built and maintained by WYFC
GitHub: https://github.com/Zoomin10
