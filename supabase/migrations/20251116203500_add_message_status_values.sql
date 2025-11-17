DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'message_status' AND e.enumlabel = 'queued'
  ) THEN
    ALTER TYPE public.message_status ADD VALUE 'queued';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'message_status' AND e.enumlabel = 'pending'
  ) THEN
    ALTER TYPE public.message_status ADD VALUE 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'message_status' AND e.enumlabel = 'sending'
  ) THEN
    ALTER TYPE public.message_status ADD VALUE 'sending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'message_status' AND e.enumlabel = 'cancelled'
  ) THEN
    ALTER TYPE public.message_status ADD VALUE 'cancelled';
  END IF;
END$$;
