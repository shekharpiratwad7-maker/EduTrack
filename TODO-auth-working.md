# Make Auth API Workable - Progress

## Plan Steps:
- [x] 1. Update supabase-test/index.js to use signUp for test admin creation
- [x] 2. Add mock auth fallback in src/contexts/AuthContext.tsx for dev (localStorage 'mockAuth=true')
- [x] 3. Run updated seeding script
- [ ] 4. Restart dev server (npm run dev)
- [ ] 5. Test login:
  - Normal: admin@test.com / Admin123!
  - Mock: Enable localStorage.mockAuth='true', retry login
- [ ] Complete

**Manual Supabase dashboard (recommended long-term):**
- Run supabase-schema.sql
- Disable Auth > Settings > Confirm email
- Run create-test-admin.sql (note UUID)

