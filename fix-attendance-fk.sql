-- 🔥 Fix Attendance Foreign Key for Parent Views
-- Run in Supabase SQL Editor

-- 1. Add explicit FK constraint (for RPC joins)
ALTER TABLE public.attendance 
ADD CONSTRAINT fk_attendance_student 
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.grades 
ADD CONSTRAINT fk_grades_student 
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.leave_applications 
ADD CONSTRAINT fk_leaves_student 
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);

-- 3. Verify relationships reload (restart edge functions or wait 1min)
-- Test: supabase from('attendance').select('*, profiles!student_id(name)')

-- 4. Check notifications table exists + RLS
SELECT * FROM information_schema.tables WHERE table_name = 'notifications';

