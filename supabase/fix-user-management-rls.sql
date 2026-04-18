-- 🔥 Fix UserManagement: Allow Admin Full Profiles Read
-- Run in Supabase Dashboard → SQL Editor
-- Project: awvorymvzuworimeknmv (from error URL)

-- Drop restrictive policy
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON public.profiles;

-- New policy: Self OR admin sees ALL OR student+parent
CREATE POLICY "profiles_select_admin_all_others_limited" 
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id  -- Own profile
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role)  -- Admin sees all
  OR (role = 'student'::public.user_role AND parent_id = auth.uid())  -- Parents see kids
);

-- Verify (should return all profiles if admin logged in)
-- SELECT * FROM profiles ORDER BY created_at DESC LIMIT 5;

-- Optional: Fix/seed admin profile if missing
-- First check: SELECT id, email, raw_user_meta_data FROM auth.users WHERE email LIKE '%admin%';
-- Then: INSERT INTO profiles (id, name, role) VALUES ('ADMIN_UUID_FROM_ABOVE', 'Admin User', 'admin') ON CONFLICT DO UPDATE SET role='admin';

-- Test: Login admin → visit /admin/users (should load)

