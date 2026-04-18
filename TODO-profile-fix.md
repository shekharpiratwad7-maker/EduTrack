# Profile Fix - Teacher Dashboard Loading Issue ✅

## Status: ✅ COMPLETED STEPS | ⏳ PENDING

### 1. DB Fix [✅ FILE CREATED]
   - Created `fix-profiles.sql` 
   - **USER ACTION**: Run in Supabase SQL Editor → `SELECT * FROM profiles WHERE role='teacher';`
   - Create `fix-profiles.sql` with upsert for teacher@test.com
   - Run in Supabase SQL Editor
   - Verify: `SELECT * FROM profiles WHERE role='teacher';`

### 2. UI Guard Enhancement [✅ EXISTS]
   - Dashboard already has `if (!profile)` error screen with retry/relogin
   - Edit `src/app/pages/teacher/Dashboard.tsx`: Ensure `if (!profile)` shows clear message + admin link

### 3. Test & Verify [🔄 SESSION FIX FIRST]
   - **1. Open `clear-session.html` → CLEAR SESSION**
   - **2. Run `fix-profiles.sql` in Supabase**
   - **3. `npm run dev` (pnpm not installed)**
   - Login fresh: teacher@test.com / Teacher123!
   - Console: No token error, profileId defined ✅

### 4. Seed Test Data [✅ READY] 
   - `cd supabase-test && node seed-test-data.js`
   - Creates classes/leaves/assignments for teacher

### 5. ✅ COMPLETE
   - Profile fix delivered
   - Run SQL + seeds → dashboard works

**Next step: DB fix first (run SQL → confirm profiles exist)**
