# Wroughton Youth FC – Tournament Management System

A Cloud hosted, web application for managing youth football tournaments, fixtures, league tables, knockouts, and for tournament matchdays.

Designed for **simplicity, reliability, and readability on large screens**, this system supports admins on mobile/tablet/PC, public viewers on phones, and a dedicated TV mode for displaying on club-house / pavilion smart-TV (via TV web browser) for on-site spectators.

---

## ✨ Features

### Core
- Tournament creation (year, gender, age group, date, location, pitch allocation)
- League A / League B structure
- Team allocation to leagues
- Round-robin fixture generation, or manual fixture creation
- Result submission
- Automatic league tables adjustments based on results

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

## 🧭 Application Routes

| Route | Purpose |
|------|--------|
| `/` | Public view (fixtures & results) |
| `/admin` | Admin view (manage tournaments, teams, fixtures, results) |
| `/tv` | Large screen / TV live view |

---

## 🏗️ Architecture Overview

```text
Browser (Public / Admin / TV)
        │
        ▼
Node.js + Express (REST API)
        │
        ▼
PostgreSQL Database
```

The frontend is a React SPA that communicates with a REST API. The TV view polls the backend at short intervals to keep displays up to date.

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

**LAN-based deployment** (no internet required):

1. Run server on a laptop or mini PC
2. Connect all devices to the same Wi-Fi
3. Open:
   - Admin: `http://<LAN-IP>:3000/admin`
   - TV: `http://<LAN-IP>:3000/tv`
4. Put TV browser in fullscreen / kiosk mode

---

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

- Standings-based knockout seeding
- WebSocket live updates
- Admin authentication
- Historical tournament archive
- Print-friendly public views

---

## 📄 License / Ownership

Developed for **Wroughton Youth FC**.

Internal club use unless otherwise agreed.

---

## 🙌 Credits

Built to support volunteers, referees, and spectators on matchday.
Designed for clarity, speed, and reliability.

