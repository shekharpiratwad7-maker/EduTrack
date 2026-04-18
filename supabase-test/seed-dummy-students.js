import supabase from './supabaseClient.js';

const PASSWORD = 'Student123!';
const CLASS_GROUPS = [
  { grade: '10', section: 'A' },
  { grade: '10', section: 'B' },
  { grade: '11', section: 'A' },
  { grade: '11', section: 'B' },
  { grade: '12', section: 'A' },
  { grade: '12', section: 'B' },
];

async function ensureClassExists(grade, section) {
  const { data, error } = await supabase
    .from('classes')
    .select('id')
    .eq('grade', grade)
    .eq('section', section)
    .maybeSingle();

  if (error) {
    console.warn(`Class lookup failed for ${grade}-${section}:`, error.message);
    return null;
  }
  if (data?.id) return data.id;

  const { data: inserted, error: insertError } = await supabase
    .from('classes')
    .insert({ grade, section, room: `R-${grade}${section}` })
    .select('id')
    .maybeSingle();

  if (insertError) {
    console.warn(`Class create failed for ${grade}-${section}:`, insertError.message);
    return null;
  }
  return inserted?.id || null;
}

async function createOrUpdateStudent({ grade, section, index }) {
  const roll = String(index).padStart(3, '0');
  const email = `student${grade}${section}${roll}@test.com`.toLowerCase();
  const name = `Student ${grade}${section}-${roll}`;

  const { data: authSignUp, error: signUpError } = await supabase.auth.signUp({
    email,
    password: PASSWORD,
    options: {
      data: {
        role: 'student',
        name,
        class_grade: grade,
        class_section: section,
        roll_number: roll,
      },
    },
  });

  let user = authSignUp?.user || null;
  if (!user && signUpError) {
    const { data: loginData } = await supabase.auth.signInWithPassword({ email, password: PASSWORD });
    user = loginData?.user || null;
  }

  if (!user) {
    console.warn(`Skipping ${email}: unable to create/login auth user`);
    return false;
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        name,
        role: 'student',
        class_grade: grade,
        class_section: section,
        roll_number: roll,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (profileError) {
    console.warn(`Profile upsert failed for ${email}:`, profileError.message);
    return false;
  }

  await supabase.auth.signOut();
  return true;
}

async function seed() {
  console.log('Seeding 10 dummy students per class...');

  for (const cls of CLASS_GROUPS) {
    await ensureClassExists(cls.grade, cls.section);
    let created = 0;
    for (let i = 1; i <= 10; i++) {
      const ok = await createOrUpdateStudent({ grade: cls.grade, section: cls.section, index: i });
      if (ok) created += 1;
    }
    console.log(`${cls.grade}-${cls.section}: ${created}/10 ready`);
  }

  console.log('Done.');
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});

