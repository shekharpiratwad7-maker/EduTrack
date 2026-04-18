# Backend Setup (Supabase)

1. Open your Supabase project dashboard.
2. Go to SQL Editor and run `supabase/schema.sql`.
3. In Auth settings:
   - Enable email/password provider.
   - Keep "Confirm email" ON for production, OFF for quick local testing.
4. In your app `.env` ensure:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Restart Vite dev server after env changes.

## Expected End-to-End Flow

- Signup creates auth user and profile metadata.
- Profile row is inserted/upserted in `profiles`.
- Signin reads profile and redirects by role:
  - `/admin`
  - `/teacher`
  - `/student`
  - `/parent`
- Student leave application writes to `leave_applications`.
- Teacher/admin can read and update leave status via RLS policies.

## Notes

- If signup says "email already registered", use signin.
- If signup says email rate limit, wait 60-120s and retry.
- If login fails with invalid credentials, verify email first (if confirmation enabled).
