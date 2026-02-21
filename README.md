# 💪 FitSync


**Course:** CS 5610 – Web Development | Northeastern University

**Authors:** Ayush Miharia & Siddharth

**Project:** Assignment 2 – Full Stack Web Application

**Live Demo:** [https://project-2-webdev.onrender.com](https://project-2-webdev.onrender.com)

**Class Link:** [CS 5610 Web Development](https://neu.edu)

**PPT Link:** [https://docs.google.com/presentation/d/14etu2V-RKHlOub6ergUfdNTo2aOaZrlhQeDa3PqvJ9k/edit?usp=sharing](https://docs.google.com/presentation/d/14etu2V-RKHlOub6ergUfdNTo2aOaZrlhQeDa3PqvJ9k/edit?usp=sharing)

**Document Link:** [https://docs.google.com/document/d/1IWRBi0lmoNm89NO3SBCZiThvWAknWOA-v_muZT77rLs/edit?usp=sharing](https://docs.google.com/document/d/1IWRBi0lmoNm89NO3SBCZiThvWAknWOA-v_muZT77rLs/edit?usp=sharing)

**Video Link:** [https://drive.google.com/drive/folders/1k4uHcQpoDUxjDVg2dJl4WtkQQoNjkQ80?usp=sharing](https://drive.google.com/drive/folders/1k4uHcQpoDUxjDVg2dJl4WtkQQoNjkQ80?usp=sharing)

---

## Project Objective

FitSync is a full-stack fitness tracking web app that allows users to log workouts, track strength progress over time, and manage their gym network. The app features role-based access (User vs Admin), session-based authentication, and a social layer where users can connect with training partners and share workout sessions.

The project has a clean separation of concerns — **Ayush owns the workout management features** and **Siddharth owns the training connections & community features**, with both sharing a common database and infrastructure built together at Snell Library, Northeastern University.

---

## Screenshot

![Home](thumbnail2.png)

---

## Features

### User Features
- Sign up / Sign in with email and password
- Log workouts with date, muscle group, type, duration, exercises (sets/reps/weight), and notes
- Search and filter workouts by muscle group, type, date range, and duration
- View personal workout analytics — total workouts, avg duration, muscle group breakdown, weekly frequency
- Duplicate workout prevention (same date + muscle group + type)
- Add training connections by searching FitSync users by email
- View connections with gym, training style, how you met, and notes
- Filter connections by gym, training style, and how you met
- View all workouts shared with a given connection
- Networking stats — partners per gym, by training style, by how you met
- Tag friends as training partners on workouts — shared workouts appear on both users' pages
- Both owner and training partner can edit a shared workout
- Either user can delete a shared workout (removes for both)

### Admin Features
- Separate admin login (password protected)
- View all 1,000+ registered users in a paginated, searchable table
- See user name, email, gym, training style, and join date
- Delete any user and all their associated data
- Overview stats: total members, total workouts, top gym, top training style

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js v18+ |
| Backend | Express.js (ESM — no `require`) |
| Database | MongoDB Atlas (native driver — no Mongoose, no template engines) |
| Auth | bcrypt + express-session + connect-mongo |
| Frontend | Vanilla JavaScript (client-side rendering only) |
| CSS | CSS Modules (one file per page) |
| Linting | ESLint (flat config) |
| Formatting | Prettier |

---

## Work Distribution

### Ayush — Workout Management

**Backend:**
- `routes/ayush/workouts.js` — Full CRUD for workouts, stats aggregation, duplicate prevention, shared workout logic

**Frontend:**
- `public/pages/ayush/workouts.html` — Workouts page
- `public/pages/ayush/stats.html` — Workout statistics page
- `public/js/ayush/workouts.js` — Workouts page logic (create, edit, delete, filter, shared workouts)
- `public/js/ayush/stats.js` — Stats page charts and data rendering
- `public/css/workouts.css` — Workout cards and filter bar styles

**User Stories Covered:**
- Search and filter workouts by muscle group, exercise type, date range, and duration
- Create, view, edit, and delete workouts with full exercise tracking (sets, reps, weight)
- Workout statistics: total workouts, workouts per week, most trained muscle group, average session duration, workout frequency over time
- Duplicate prevention — same date + muscle group + type is rejected with a clear error
- Link training partners (connections) to specific workouts
- Shared workouts visible on both users' pages with full edit and delete access for both

---

### Siddharth — Training Partners & Community

**Backend:**
- `routes/siddharth/connections.js` — Full CRUD for connections, email-based user lookup, auto-mirror on add/delete, networking stats

**Frontend:**
- `public/pages/siddharth/connections.html` — Connections page
- `public/pages/siddharth/network.html` — Network statistics page
- `public/js/siddharth/connections.js` — Connections page logic (2-step email lookup, add, edit, delete, view shared workouts)
- `public/js/siddharth/network.js` — Networking stats charts
- `public/css/connections.css` — Connection card styles

**User Stories Covered:**
- Add training connections by searching a FitSync user's email address (must exist in the database)
- Create, view, edit, and delete training connections with name, gym, training style, how you met, and notes
- Search and filter connections by name, gym, training style, and how you met
- Networking statistics: total partners, partners per gym, partners by training style, how you met breakdown
- View all workouts associated with a given connection
- When A adds B, B automatically sees A in their connections (auto-mirror)
- When A removes B, both sides are removed simultaneously

---

### Common Files — Built Together at Snell Library, Northeastern University

The following infrastructure files were built collaboratively by Ayush and Siddharth during joint work sessions at the library:

| File | Description |
|---|---|
| `server.js` | Main Express server, session config, route mounting |
| `db/connection.js` | MongoDB connection module |
| `db/seed.js` | Seeds 1,000 users + 150 connections + 200 workouts |
| `routes/auth.js` | User signup, login, logout, admin login |
| `routes/admin.js` | Admin dashboard — view and delete all users |
| `middleware/auth.js` | `requireAuth` and `requireAdmin` middleware |
| `public/index.html` | Home page with User / Admin login choice |
| `public/pages/login.html` | User login and signup page |
| `public/pages/admin/login.html` | Admin login page |
| `public/pages/admin/dashboard.html` | Admin dashboard HTML |
| `public/js/login.js` | Login/signup form logic |
| `public/js/admin.js` | Admin dashboard JS (users table, delete, stats) |
| `public/js/modules/api.js` | Shared API module (all fetch calls to backend) |
| `public/js/modules/nav.js` | Navigation bar + logged-in user display |
| `public/js/modules/toast.js` | Toast notification module |
| `public/js/modules/modal.js` | Modal open/close module |
| `public/js/modules/dates.js` | Date formatting helpers |
| `public/css/global.css` | Global styles (buttons, cards, modals, toasts) |
| `public/css/nav.css` | Navigation bar styles |
| `package.json` | All dependencies and npm scripts |
| `eslint.config.js` | ESLint flat config (no errors) |
| `.prettierrc` | Prettier formatting config |
| `.env.example` | Environment variable template |
| `LICENSE` | MIT license |
| `README.md` | This file |

---

## MongoDB Collections

| Collection | Description |
|---|---|
| `users` | All registered accounts (1,000 seeded + new signups) |
| `workouts` | Workout sessions with exercises, duration, muscle group, training partners |
| `connections` | Training partner relationships with gym, style, how met, and notes |

---

## Project Structure

```
fitsync/
├── routes/
│   ├── auth.js                        ← Shared
│   ├── admin.js                       ← Shared
│   ├── ayush/
│   │   └── workouts.js                ← Ayush
│   └── siddharth/
│       └── connections.js             ← Siddharth
│
├── public/
│   ├── index.html                     ← Shared
│   ├── css/
│   │   ├── global.css                 ← Shared
│   │   ├── nav.css                    ← Shared
│   │   ├── workouts.css               ← Ayush
│   │   └── connections.css            ← Siddharth
│   ├── js/
│   │   ├── login.js                   ← Shared
│   │   ├── admin.js                   ← Shared
│   │   ├── modules/
│   │   │   ├── api.js                 ← Shared
│   │   │   ├── nav.js                 ← Shared
│   │   │   ├── toast.js               ← Shared
│   │   │   ├── modal.js               ← Shared
│   │   │   └── dates.js               ← Shared
│   │   ├── ayush/
│   │   │   ├── workouts.js            ← Ayush
│   │   │   └── stats.js               ← Ayush
│   │   └── siddharth/
│   │       ├── connections.js         ← Siddharth
│   │       └── network.js             ← Siddharth
│   └── pages/
│       ├── login.html                 ← Shared
│       ├── admin/
│       │   ├── login.html             ← Shared
│       │   └── dashboard.html         ← Shared
│       ├── ayush/
│       │   ├── workouts.html          ← Ayush
│       │   └── stats.html             ← Ayush
│       └── siddharth/
│           ├── connections.html       ← Siddharth
│           └── network.html           ← Siddharth
│
├── db/
│   ├── connection.js                  ← Shared
│   └── seed.js                        ← Shared
│
├── middleware/
│   └── auth.js                        ← Shared
│
├── server.js                          ← Shared
├── package.json                       ← Shared
├── eslint.config.js                   ← Shared
├── .prettierrc                        ← Shared
├── .env.example                       ← Shared
├── LICENSE                            ← Shared
└── README.md                          ← Shared
```

---

## Instructions to Build & Run

### Prerequisites
- Node.js v18 or higher
- MongoDB Atlas account (free tier works)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/AyushMiharia/Project-2-WebDev.git
cd Project-2-WebDev

# 2. Install dependencies
npm install

# 3. Create your .env file (copy the example and fill in your values)
```

Your `.env` file should look like:
```
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/fitsync2?appName=Cluster0
SESSION_SECRET=your-secret-key-here
PORT=3000
ADMIN_PASSWORD=admin123
```

```bash
# 4. Seed the database (creates 1000 users, 150 connections, 200 workouts)
node db/seed.js

# 5. Start the server
npm start
```

Open **http://localhost:3000** in your browser.

### Demo Accounts

| Role | Email | Password |
|---|---|---|
| User (Ayush) | ayush@fitsync.app | demo123 |
| User (Siddharth) | siddharth@fitsync.app | demo123 |
| Admin | *(use /admin/login page)* | admin123 |

---

## License

MIT — see [LICENSE](./LICENSE)
