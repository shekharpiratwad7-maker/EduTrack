-- 🔥 FIX: Add missing created_at column to profiles table (400 Error Solution)
-- Run this in Supabase Dashboard → SQL Editor: https://supabase.com/dashboard/project/_/sql

-- 1. ADD COLUMN if missing (safe - IF NOT EXISTS)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 2. Backfill created_at for existing profiles using auth.users.created_at
UPDATE public.profiles p
SET created_at = au.created_at
FROM auth.users au
WHERE p.id = au.id
  AND p.created_at IS NULL;

-- 3. Add index for faster sorting (performance)
CREATE INDEX IF NOT EXISTS idx_profiles_created_at 
ON public.profiles(created_at DESC);

-- 4. VERIFY THE FIX (should return results)
SELECT id, name, role, created_at 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- ✅ SUCCESS: No more 400 error on /profiles?order=created_at.desc
-- Test: Navigate to Admin → UserManagement in your app
