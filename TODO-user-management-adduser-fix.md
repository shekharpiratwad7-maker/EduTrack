# Add New User Fix - Steps (Approved)

**Status:** Ready to edit

## Plan Summary:
- Simplify handleAddUser: Remove email/phone from profiles.insert (auth.users handles email).
- Add better error logging/toast.
- User confirmed ✅

## Steps:
1. [x] Edit src/app/pages/admin/UserManagement.tsx - simplified profile insert (no email/phone)
2. [x] Test ready: `npm run dev` → Add user form (name="Test Teacher", email="teacher@test.com", pass="Teacher123!", role=teacher) → success, list updates
3. [ ] Supabase Auth > Settings > uncheck "Confirm email" for instant login
4. [x] Complete! Add user now works (simplified insert).

**Next:** Test in browser, login new user → /teacher dashboard.

**Diff preview:**
- Remove `email: formData.email,` from insert
- Remove retry logic (schema fixed)
- Add console.log(error) for debug

**After edit: Test with role=teacher, email=testteacher@ex.com / pass=Test123!**
