-- Add test data for student email: yemolir756@dwseal.com
-- Run in Supabase SQL Editor

do $$
declare
  v_student_id uuid;
  v_class_id uuid;
begin
  -- 1) Get student user/profile id from auth email
  select u.id
    into v_student_id
  from auth.users u
  where lower(u.email) = 'yemolir756@dwseal.com'
  limit 1;

  if v_student_id is null then
    raise exception 'No auth user found for email yemolir756@dwseal.com';
  end if;

  -- 2) Ensure student profile exists
  insert into public.profiles (id, name, role, class_grade, class_section, roll_number, updated_at)
  values (v_student_id, 'Test Student Yemolir', 'student', '10', 'A', '001', now())
  on conflict (id) do update set
    role = 'student',
    class_grade = coalesce(public.profiles.class_grade, excluded.class_grade),
    class_section = coalesce(public.profiles.class_section, excluded.class_section),
    roll_number = coalesce(public.profiles.roll_number, excluded.roll_number),
    updated_at = now();

  -- 3) Ensure class exists (10-A)
  insert into public.classes (grade, section, room)
  values ('10', 'A', 'R-101')
  on conflict do nothing;

  select c.id
    into v_class_id
  from public.classes c
  where c.grade = '10' and c.section = 'A'
  order by c.created_at asc
  limit 1;

  -- 4) Seed attendance (last few days)
  insert into public.attendance (student_id, class_id, date, subject, status)
  values
    (v_student_id, v_class_id, current_date - 4, 'Mathematics', 'present'),
    (v_student_id, v_class_id, current_date - 3, 'Physics', 'present'),
    (v_student_id, v_class_id, current_date - 2, 'Chemistry', 'absent'),
    (v_student_id, v_class_id, current_date - 1, 'English', 'late'),
    (v_student_id, v_class_id, current_date, 'Computer Science', 'present')
  on conflict do nothing;

  -- 5) Seed grades
  insert into public.grades (student_id, class_id, subject, exam_type, score, max_score, grade)
  values
    (v_student_id, v_class_id, 'Mathematics', 'Class Test', 88, 100, 'A'),
    (v_student_id, v_class_id, 'Physics', 'Class Test', 76, 100, 'B+'),
    (v_student_id, v_class_id, 'Chemistry', 'Quiz', 18, 20, 'A+'),
    (v_student_id, v_class_id, 'English', 'Assignment', 91, 100, 'A+')
  on conflict do nothing;

  -- 6) Seed one leave application (if table exists)
  begin
    insert into public.leave_applications (student_id, type, start_date, end_date, reason, status, documents)
    values (
      v_student_id,
      'medical',
      current_date + 1,
      current_date + 2,
      'Fever and doctor advised rest',
      'pending',
      '{}'
    );
  exception when undefined_table then
    -- Legacy schema may use public.leaves table instead
    begin
      insert into public.leaves (student_id, type, start_date, end_date, reason, status, documents)
      values (
        v_student_id,
        'medical',
        current_date + 1,
        current_date + 2,
        'Fever and doctor advised rest',
        'pending',
        '{}'
      );
    exception when undefined_table then
      raise notice 'Neither leave_applications nor leaves table exists, skipping leave seed.';
    end;
  end;

  raise notice 'Test data seeded for yemolir756@dwseal.com (student_id=%).', v_student_id;
end $$;

