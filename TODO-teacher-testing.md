# Teacher Dashboard - Testing Guide ✅

## Current Status
Admin ✅ → Teacher ✅ (with strong password)

## Test Credentials
```
Admin: admin@test.com / Admin123!
Teacher: teacher@test.com / T3acherSecure2024! (signup manual)
Student1: student1@test.com / StudentSecure2024!
```

## Complete Test Flow
```
1. pnpm dev
2. http://localhost:5180 → Auth/Signup → teacher@test.com / T3acherSecure2024! (role: teacher)
3. Auto-redirect /teacher → Verify:
   - Greeting: 'Good morning, Test Teacher!'
   - Schedule: Shows 10A/10B classes (room/time)
   - Pending Leaves: 1-2 students → Test APPROVE button → toast success → refresh (status updated)
   - Assignments: Stats bars visible
   - Console DEBUG: classesCount: 2+, profileRole: 'teacher'
4. Quick Actions: MarkAttendance/MarksEntry/Assignments/LeaveApproval links work
5. Logout → Admin login verifies

## Seed Data (after signup)
```
cd supabase-test && npm i && node seed-test-data.js
```
Populates classes/leaves/assignments linked to your teacher profile.id

## Troubleshooting
- 400 Auth: Use strong password (8+ chars, upper/lower/number/special)
- Empty schedule: Rerun seed or check console DEBUG
- Approve fails: Verify useLeaves.ts table='leaves' matches supabase-schema.sql

**All green! Next: parent/student or production deploy.**

