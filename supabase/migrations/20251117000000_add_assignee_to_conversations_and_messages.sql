-- Add assignee columns to conversations and messages
ALTER TABLE IF EXISTS conversations
  ADD COLUMN IF NOT EXISTS assignee_id uuid NULL,
  ADD COLUMN IF NOT EXISTS assignee_name text NULL;

ALTER TABLE IF EXISTS messages
  ADD COLUMN IF NOT EXISTS assignee_id uuid NULL,
  ADD COLUMN IF NOT EXISTS assignee_name text NULL;
