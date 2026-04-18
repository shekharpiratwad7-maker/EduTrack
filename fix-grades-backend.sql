-- Fix grades backend for teacher marks entry
-- Run this in Supabase SQL Editor for project: awvorymvzuworimeknmv

create extension if not exists "pgcrypto";

-- 1) Create grades table if missing
create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  subject text not null,
  exam_type text not null,
  score integer check (score >= 0),
  max_score integer default 100 check (max_score > 0),
  grade text,
  teacher_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 2) Add missing columns if table exists but partial
alter table public.grades add column if not exists class_id uuid references public.classes(id) on delete set null;
alter table public.grades add column if not exists subject text;
alter table public.grades add column if not exists exam_type text;
alter table public.grades add column if not exists score integer;
alter table public.grades add column if not exists max_score integer default 100;
alter table public.grades add column if not exists grade text;
alter table public.grades add column if not exists teacher_id uuid references public.profiles(id) on delete set null;
alter table public.grades add column if not exists created_at timestamptz not null default now();

-- 3) Backfill required text columns if null (avoid insert failures)
update public.grades set subject = coalesce(subject, 'General') where subject is null;
update public.grades set exam_type = coalesce(exam_type, 'Class Test') where exam_type is null;
update public.grades set max_score = coalesce(max_score, 100) where max_score is null or max_score <= 0;

alter table public.grades alter column subject set not null;
alter table public.grades alter column exam_type set not null;
alter table public.grades alter column student_id set not null;

-- 4) Parent link for child marks visibility
alter table public.profiles add column if not exists parent_id uuid references public.profiles(id) on delete set null;

-- 5) Notifications table (for parent alert when marks updated)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- 6) RLS
alter table public.grades enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "grades_read_all_roles" on public.grades;
create policy "grades_read_all_roles"
on public.grades for select
using (
  auth.uid() is not null and (
    student_id = auth.uid()
    or teacher_id = auth.uid()
    or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
    )
    or exists (
      select 1 from public.profiles s where s.id = grades.student_id and s.parent_id = auth.uid()
    )
  )
);

drop policy if exists "grades_manage_teacher_or_admin" on public.grades;
create policy "grades_manage_teacher_or_admin"
on public.grades for all
using (
  auth.uid() is not null and (
    teacher_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
)
with check (
  auth.uid() is not null and (
    teacher_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
);

drop policy if exists "notifications_read_own" on public.notifications;
create policy "notifications_read_own"
on public.notifications for select
using (recipient_id = auth.uid());

drop policy if exists "notifications_insert_teacher_admin" on public.notifications;
create policy "notifications_insert_teacher_admin"
on public.notifications for insert
with check (
  auth.uid() is not null and (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('teacher', 'admin'))
  )
);

-- 7) Parent notification trigger for marks changes
create or replace function public.notify_parent_on_grade_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_user_id uuid;
begin
  select p.parent_id into parent_user_id
  from public.profiles p
  where p.id = new.student_id;

  if parent_user_id is not null then
    insert into public.notifications (recipient_id, title, message, type)
    values (
      parent_user_id,
      'Marks Updated',
      format(
        'New marks: %s - %s (%s/%s)',
        coalesce(new.subject, 'Subject'),
        coalesce(new.exam_type, 'Exam'),
        coalesce(new.score::text, '-'),
        coalesce(new.max_score::text, '-')
      ),
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

