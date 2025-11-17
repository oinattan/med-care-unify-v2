-- Migration: create quick_replies table
DO $$
BEGIN
  -- Ensure pgcrypto extension for gen_random_uuid is available
  CREATE EXTENSION IF NOT EXISTS pgcrypto;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'quick_replies'
  ) THEN
    CREATE TABLE public.quick_replies (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      message text NOT NULL,
      category text,
      usage integer DEFAULT 0 NOT NULL,
      created_at timestamptz DEFAULT now() NOT NULL,
      updated_at timestamptz DEFAULT now() NOT NULL
    );
  END IF;
END$$;
