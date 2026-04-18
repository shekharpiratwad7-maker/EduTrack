-- Fix for User Management (GET and POST API errors)
-- Run this in your Supabase Dashboard -> SQL Editor

-- 1. Add the missing 'email' column to the 'profiles' table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Populate existing profiles with emails from auth.users (optional but recommended)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;
