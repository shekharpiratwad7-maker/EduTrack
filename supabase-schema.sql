-- EduTrack Supabase Schema
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Enable RLS later
BEGIN;

-- Profiles table (extend auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT CHECK (role IN ('admin', 'teacher', 'student', 'parent')) NOT NULL,
  phone TEXT,
  dob DATE,
  city TEXT,
  class_grade TEXT,
  class_section TEXT,
  roll_number TEXT,
  parent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Classes
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grade TEXT NOT NULL,
  section TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  room TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage classes" ON public.classes FOR ALL USING (auth.uid() = teacher_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Attendance
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id),
  date DATE NOT NULL,
  subject TEXT,
  status TEXT CHECK (status IN ('present', 'absent', 'late')) DEFAULT 'present',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students own attendance" ON public.attendance FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Teachers view class" ON public.attendance FOR SELECT USING (EXISTS (SELECT 1 FROM public.classes WHERE id = class_id AND teacher_id = auth.uid()));
CREATE POLICY "Admins all" ON public.attendance FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Grades
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id),
  subject TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  max_score INTEGER DEFAULT 100,
  grade TEXT,
  teacher_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students own grades" ON public.grades FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Teachers manage" ON public.grades FOR ALL USING (teacher_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Leaves
CREATE TABLE IF NOT EXISTS public.leaves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT,
  start_date DATE,
  end_date DATE,
  reason TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  documents TEXT[],
  teacher_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students own leaves" ON public.leaves FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Teachers approve" ON public.leaves FOR ALL USING (teacher_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES public.classes(id),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  teacher_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage" ON public.assignments FOR ALL USING (teacher_id = auth.uid());

-- Notifications (parent)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notifications" ON public.notifications FOR ALL USING (recipient_id = auth.uid());

-- Feedback
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  subject TEXT,
  category TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents create" ON public.feedback FOR INSERT WITH CHECK (parent_id = auth.uid());
CREATE POLICY "Teachers read own" ON public.feedback FOR SELECT USING (teacher_id = auth.uid());

COMMIT;

-- Insert test data after auth setup
-- INSERT INTO public.profiles (id, name, role) VALUES 
-- (auth.uid(), 'Test Admin', 'admin'); -- Run after signup
