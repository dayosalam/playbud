-- Migration: Align bookings table with simplified booking model (no status/payments)
-- Apply this after 0001_create_core_tables.sql

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'bookings'
          AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE public.bookings DROP COLUMN payment_status;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'bookings'
          AND column_name = 'payment_amount'
    ) THEN
        ALTER TABLE public.bookings DROP COLUMN payment_amount;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'bookings'
          AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE public.bookings DROP COLUMN cancelled_at;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'bookings'
          AND column_name = 'status'
    ) THEN
        ALTER TABLE public.bookings DROP COLUMN status;
    END IF;
END
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'bookings_game_status_idx'
    ) THEN
        DROP INDEX public.bookings_game_status_idx;
    END IF;
END
$$;
