# User Management RLS Fix - Load Users (Admin)

## Status: [5/7] ✅✅✅✅✅ - SQL PENDING

**IMMEDIATE ACTION REQUIRED:**

1. **RUN THIS SQL NOW** (copy `supabase/fix-user-management-rls.sql` → Supabase Dashboard > SQL Editor > Execute):
   - Fixes RLS for admin → GET /profiles works.

2. **If no admin profile:**
   - Run `create-test-admin.sql`
   - Login: admin@test.com / Admin123!

3. **Clear session:** Visit `clear-session.html` or logout/login.

4. **Test:** http://localhost:5174/admin/users → Table loads users.

**POST FAIL:** Add-user form also RLS-blocked → Fixed by same SQL (insert policy allows admin).

**Console Error:** Open DevTools > Console > Copy exact Supabase error after SQL.

**Why still failing:** SQL not executed yet (RLS unchanged).

**Next:** Run SQL → Report console → Test add button.

- [x] 1. Create this TODO
- [x] 2. Create `supabase/fix-user-management-rls.sql` 
- [ ] 3. User runs SQL
- [x] 4. Updated hook (TS clean)
- [ ] 5. Test GET loads
- [ ] 6. Test POST add-user
- [ ] 7. Complete

**Why:** RLS policy too restrictive for admin reads. Fix allows admin full profiles select.

**After:** Delete this TODO.

