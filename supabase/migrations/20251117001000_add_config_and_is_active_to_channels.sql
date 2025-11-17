-- Add config (jsonb) and is_active to channels table
ALTER TABLE IF EXISTS public.channels
  ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Optional: ensure indexes for querying by type or name
CREATE INDEX IF NOT EXISTS idx_channels_type ON public.channels (type);
CREATE INDEX IF NOT EXISTS idx_channels_name ON public.channels (name);
