-- 🔥 Fix Profiles for Teacher Dashboard Loading Issue
-- Run this in Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/_/sql

-- 1. Check current auth.users (replace with your project ref)
SELECT id, email, created_at FROM auth.users WHERE email LIKE '%teacher%';

-- 2. UPSERT profile for teacher@test.com (90% fix!)
INSERT INTO public.profiles (id, name, role)
SELECT id, 'Test Teacher', 'teacher'
FROM auth.users 
WHERE email = 'teacher@test.com'
ON CONFLICT (id) DO UPDATE SET 
  role = 'teacher',
  name = 'Test Teacher',
  updated_at = NOW();

-- 3. Verify fix
SELECT p.id, p.name, p.role, u.email 
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'teacher';

-- 4. If no classes, seed some (optional)
-- INSERT INTO public.classes (grade, section, teacher_id, room) VALUES 
-- ('10', 'A', (SELECT id FROM profiles WHERE role='teacher'), 'R-101');
