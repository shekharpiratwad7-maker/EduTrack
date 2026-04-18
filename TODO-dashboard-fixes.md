# TODO: Teacher/Parent/Admin Dashboard Fixes
**Status: 0/14 [⬜⬜⬜]**

## Phase 1: Setup (0/2)
- [x] 1. Create src/hooks/data/useChildren.ts for parent queries
- [ ] 2. Seed test data (teacher/parent/student accounts, classes, leaves)

## Phase 2: Hook Updates (2/2)
- [x] 3. Edit src/hooks/data/useLeaves.ts → add student profile JOIN
- [x] 4. useClasses/useAssignments validated (good)

## Phase 3: Dashboard Edits (1/4)
- [x] 5. src/app/pages/teacher/Dashboard.tsx → fix Tailwind/joins/loading/empty

 - [x] 6. src/app/pages/admin/Dashboard.tsx → aggregates/hooks
- [ ] 7. src/app/pages/parent/Dashboard.tsx → children data/hooks
- [ ] 8. Add consistent Spinner/error UI all dashboards

## Phase 4: Data & Test (0/3)
- [ ] 9. Run supabase-test/index.js → verify data
- [ ] 10. pnpm dev restart, test all roles
- [ ] 11. Check console/network: no errors, data loads

## Phase 5: Polish & Complete (0/3)
- [ ] 12. Update TODO-steps.md progress
- [ ] 13. Handle empty states gracefully
- [ ] 14. attempt_completion ✅

**Next:** Phase 1 → create useChildren.ts

