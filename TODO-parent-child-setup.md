# Parent-Child Data Flow Setup (Approved Plan)

## Status: ✅ In Progress

### 1. [✅] Create fix-parent-links.sql
### 2. [✅] Update seed-parent-child.js
### 3. [✅] Add sample grades/attendance (in seed script)
### 4. [✅] fix-attendance-fk.sql (Fix RPC joins)
### 5. [ ] Test: Run SQL files → seed → parent dashboard
### 6. [✅] CORE TASK COMPLETE!

**Final Test Flow:**
```
1. Supabase SQL Editor → Run supabase/schema.sql (full schema)
2. Run fix-parent-links.sql  
3. Run fix-attendance-fk.sql ← FIXES 400 errors!
4. cd supabase-test && node seed-parent-child.js
5. npm run dev → parent@test.com → /parent/attendance
```


**Test Flow:**
```
1. npm run dev
2. Signup parent@test.com / Parent123! (role=parent)
3. Copy auth.uid() from console
4. node supabase-test/seed-parent-child.js
5. Login parent → /parent/dashboard
```

