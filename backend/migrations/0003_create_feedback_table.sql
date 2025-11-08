CREATE TABLE IF NOT EXISTS public.feedback (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    email text NOT NULL,
    rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
    message text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('UTC', now())
);

CREATE INDEX IF NOT EXISTS feedback_rating_idx ON public.feedback (rating);
