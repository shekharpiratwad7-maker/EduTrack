import supabase from './supabaseClient.js';

async function seedParentChildData() {
  console.log('👨‍👩‍👧 Seeding complete parent-child data with grades/attendance...');

  const PARENT_EMAIL = 'parent@test.com';
  
  // 1. Upsert parent profile
  const { data: parentData, error: parentError } = await supabase
    .from('profiles')
    .upsert({ id: (await supabase.auth.admin.getUserByEmail(PARENT_EMAIL)).data.user.id, name: 'Test Parent', role: 'parent', email: PARENT_EMAIL })
    .select()
    .single();

  if (parentError) {
    console.error('❌ Parent upsert failed:', parentError);
    return;
  }

  const parentId = parentData.id;
  console.log(`✅ Parent ready: ${parentId.slice(-6)}`);

  // 2. Create 2 children
  const children = await Promise.all([
    createStudent('Aarav Patel', '10', 'A', '101', parentId),
    createStudent('Diya Sharma', '9', 'B', '205', parentId)
  ]);

  // 3. Add sample data for Aarav (child[0])
  await addSampleData(children[0].id);

  console.log('🎉 Complete! Login parent@test.com/Parent123! → /parent/dashboard');
  console.log('Children:');
  children.forEach(c => console.log(`  👦 ${c.name} (${c.email})`));
}

async function createStudent(name, grade, section, roll, parentId) {
  const email = name.toLowerCase().replace(/\\s/g, '') + '@student.com';
  const password = 'Student123!';

  // Create auth user
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userError) {
    console.error(`❌ Failed to create ${name}:`, userError);
    return null;
  }

  const studentId = userData.user.id;

  // Create profile
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: studentId,
    name,
    role: 'student',
    parent_id: parentId,
    class_grade: grade,
    class_section: section,
    roll_number: roll,
  });

  if (profileError) console.error(`⚠️ Profile upsert warning for ${name}:`, profileError);

  console.log(`✅ Student ${name} (ID:${studentId.slice(-6)}) | Login: ${email}/${password}`);
  return { id: studentId, name, email };
}

async function addSampleData(studentId) {
  console.log(`📊 Adding sample data for student ${studentId.slice(-6)}...`);

  // Sample attendance (5 days)
  const attendanceDates = ['2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18', '2024-01-19'];
  for (const date of attendanceDates) {
    await supabase.from('attendance').insert({
      student_id: studentId,
      date,
      status: Math.random() > 0.2 ? 'present' : 'absent'
    });
  }

  // Sample grades
  await supabase.from('grades').insert([
    { student_id: studentId, subject: 'Math', exam_type: 'Unit Test 1', score: 85, max_score: 100, grade: 'A' },
    { student_id: studentId, subject: 'Science', exam_type: 'Unit Test 1', score: 92, max_score: 100, grade: 'A+' },
    { student_id: studentId, subject: 'English', exam_type: 'Unit Test 1', score: 78, max_score: 100, grade: 'B+' },
  ]);

  console.log('✅ Sample attendance + grades added');
}

seedParentChildData().catch(console.error);

