-- Criar conta de teste admin@gmail.com
-- IMPORTANTE: Apenas para desenvolvimento/teste

-- Inserir usuário no auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@gmail.com',
  crypt('admin', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Admin"}'::jsonb,
  'authenticated',
  'authenticated',
  NOW(),
  NOW(),
  '',
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@gmail.com'
);

-- Criar perfil admin
INSERT INTO public.profiles (id, email, full_name, role, is_active)
SELECT 
  u.id,
  'admin@gmail.com',
  'Admin',
  'admin'::user_role,
  true
FROM auth.users u
WHERE u.email = 'admin@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin'::user_role, full_name = 'Admin';