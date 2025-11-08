# Backend Migrations & Data Sync

This folder now contains SQL migrations and helper scripts to keep the Supabase database in sync with the local JSON storage that powered early development.

## 1. Apply the SQL migration

```bash
# Open the Supabase SQL editor and paste the contents of:
backend/migrations/0001_create_core_tables.sql

# Alternatively, with psql:
psql "$SUPABASE_DB_URL" -f backend/migrations/0001_create_core_tables.sql
```

The migration:

- Creates (or updates) the `organizers`, `games`, and `bookings` tables
- Adds new organizer metadata columns (`sports`, `experience`, `unique_link`)
- Adds `created_by_user_id` and `participant_user_ids` columns to the `games` table
- Sets up the new `bookings` table used by the join-game flow

> **Note:** Run this migration once in each Supabase environment (dev/staging/prod).

## 2. Push local seed data to Supabase

With the Service Role credentials available (`SUPABASE_URL` and `SERVICE_ROLE` in your environment), run:

```bash
cd backend
poetry run python -m app.scripts.migrate_local_data
```

The script will:

1. Read any data from `app/storage/*.json`
2. Upsert users, organizers, games, and bookings into Supabase
3. Skip files that are missing

If you only need to seed certain tables, remove entries from the JSON files before running the script.

## 3. Environment variables

Ensure the following are set when running migrations or scripts:

- `SUPABASE_URL`
- `SERVICE_ROLE` (Supabase service role key)
- `SUPABASE_DB_URL` (only required when using `psql` directly)

These can live in `backend/app/.env` for local development.
