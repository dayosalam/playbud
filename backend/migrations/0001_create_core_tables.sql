-- Migration: Create and align core PlayBud tables for Supabase
-- Run this SQL in your Supabase project's SQL editor or via psql.

-- Ensure UUID extension is present (Supabase enables it by default, but keep for local parity).
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- Users
-- =========================
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS preferred_city text;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS heard_about text;

-- =========================
-- Organizers
-- =========================
CREATE TABLE IF NOT EXISTS public.organizers (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    slug text UNIQUE,
    sports text[] DEFAULT '{}'::text[],
    experience text,
    unique_link text,
    game_ids text[] DEFAULT '{}'::text[],
    created_at timestamptz NOT NULL DEFAULT timezone('UTC', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS organizers_user_id_idx ON public.organizers (user_id);

-- Backfill columns for existing installations.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'organizers'
          AND column_name = 'sports'
    ) THEN
        ALTER TABLE public.organizers ADD COLUMN sports text[] DEFAULT '{}'::text[];
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'organizers'
          AND column_name = 'experience'
    ) THEN
        ALTER TABLE public.organizers ADD COLUMN experience text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'organizers'
          AND column_name = 'unique_link'
    ) THEN
        ALTER TABLE public.organizers ADD COLUMN unique_link text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'organizers'
          AND column_name = 'game_ids'
    ) THEN
        ALTER TABLE public.organizers ADD COLUMN game_ids text[] DEFAULT '{}'::text[];
    END IF;
END
$$;

-- =========================
-- Games
-- =========================
CREATE TABLE IF NOT EXISTS public.games (
    id uuid PRIMARY KEY,
    organiser_id uuid REFERENCES public.organizers (id) ON DELETE SET NULL,
    created_by_user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
    name text NOT NULL,
    venue text NOT NULL,
    city_slug text NOT NULL,
    sport_code text NOT NULL,
    date timestamptz NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    skill text NOT NULL,
    gender text NOT NULL,
    players integer NOT NULL CHECK (players > 0),
    description text,
    rules text,
    frequency text NOT NULL,
    price numeric(10,2),
    is_private boolean NOT NULL DEFAULT false,
    cancellation text NOT NULL DEFAULT '24 Hours',
    team_sheet boolean NOT NULL DEFAULT true,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','unapproved','completed')),
    participant_user_ids text[] DEFAULT '{}'::text[],
    created_at timestamptz NOT NULL DEFAULT timezone('UTC', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('UTC', now())
);

CREATE INDEX IF NOT EXISTS games_city_slug_idx ON public.games (city_slug);
CREATE INDEX IF NOT EXISTS games_sport_code_idx ON public.games (sport_code);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'games'
          AND column_name = 'created_by_user_id'
    ) THEN
        ALTER TABLE public.games
            ADD COLUMN created_by_user_id uuid REFERENCES public.users (id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'games'
          AND column_name = 'participant_user_ids'
    ) THEN
        ALTER TABLE public.games
            ADD COLUMN participant_user_ids text[] DEFAULT '{}'::text[];
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'games'
          AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.games
            ADD COLUMN updated_at timestamptz NOT NULL DEFAULT timezone('UTC', now());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'games'
          AND column_name = 'status'
    ) THEN
        ALTER TABLE public.games
            ADD COLUMN status text NOT NULL DEFAULT 'pending'
            CHECK (status IN ('pending','confirmed','unapproved','completed'));
    END IF;
END
$$;

-- =========================
-- Bookings
-- =========================
CREATE TABLE IF NOT EXISTS public.bookings (
    id uuid PRIMARY KEY,
    game_id uuid NOT NULL REFERENCES public.games (id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    status text NOT NULL CHECK (status IN ('confirmed', 'pending', 'cancelled', 'waitlist')),
    payment_status text CHECK (payment_status IN ('paid', 'unpaid', 'refunded', 'pending')),
    payment_amount numeric(10,2),
    joined_at timestamptz NOT NULL DEFAULT timezone('UTC', now()),
    cancelled_at timestamptz,
    notes text,
    CONSTRAINT bookings_unique_participant UNIQUE (game_id, user_id)
);

CREATE INDEX IF NOT EXISTS bookings_game_status_idx ON public.bookings (game_id, status);
CREATE INDEX IF NOT EXISTS bookings_user_idx ON public.bookings (user_id);
