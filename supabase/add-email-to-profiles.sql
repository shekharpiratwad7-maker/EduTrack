-- 🔥 Add email to profiles & backfill (Fix useUsers.ts 400 error)
-- Run in Supabase Dashboard → SQL Editor: https://supabase.com/dashboard/project/awvorymvzuworimeknmv/sql

BEGIN;

-- 1. Add email column (safe if exists)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill emails from auth.users (idempotent)
UPDATE public.profiles p 
SET email = u.email 
FROM auth.users u 
WHERE p.id = u.id 
  AND (p.email IS NULL OR p.email != u.email);

-- 3. Verify
-- SELECT id, name, role, email FROM profiles ORDER BY created_at DESC LIMIT 10;

COMMIT;

-- Test query (should work now):
-- SELECT *, email FROM profiles ORDER BY created_at DESC LIMIT 5;

