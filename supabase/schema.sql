-- EduTrack end-to-end backend schema for Supabase
-- Run in Supabase SQL editor for your project.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'teacher', 'student', 'parent');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role public.user_role not null,
  email text unique,
  phone text,
  dob date,
  city text,
  class_grade text,
  class_section text,
  roll_number text,
  parent_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  grade text not null,
  section text not null,
  teacher_id uuid references public.profiles(id) on delete set null,
  room text,
  created_at timestamptz not null default now()
);

create table if not exists public.leave_applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  type text,
  start_date date not null,
  end_date date not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  documents text[] not null default '{}',
  teacher_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  subject text not null,
  description text,
  due_date date not null,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  date date not null,
  subject text,
  status text not null default 'present' check (status in ('present', 'absent', 'late')),
  created_at timestamptz not null default now()
);

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  subject text not null,
  exam_type text not null,
  score numeric,
  max_score numeric,
  grade text,
  teacher_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  subject text,
  category text,
  message text not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_leave_updated_at on public.leave_applications;
create trigger trg_leave_updated_at
before update on public.leave_applications
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.leave_applications enable row level security;
alter table public.assignments enable row level security;
alter table public.notifications enable row level security;
alter table public.attendance enable row level security;
alter table public.grades enable row level security;
alter table public.feedback enable row level security;

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
on public.profiles
for select
using (
  auth.uid() = id
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
  or (
    role = 'student'
    and parent_id = auth.uid()
  )
);

drop policy if exists "profiles_insert_self_or_admin" on public.profiles;
create policy "profiles_insert_self_or_admin"
on public.profiles
for insert
with check (
  auth.uid() = id
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles
for update
using (
  auth.uid() = id
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  auth.uid() = id
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "classes_read_all_authenticated" on public.classes;
create policy "classes_read_all_authenticated"
on public.classes
for select
using (auth.uid() is not null);

drop policy if exists "classes_manage_admin_or_teacher" on public.classes;
create policy "classes_manage_admin_or_teacher"
on public.classes
for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'teacher')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'teacher')
  )
);

drop policy if exists "leave_read_own_scope" on public.leave_applications;
create policy "leave_read_own_scope"
on public.leave_applications
for select
using (
  student_id = auth.uid()
  or teacher_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  or exists (
    select 1
    from public.profiles s
    where s.id = leave_applications.student_id and s.parent_id = auth.uid()
  )
);

drop policy if exists "leave_insert_student_or_admin" on public.leave_applications;
create policy "leave_insert_student_or_admin"
on public.leave_applications
for insert
with check (
  student_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "leave_update_teacher_or_admin" on public.leave_applications;
create policy "leave_update_teacher_or_admin"
on public.leave_applications
for update
using (
  teacher_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "assignments_read_authenticated" on public.assignments;
create policy "assignments_read_authenticated"
on public.assignments
for select
using (auth.uid() is not null);

drop policy if exists "assignments_manage_teacher_or_admin" on public.assignments;
create policy "assignments_manage_teacher_or_admin"
on public.assignments
for all
using (
  teacher_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  teacher_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "notifications_read_own" on public.notifications;
create policy "notifications_read_own"
on public.notifications
for select
using (recipient_id = auth.uid());

drop policy if exists "notifications_manage_admin" on public.notifications;
create policy "notifications_manage_admin"
on public.notifications
for all
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "attendance_read_own_scope" on public.attendance;
create policy "attendance_read_own_scope"
on public.attendance
for select
using (
  student_id = auth.uid()
  or exists (
    select 1 from public.classes c where c.id = attendance.class_id and c.teacher_id = auth.uid()
  )
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  or exists (
    select 1 from public.profiles s where s.id = attendance.student_id and s.parent_id = auth.uid()
  )
);

drop policy if exists "attendance_manage_teacher_or_admin" on public.attendance;
create policy "attendance_manage_teacher_or_admin"
on public.attendance
for all
using (
  exists (
    select 1 from public.classes c where c.id = attendance.class_id and c.teacher_id = auth.uid()
  )
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  exists (
    select 1 from public.classes c where c.id = attendance.class_id and c.teacher_id = auth.uid()
  )
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "grades_read_own_scope" on public.grades;
drop policy if exists "grades_read_all_roles" on public.grades;
create policy "grades_read_all_roles"
on public.grades
for select
using (
  student_id = auth.uid()
  or teacher_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  or exists (
    select 1 from public.profiles s where s.id = grades.student_id and s.parent_id = auth.uid()
  )
);

drop policy if exists "grades_manage_teacher_or_admin" on public.grades;
create policy "grades_manage_teacher_or_admin"
on public.grades
for all
using (
  teacher_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  teacher_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create or replace function public.notify_parent_on_grade_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_user_id uuid;
begin
  select p.parent_id
    into parent_user_id
  from public.profiles p
  where p.id = new.student_id;

  if parent_user_id is not null then
    insert into public.notifications (recipient_id, title, message, type)
    values (
      parent_user_id,
      'Marks Updated',
      format('New marks: %s - %s (%s/%s)', coalesce(new.subject, 'Subject'), coalesce(new.exam_type, 'Exam'), coalesce(new.score::text, '-'), coalesce(new.max_score::text, '-')),
      'grade'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_parent_on_grade_insert on public.grades;
create trigger trg_notify_parent_on_grade_insert
after insert on public.grades
for each row execute function public.notify_parent_on_grade_change();

drop trigger if exists trg_notify_parent_on_grade_update on public.grades;
create trigger trg_notify_parent_on_grade_update
after update of score, max_score, grade, subject, exam_type on public.grades
for each row execute function public.notify_parent_on_grade_change();

drop policy if exists "feedback_read_parent_teacher_admin" on public.feedback;
create policy "feedback_read_parent_teacher_admin"
on public.feedback
for select
using (
  parent_id = auth.uid()
  or teacher_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "feedback_insert_parent" on public.feedback;
create policy "feedback_insert_parent"
on public.feedback
for insert
with check (
  parent_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
