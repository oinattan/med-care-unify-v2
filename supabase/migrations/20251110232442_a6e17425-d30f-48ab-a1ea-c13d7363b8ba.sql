-- Create email_channels table for SMTP configurations
CREATE TABLE public.email_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_username TEXT NOT NULL,
  smtp_password TEXT NOT NULL,
  use_tls BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_channels ENABLE ROW LEVEL SECURITY;

-- Only managers and admins can manage email channels
CREATE POLICY "Managers can manage email channels"
ON public.email_channels
FOR ALL
USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::user_role, 'admin'::user_role]));

-- Add trigger for updated_at
CREATE TRIGGER update_email_channels_updated_at
BEFORE UPDATE ON public.email_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();