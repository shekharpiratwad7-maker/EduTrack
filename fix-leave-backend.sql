-- Fix leave backend schema for student submit + teacher approve
-- Run in Supabase SQL editor for current project

create extension if not exists "pgcrypto";

create table if not exists public.leave_applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  type text,
  start_date date not null,
  end_date date,
  reason text,
  status text not null default 'pending',
  teacher_id uuid references public.profiles(id) on delete set null,
  documents text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add missing columns if old table exists
alter table public.leave_applications add column if not exists student_id uuid references public.profiles(id) on delete cascade;
alter table public.leave_applications add column if not exists type text;
alter table public.leave_applications add column if not exists start_date date;
alter table public.leave_applications add column if not exists end_date date;
alter table public.leave_applications add column if not exists reason text;
alter table public.leave_applications add column if not exists status text default 'pending';
alter table public.leave_applications add column if not exists teacher_id uuid references public.profiles(id) on delete set null;
alter table public.leave_applications add column if not exists documents text[] default '{}';
alter table public.leave_applications add column if not exists created_at timestamptz not null default now();
alter table public.leave_applications add column if not exists updated_at timestamptz not null default now();

-- Normalize required values
update public.leave_applications
set start_date = coalesce(start_date, current_date),
    status = coalesce(status, 'pending');

alter table public.leave_applications alter column student_id set not null;
alter table public.leave_applications alter column start_date set not null;

alter table public.leave_applications enable row level security;

drop policy if exists "leave_read_own_scope" on public.leave_applications;
create policy "leave_read_own_scope"
on public.leave_applications for select
using (
  student_id = auth.uid()
  or teacher_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  or exists (
    select 1 from public.profiles s
    where s.id = leave_applications.student_id and s.parent_id = auth.uid()
  )
);

drop policy if exists "leave_insert_student_or_admin" on public.leave_applications;
create policy "leave_insert_student_or_admin"
on public.leave_applications for insert
with check (
  student_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "leave_update_teacher_or_admin" on public.leave_applications;
create policy "leave_update_teacher_or_admin"
on public.leave_applications for update
using (
  teacher_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

