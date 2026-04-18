const supabase = require('@supabase/supabase-js').createClient(
  'https://awvorymvzuworimeknmv.supabase.co',
  'sb_publishable_3SAoYn6ty7ZDFmiSewdQlQ_TB1dBfFI'
);

async function seedTeacherData() {
  console.log('Seeding teacher data (classes/leaves/assignments)...');

  // Get logged in admin or create teacher profile
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.log('No session. Login as admin first or create teacher user.');
    return;
  }

  const teacherId = 'CREATE_TEACHER_ID_HERE'; // Replace with actual teacher profile.id after signup

  // Insert classes
  await supabase.from('classes').insert([
    { grade: '10', section: 'A', teacher_id: teacherId, room: 'R-101' },
    { grade: '10', section: 'B', teacher_id: teacherId, room: 'R-102' }
  ]);

  // Insert leaves
  const studentIds = ['student1', 'student2']; // Assume student profiles
  await supabase.from('leave_applications').insert([
    {
      student_id: studentIds[0],
      teacher_id: teacherId,
      type: 'sick',
      start_date: '2024-10-15',
      end_date: '2024-10-16',
      reason: 'Fever',
      status: 'pending',
      documents: ['medical.pdf']
    }
  ]);

  // Insert assignments
  const classIds = []; // From classes above
  await supabase.from('assignments').insert([
    { class_id: classIds[0], title: 'Math Assignment', subject: 'Math', due_date: '2024-10-20', teacher_id: teacherId }
  ]);

  console.log('✅ Data seeded!');
}

seedTeacherData().catch(console.error);
