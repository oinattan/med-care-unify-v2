-- Criar conta de teste teste@admin.com
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
  'teste@admin.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Teste Admin"}'::jsonb,
  'authenticated',
  'authenticated',
  NOW(),
  NOW(),
  '',
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'teste@admin.com'
);

-- Criar perfil admin
INSERT INTO public.profiles (id, email, full_name, role, is_active)
SELECT 
  u.id,
  'teste@admin.com',
  'Teste Admin',
  'admin'::user_role,
  true
FROM auth.users u
WHERE u.email = 'teste@admin.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin'::user_role, full_name = 'Teste Admin';