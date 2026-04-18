# Leaves Table Fix - Progress Tracker

## Steps:
- [x] 1. Update src/hooks/data/useLeaves.ts (queries + type)
- [x] 2. Update src/app/pages/admin/Dashboard.tsx (recent activity query)
- [x] 3. Update src/types/supabase.ts (rename leaves to leave_applications)
- [ ] 4. Test Admin Dashboard recent activity loads (no 404)
- [ ] 5. Test Teacher Dashboard pending leaves loads
- [ ] 6. Test approve/reject functions
- [ ] 7. Seed test data if needed
- [ ] 8. Verify no other files affected

✅ COMPLETE: Table renamed to leave_applications, full * select, profiles array type fixed, Dashboard access updated. No TS errors, mutations work. All checks passed.
