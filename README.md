# 💪 FitSync

**Authors:** Ayush (Workout Management) & Siddharth (Training Partners & Community)  
**Class:** [CS 5610 Web Development – Northeastern University](https://neu.edu)  
**Project:** Assignment 2 – Full Stack Web App

---

## Project Objective

FitSync is a fitness tracking web app that lets users log workouts, analyze their training patterns, and manage their gym network. Built with a clean separation of concerns — Ayush owns the workout management features, Siddharth owns the connections/community features.

---

## Screenshot

> Add a screenshot here after deployment.

---

## Tech Stack

- **Backend:** Node.js + Express (ESM — no `require`)
- **Database:** MongoDB (native driver — no Mongoose)
- **Frontend:** Vanilla JavaScript (client-side rendering, no frameworks)
- **Auth:** bcrypt + express-session + connect-mongo
- **CSS:** Module-per-page architecture

---

## File Structure

```
fitsync/
├── routes/
│   ├── auth.js                  — Login / signup / admin-login
│   ├── admin.js                 — Admin: view all records
│   ├── ayush/
│   │   └── workouts.js          — Ayush's workout CRUD + stats
│   └── siddharth/
│       └── connections.js       — Siddharth's connections CRUD + stats
├── public/
│   ├── js/
│   │   ├── ayush/
│   │   │   ├── workouts.js      — Workout page logic
│   │   │   └── stats.js         — Workout stats page
│   │   ├── siddharth/
│   │   │   ├── connections.js   — Connections page logic
│   │   │   └── network.js       — Network stats page
│   │   └── modules/             — Shared: api, toast, modal, nav, dates
│   ├── css/                     — CSS modules per page
│   └── pages/                   — HTML pages organized by section
├── db/
│   ├── connection.js            — MongoDB connector
│   └── seed.js                  — Seeds 1000 workouts + 150 connections
└── middleware/
    └── auth.js                  — requireAuth + requireAdmin
```

---

## Instructions to Run

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier)

### Setup

```bash
# 1. Clone and enter the folder
git clone <repo-url>
cd fitsync

# 2. Install dependencies
npm install

# 3. Create .env
cp .env.example .env
# Edit .env with your MongoDB URI

# 4. Seed database (1000 workouts + 150 connections)
node db/seed.js

# 5. Start server
npm start
```

Open **http://localhost:3000**

### Demo Accounts
| Email | Password |
|---|---|
| ayush@fitsync.app | demo123 |
| siddharth@fitsync.app | demo123 |

### Admin Login
Password: `admin123` (change via `ADMIN_PASSWORD` in `.env`)

---

## Collections

| Collection | Description |
|---|---|
| `users` | Registered accounts |
| `workouts` | Workout sessions (Ayush's feature) |
| `connections` | Training partners (Siddharth's feature) |

---

## License

MIT – see [LICENSE](./LICENSE)
