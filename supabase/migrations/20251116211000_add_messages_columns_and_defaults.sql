DO $$
BEGIN
  -- Add sent_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='messages' AND column_name='sent_at'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN sent_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add external_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='messages' AND column_name='external_id'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN external_id TEXT;
  END IF;

  -- Add error
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='messages' AND column_name='error'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN error TEXT;
  END IF;

  -- Add attempts
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='messages' AND column_name='attempts'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN attempts INTEGER DEFAULT 0;
  END IF;

  -- Set default status to queued (assumes enum value 'queued' exists)
  BEGIN
    ALTER TABLE public.messages ALTER COLUMN status SET DEFAULT 'queued'::public.message_status;
  EXCEPTION WHEN undefined_function OR undefined_object THEN
    -- If the enum or column doesn't exist, skip setting default for now
    RAISE NOTICE 'Could not set default for messages.status yet (missing enum/column)';
  END;

  -- Update old rows: mark email messages as queued if they were marked 'sent' but have no sent_at
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='messages' AND column_name='sent_at'
  ) THEN
    BEGIN
      UPDATE public.messages
      SET status = 'queued'
      WHERE message_type = 'email' AND status = 'sent' AND sent_at IS NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Skipping update of legacy messages: %', SQLERRM;
    END;
  END IF;
END$$;
