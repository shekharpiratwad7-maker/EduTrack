import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://awvorymvzuworimeknmv.supabase.co',
  'sb_publishable_3SAoYn6ty7ZDFmiSewdQlQ_TB1dBfFI' // service_role key? Use anon, admin signin first
);

async function resetTeacher() {
  console.log('🧹 Resetting teacher user...');

  // 1. Delete existing teacher profiles/classes
  const { data: teachers } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'teacher');

  if (teachers && teachers.length > 0) {
    await supabase.from('profiles').delete().in('id', teachers.map(t => t.id));
    await supabase.from('classes').delete().eq('teacher_id', teachers[0]?.id);
    console.log('✅ Deleted old teacher data');
  }

  // 2. Manual signup (anon key can't delete auth.users, manual dashboard delete recommended)
  console.log('\n⚠️ MANUAL STEP in Supabase Dashboard:');
  console.log('1. Auth > Users > Delete all teacher@test.com / teacher@school.edu');
  console.log('2. Run: node seed-teacher-data-fixed.js');
  console.log('3. Or signup manually in app: teacher-fixed@test.com / Teacher123! (role teacher)');
  
  // 3. Test login function
  const testEmail = 'teacher@school.edu';
  const { data, error } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: 'Teacher123!'
  });

  if (error) {
    console.error('Test login fail:', error.message);
  } else {
    console.log('✅ Teacher login works, ID:', data.user.id);
    await supabase.auth.signOut();
  }
}

resetTeacher().catch(console.error);
