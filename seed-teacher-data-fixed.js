import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://awvorymvzuworimeknmv.supabase.co';
const supabaseKey = 'sb_publishable_3SAoYn6ty7ZDFmiSewdQlQ_TB1dBfFI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedTeacherData() {
  console.log('🌱 Seeding teacher/student data + classes/leaves...');

  // 1. Create teacher user/profile if missing
  const teacherEmail = 'teacher@test.com';
  const teacherPassword = 'Teacher123!';
  let { data: teacherAuth, error: teacherError } = await supabase.auth.signUp({
    email: teacherEmail,
    password: teacherPassword,
  });

  if (teacherError && !teacherError.message.includes('already')) {
    console.error('Teacher signup error:', teacherError.message);
    return;
  }

  let teacherId = teacherAuth?.user?.id;
  if (!teacherId) {
    // Login if exists
    ({ data: teacherAuth } = await supabase.auth.signInWithPassword({ email: teacherEmail, password: teacherPassword }));
    teacherId = teacherAuth.user?.id;
  }

  if (!teacherId) {
    console.error('No teacher ID');
    return;
  }

  // Upsert teacher profile
  await supabase.from('profiles').upsert({
    id: teacherId,
    name: 'Test Teacher',
    role: 'teacher',
    phone: '+91-9876543210',
    updated_at: new Date().toISOString(),
  });
  console.log('✅ Teacher ready, ID:', teacherId);

  // 2. Create students
    const studentEmails = ['student1@school.edu', 'student2@school.edu'];
  const studentIds = [];
  for (let i = 0; i < studentEmails.length; i++) {
    const email = studentEmails[i];
    const pass = 'Student123!';
    let { data: stuAuth } = await supabase.auth.signUp({ email, password: pass });
    let stuId = stuAuth?.user?.id;

    if (!stuId) {
      ({ data: stuAuth } = await supabase.auth.signInWithPassword({ email, password: pass }));
      stuId = stuAuth.user?.id;
    }

    if (stuId) {
      await supabase.from('profiles').upsert({
        id: stuId,
        name: `Student ${i+1}`,
        role: 'student',
        class_grade: '10',
        class_section: i === 0 ? 'A' : 'B',
        roll_number: `00${i+1}`,
        updated_at: new Date().toISOString(),
      });
      studentIds.push(stuId);
      console.log(`✅ Student${i+1} ready, ID:`, stuId);
    }
  }

  // 3. Classes
  await supabase.from('classes').upsert([
    { grade: '10', section: 'A', teacher_id: teacherId, room: 'R-101' },
    { grade: '10', section: 'B', teacher_id: teacherId, room: 'R-102' },
  ]);
  console.log('✅ Classes seeded');

  // 4. Pending leaves
  await supabase.from('leave_applications').upsert([
    {
      student_id: studentIds[0],
      teacher_id: teacherId,
      reason: 'Fever',
      status: 'pending',
      start_date: '2024-10-15',
      end_date: '2024-10-16',
    },
    {
      student_id: studentIds[1],
      teacher_id: teacherId,
      reason: 'Family event',
      status: 'pending',
      start_date: '2024-10-18',
      end_date: '2024-10-18',
    },
  ]);
  console.log('✅ Leaves seeded');

  // Sign out
  await supabase.auth.signOut();
  console.log('\n🎉 COMPLETE! Login:');
  console.log('- Admin: admin@test.com/Admin123!');
  console.log('- Teacher: teacher@school.edu/Teacher123!');
  console.log('- Student1: student1@test.com/Student123!');
  console.log('Restart `pnpm dev` and test /admin dashboard!');
}

seedTeacherData().catch(console.error);

