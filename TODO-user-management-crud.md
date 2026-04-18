# User Management CRUD Fix & Implementation
Current Status: [ ] 0/12

## Breakdown of Approved Plan

### 1. DB Schema & RLS Fixes (Priority - Fix 400 Error)
- [ ] Run `supabase/fix-profiles-created-at.sql`
- [ ] Run `supabase/add-email-to-profiles.sql`
- [ ] Run `supabase/fix-user-management-rls.sql`
- [ ] Test: Admin login → Users page loads without 400

### 2. Fix Dialog Accessibility Warning
- [x] Updated `src/app/components/ui/dialog.tsx` (props/structure fix, test warning gone)

### 3. Enhance useUsers Hook for Full CRUD
- [x] `src/hooks/data/useUsers.ts`: Added createUser/updateUser/deleteUser + fixed select() ✅

### 4. Update UserManagement Component
- [x] `src/app/pages/admin/UserManagement.tsx`: Full CRUD UI (add/edit/delete), types fixed ✅

### 5. Testing
- [ ] Create user (admin/teacher/student/parent)
- [ ] Edit name/role
- [ ] Delete user
- [ ] Verify tables in Supabase dashboard

### 6. Completion
- [ ] Update this TODO status
- [ ] attempt_completion

Next step after approval: Execute DB fixes guide or code changes?

