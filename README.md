# PlayBud – Social Sports Platform

PlayBud helps local organisers publish casual sports sessions and lets players discover and join games that match their vibe. This repository contains the full-stack implementation: a FastAPI backend backed by Supabase and a Vite/React frontend styled with shadcn/ui.

---

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Environment Configuration](#environment-configuration)
- [Running Locally](#running-locally)
- [Running with Docker](#running-with-docker)
- [Development Workflow](#development-workflow)
- [Key Flows](#key-flows)
- [Troubleshooting](#troubleshooting)

---

## Features

- **Game discovery** – advanced filtering (city, sport, ability, gender, date, live availability) and map view.
- **Spot details** – full session breakdown, organiser highlights, participant roster, join/cancel flows.
- **Game hosting** – onboarding flow for organisers, game creation with price, capacity, cancellation policy, and city metadata fetched from Supabase reference tables.
- **Admin moderation** – `/admin/games` dashboard for approved emails to review all games, inspect creator/organiser/participants, and update status.
- **Profile management** – update personal info, preferred city, view upcoming vs previous games (pending/unapproved states included).
- **Mobile-app CTA** – app download panel leads to a “Coming Soon” landing page; company events CTA links to a dedicated request page.
- **Feedback capture** – landing-page modal posts reviews (name/email/rating/message) to the backend.
- **Notifications page** – placeholder feed reachable from the header bell icon.

---

## Architecture

| Layer     | Tech                                             | Notes                                                                 |
|-----------|--------------------------------------------------|-----------------------------------------------------------------------|
| Frontend  | Vite + React 18 + TypeScript + shadcn/ui         | State via hooks/context; React Router for navigation                  |
| Backend   | FastAPI + Pydantic + Supabase client             | JWT auth, bookings, games, organisers, admin router, feedback         |
| Database  | Supabase (PostgreSQL + storage)                  | `games`, `bookings`, `organizers`, `users`, `feedback`, reference data |
| Infra     | Dockerfiles per service + root `docker-compose`  | Two containers: backend (uvicorn) and frontend (nginx serving build)  |

---

## Prerequisites

- **Node.js** ≥ 20.x (frontend build/dev)
- **pnpm** or **npm** (project uses npm scripts by default)
- **Python** ≥ 3.10 (backend)
- **Supabase** project or Postgres connection with equivalent schema
- **Docker + docker-compose** (optional, for containerized run)

---

## Project Structure

```
.
├── backend/
│   ├── app/                     # FastAPI application package
│   ├── migrations/              # SQL migration scripts (Supabase schema)
│   ├── Dockerfile               # Backend container
│   ├── requirements.txt
│   └── .dockerignore
├── social-sport-app/
│   ├── src/                     # React app
│   ├── Dockerfile               # Frontend container (build + nginx)
│   ├── docker/nginx.conf
│   └── .dockerignore
├── docker-compose.yml           # Runs both services together
└── README.md                    # (this file)
```

---

## Environment Configuration

### Backend (`backend/.env`)

Create `backend/.env` from the template below. These are consumed via `backend/app/core/config.py`.

```env
SUPABASE_URL=...
SERVICE_ROLE=...
JWT_SECRET_KEY=super-secret
JWT_REFRESH_SECRET_KEY=super-refresh-secret
ADMIN_EMAILS=admin@example.com,second.admin@example.com
```

- `SUPABASE_URL` / `SERVICE_ROLE` – service role key for Supabase PostgREST.
- `ADMIN_EMAILS` – comma-separated list of emails allowed to access `/api/admin/*`.

### Frontend (`social-sport-app/.env`)

```env
VITE_API_URL=http://localhost:8000/api
VITE_ADMIN_EMAILS=admin@example.com,second.admin@example.com
```

`VITE_ADMIN_EMAILS` mirrors the backend list so the UI can hide admin routes for non-admins.

---

## Running Locally

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API is now available at `http://localhost:8000`, with docs at `/docs`.

### Frontend

```bash
cd social-sport-app
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Visit `http://localhost:5173`. Ensure `VITE_API_URL` points at the backend host/port.

> **Note:** Auth routes require a valid token from the backend. Sign up/login from the UI; tokens are stored via the `api-client` helper.

---

## Running with Docker

1. Update `env.docker` with the ports and `VITE_API_URL` you want exposed.
2. Build & run the stack (compose reads `env.docker` for substitution):

```bash
docker-compose --env-file env.docker up --build
```

- Backend → `http://localhost:${BACKEND_PORT}` (default 8000)
- Frontend → `http://localhost:${FRONTEND_PORT}` (default 5173)

Environment variables are injected via `backend/.env` plus `env.docker` (for ports and frontend API URL). Stop the stack with `docker-compose --env-file env.docker down`.

---

## Development Workflow

1. **Supabase schema** – run the migrations in `backend/migrations` (either through Supabase SQL editor or psql). `0003_create_feedback_table.sql` adds the feedback storage required by the landing page.
2. **Reference data** – use `backend/app/scripts/sync_reference_data.py` to push seed data into Supabase for cities/sports/genders/abilities, or provide that data manually.
3. **Backend** – add routers under `backend/app/routers`, services in `backend/app/services`, and update `backend/app/main.py` to include new routers.
4. **Frontend** – new pages live in `social-sport-app/src/pages`, share UI through components in `src/components`, and access APIs through `src/services`.
5. **Admin tooling** – any new moderation capability should extend `/api/admin/*` (protected by `_require_admin`) and the `/admin/...` routes in the React app (guarded via ProtectedRoute + email check).

---

## Key Flows

### Joining games
- `FindGame.tsx` lists only games whose status is `confirmed`.
- `SpotDetails.tsx` renders the live participant list (backed by Supabase bookings).
- `booking_service.join_game` enforces: future event, capacity, unique booking per user, and cancellation-window cutoff (30 minutes before cancellation deadline). Cancelling respects the same policy.

### Game creation & moderation
- Non-admin user: `AddGame.tsx` prompts for organiser info (or reuses an existing organiser record), then posts to `/api/games`.
- Admin user: `/admin/games` lists all sessions. Each card:
  - Change status via dropdown.
  - “View details” opens a modal with game metadata, creator info, organiser info, and participants (mirrors SpotDetails but for moderation).
- Admin API endpoints:
  - `GET /api/admin/games?status=pending` – filterable list.
  - `GET /api/admin/games/{id}` – aggregated game/creator/organiser/participants data.
  - `PATCH /api/admin/games/{id}/status` – update status (pending/confirmed/unapproved/completed).

### Feedback & Notifications
- Landing page “Leave a review” modal posts to `POST /api/feedback`.
- Bell icon navigates to `/notifications`, which currently renders mock data (swap with a future `/api/notifications` endpoint when ready).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `403 Admins only` | Ensure your email is listed in both `ADMIN_EMAILS` and `VITE_ADMIN_EMAILS`, restart backend/frontend, and re-login. |
| Games not visible in FindGame | Only games with `status=confirmed` (and future start time) are shown. Pending/unapproved games remain on the creator’s profile. |
| Join blocked | Check the cancellation policy (e.g., “72 Hours”); joins close 30 minutes before the cancellation deadline. |
| Docker containers can’t reach Supabase | Confirm `backend/.env` is mounted and network egress is permitted (Supabase URL accessible from Docker). |
| Styling/components missing | Run `npm install` in `social-sport-app` to restore shadcn/ui dependencies. |

---

Happy hacking! If you add major features, update this README and the migrations so the next developer stays in sync. Reach out via the Notifications page or add an entry there for high-level announcements. 🚀
