## UserManagement & Dialog Errors Fix Progress

### ✅ Step 1: Create TODO (done)
### ⏳ Step 2: Execute Supabase RLS fix
**Copy-paste to Supabase Dashboard → SQL Editor:**
```sql
-- From supabase/fix-user-management-rls.sql
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON public.profiles;

CREATE POLICY "profiles_select_admin_all_others_limited" 
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id  
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role)  
  OR (role = 'student'::public.user_role AND parent_id = auth.uid())  
);
```
**Verify:** `SELECT * FROM profiles ORDER BY created_at DESC LIMIT 5;` (should show all if admin)

### ✅ Step 3: Code edits (dialog.tsx forwardRef + UserManagement a11y done)
### ✅ Step 4: Restart `npm run dev` → React warnings fixed
### ⏳ Step 2: Run Supabase RLS SQL (priority)
### ⏳ Step 5: Rate limit + useUsers email join
### ⏳ Step 6: Complete

### ⏳ Step 5: Complete

*Next: Run SQL above in Supabase, then reply "SQL done" for code edits.*

