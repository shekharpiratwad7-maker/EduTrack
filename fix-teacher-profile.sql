-- Fix Teacher Profile for Login/Dashboard
-- Run in Supabase Dashboard > SQL Editor

-- Verify user
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'teacher@school.edu';

-- Upsert profile for teacher@school.edu (ID from test-login)
INSERT INTO public.profiles (id
