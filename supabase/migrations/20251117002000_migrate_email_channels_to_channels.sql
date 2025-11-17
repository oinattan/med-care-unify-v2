-- Migrate existing email_channels rows into channels table
-- This migration copies SMTP fields into channels.config JSONB

INSERT INTO public.channels (id, name, type, config, is_active, created_at, updated_at)
SELECT
  ec.id,
  ec.name,
  'email' as type,
  jsonb_build_object(
    'smtp_host', ec.smtp_host,
    'smtp_port', ec.smtp_port,
    'smtp_username', ec.smtp_username,
    'smtp_password', ec.smtp_password,
    'from_email', ec.email,
    'use_tls', ec.use_tls
  ) as config,
  COALESCE(ec.is_active, true) as is_active,
  ec.created_at,
  ec.updated_at
FROM public.email_channels ec
ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    config = EXCLUDED.config,
    is_active = EXCLUDED.is_active,
    updated_at = EXCLUDED.updated_at;

-- Note: This keeps existing email_channels table intact. After verifying data, you may drop or archive the legacy table.
