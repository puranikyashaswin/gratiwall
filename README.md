# GratiWall — Campus Appreciation & Recognition Platform

GratiWall is a full-stack MERN application where students, faculty and staff send public
thank-you notes to one another. Every note passes through an admin moderation queue before
it is published. Approved notes appear on a **live, auto-refreshing public wall** designed
for cafeteria and auditorium large screens, and an **analytics dashboard** tracks how
appreciation moves around campus.

Built for the Full Stack Development course PBL, Woxsen University.

## Features

- **Public gratitude wall** (`/`) — masonry grid of approved notes with a rotating
  "Spotlight" feature that crossfades between notes every 8 seconds; new notes animate in
  live over Socket.IO; works fullscreen on a TV and on a laptop.
- **Authentication & roles** — JWT login with bcrypt-hashed passwords; roles: `student`,
  `faculty`, `staff`, `admin`. Route guards on both the frontend and the backend.
- **Send a note** (`/submit`) — searchable recipient picker (registered users get notified),
  four categories, 500-character messages with counter, optional anonymity (the wall hides
  the sender; the database and the admin view retain them).
- **My notes** (`/my-notes`) — track each note's moderation status, including rejection reasons.
- **Moderation queue** (`/admin`) — pending/approved/rejected/flagged tabs; admins always see
  the real sender (anonymous notes are labelled "anonymous on wall"); approve publishes the
  note instantly to every connected wall via Socket.IO and emails the recipient.
- **Analytics** (`/admin/analytics`) — MongoDB aggregation pipelines powering: notes per
  department, weekly category trends (last 8 weeks), top-10 most-appreciated recipients,
  and status totals.
- **Email notifications** — Nodemailer; when SMTP is not configured the full email is logged
  to the server console instead (the app never crashes on missing SMTP).

## Tech stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 18 (Vite), React Router 6, axios, socket.io-client, recharts |
| Backend  | Node.js, Express 4, Mongoose 8 (MongoDB), JWT, bcryptjs, Socket.IO, Nodemailer |
| Layout   | npm workspaces monorepo (`server/`, `client/`), `concurrently` for dev |

## Setup

Prerequisites: Node.js 18+ and a MongoDB instance (local `mongod`, MongoDB Atlas, or Docker).

```bash
# 1. Install everything (root install installs server + client via npm workspaces)
npm install          # equivalent to: npm run install-all

# 2. Configure the server environment
cp server/.env.example server/.env
#    - set JWT_SECRET to a long random string
#    - MONGO_URI defaults to mongodb://127.0.0.1:27017/gratiwall
#    - SMTP_* values are optional; without them emails are printed to the console

# 3. Load seed data (admin, 12 users, 24 notes across the last 8 weeks)
npm run seed

# 4. Start both apps (API on :5001, Vite dev server on :5173 with proxy to :5001)
npm run dev
```

Open **http://localhost:5173**. The wall at `/` is public; log in to send notes.

> **macOS note:** the API defaults to port **5001** because macOS AirPlay Receiver occupies
> port 5000. If the server ever reports `EADDRINUSE`, set a different `PORT` in `server/.env`.

## Seeded credentials

All seeded accounts use the password **`password123`**.

| Role    | Email |
|---------|-------|
| Admin   | `admin@gratiwall.edu` |
| Student | `aarav.mehta@gratiwall.edu` (also: ishita.reddy, rohan.deshmukh, kabir.chauhan, sanya.kapoor, meera.nair) |
| Faculty | `priya.raghavan@gratiwall.edu` (also: vikram.joshi, fatima.sheikh) |
| Staff   | `ramesh.yadav@gratiwall.edu` (also: lakshmi.ammal, suresh.patil) |

The seed creates 24 notes: 17 published across the last 8 weeks, 4 pending in the queue,
2 rejected (with reasons) and 1 flagged.

## Project structure

```
├── package.json            # npm workspaces + root scripts (dev, seed, build)
├── server/
│   ├── index.js            # Express + HTTP + Socket.IO bootstrap, error handling
│   ├── seed.js             # realistic seed data (npm run seed)
│   ├── .env.example        # PORT, MONGO_URI, JWT_SECRET, optional SMTP
│   ├── config/db.js        # graceful MongoDB connection (server stays up if DB is down)
│   ├── models/             # User, Note (with wall-safe serialization)
│   ├── middleware/auth.js  # JWT protect + role guard
│   ├── routes/             # auth.js, notes.js, admin.js (queue + analytics)
│   └── utils/              # mailer.js (console fallback), socket.js
└── client/
    ├── vite.config.js      # dev proxy for /api and /socket.io
    └── src/
        ├── api/client.js   # axios instance with auth interceptor
        ├── context/        # AuthContext, SocketContext
        ├── components/     # Navbar, NoteCard, StatusBadge, RouteGuards, States
        ├── pages/          # Wall, Login, Register, Submit, MyNotes, AdminQueue, AdminAnalytics
        └── index.css       # design system (Fraunces + Inter, warm paper palette)
```

## API overview

| Method & path | Access | Purpose |
|---|---|---|
| `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` | public / auth | accounts & session |
| `POST /api/notes` | auth | create a note (enters queue as pending) |
| `GET /api/notes/mine` | auth | caller's notes with statuses |
| `GET /api/notes/wall?page=&limit=` | public | approved notes, newest first; anonymous notes have sender stripped server-side |
| `GET /api/notes/recipients?q=` | auth | user search for the recipient picker (never returns emails) |
| `GET /api/admin/notes?status=` | admin | moderation queue (admins see real senders) |
| `PATCH /api/admin/notes/:id` | admin | `{action: approve\|reject\|flag, reason?}`; approve emits `note:published` and emails the recipient |
| `GET /api/admin/analytics` | admin | aggregation pipelines for the dashboard |
| `GET /api/health` | public | server + database status |

## Scripts

| Command | Where | What it does |
|---|---|---|
| `npm install` / `npm run install-all` | root | install server + client (npm workspaces) |
| `npm run dev` | root | run server (nodemon) and client (Vite) together |
| `npm run seed` | root | wipe and reseed the database |
| `npm run build` | root | production build of the client |
| `npm start` | root | start the API server (production mode) |

## Deployment

The app deploys as three services: the React client on Vercel, the
Express + Socket.IO API on Render, and MongoDB Atlas as the database.

### 1. MongoDB Atlas

1. Create a cluster, a database user, and allow network access from the
   Render service (or `0.0.0.0/0` for simplicity on a class project).
2. Copy the connection string; it looks like
   `mongodb+srv://user:pass@cluster0.mongodb.net/gratiwall`.
3. To seed Atlas, run the seed locally with the Atlas URI:

   ```bash
   cd server
   MONGO_URI="mongodb+srv://user:pass@cluster0.mongodb.net/gratiwall" npm run seed
   ```

### 2. API on Render

Create a Web Service from the repo with:

| Setting | Value |
|---|---|
| Root directory | `server` |
| Build command | `npm install` |
| Start command | `npm start` |
| Health check path | `/api/health` |

Environment variables:

| Variable | Notes |
|---|---|
| `PORT` | Injected by Render automatically; no need to set it |
| `MONGO_URI` | The Atlas connection string |
| `JWT_SECRET` | Long random string. If missing in production the server boots with a loud warning and an insecure default, so set it |
| `CLIENT_URL` | The Vercel frontend origin, e.g. `https://gratiwall.vercel.app` (comma-separated list allowed) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Optional; without them notification emails are printed to the server log |
| `JWT_EXPIRES_IN` | Optional, defaults to `7d` |

Socket.IO works on Render Web Services without extra configuration since
websockets are supported on the same port as HTTP.

### 3. Client on Vercel

Import the repo as a Vite project with:

| Setting | Value |
|---|---|
| Root directory | `client` |
| Build command | `npm run build` |
| Output directory | `dist` |

Environment variables:

| Variable | Notes |
|---|---|
| `VITE_API_URL` | The Render service URL, no trailing slash, e.g. `https://gratiwall-api.onrender.com`. Embedded at build time, so redeploy after changing it |

`client/vercel.json` rewrites every path to `/index.html`, so deep links
such as `/to/Someone` survive a refresh.

Local development is unaffected: with `VITE_API_URL` unset, the client
uses relative URLs and the Vite proxy forwards them to the API on
port 5001, exactly as before.
