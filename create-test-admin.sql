-- Run in Supabase Dashboard > SQL Editor

-- Disable email confirm for dev (Dashboard > Auth > Settings > uncheck Confirm email)
-- Then run:

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at) 
VALUES (
  gen_random_uuid(),
  'admin@test.com',
  crypt('Admin123!', gen_salt('bf')),
  NOW(),
  NOW()
) RETURNING id;

-- Note returned UUID as ADMIN_ID

-- Then profiles:
-- replace 'UUID-HERE' with above id
INSERT INTO public.profiles (id, name, role, created_at, updated_at)
VALUES ('UUID-HERE', 'Admin User', 'admin', NOW(), NOW());

-- Test login: admin@test.com / Admin123!
