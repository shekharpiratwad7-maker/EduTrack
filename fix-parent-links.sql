-- 🔥 Fix Parent-Child Links (NULL parent_id issue)
-- Run in Supabase SQL Editor if students have NULL parent_id

-- Check current status
SELECT role, count(*) FROM profiles GROUP BY role;

-- Fix: Link all students to first parent
UPDATE profiles
SET parent_id = (
  SELECT id FROM profiles WHERE role = 'parent' LIMIT 1
)
WHERE role = 'student' AND parent_id IS NULL;

-- Verify
SELECT p.name as student, par.name as parent 
FROM profiles p 
JOIN profiles par ON p.parent_id = par.id 
WHERE p.role = 'student';

