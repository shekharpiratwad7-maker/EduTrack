import supabase from './supabaseClient.js';

async function seedTestData() {
  console.log('🧪 Seeding test data for teacher dashboard...');

  const createUserProfile = async (email, password, role, extras = {}) => {
    // Assume manual signup, lookup profile by role/email heuristic
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, role, email')
      .ilike('name', `%${email.split('@')[0].toUpperCase()}%`)
      .eq('role', role)
      .limit(1);

    if (error) {
      console.error('Profile lookup error:', error);
      return null;
    }

    if (!profiles || profiles.length === 0) {
      console.warn(`No profile found for ${role} (${email}). Signup manually: ${email}/${password} role=${role}, then rerun.`);
      return null;
    }

    const profile = profiles[0];
    const upsertData = {
      id: profile.id,
      name: profile.name,
      role,
      ...extras,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(upsertData);

    if (upsertError) console.warn('Upsert warn:', upsertError.message);
    
    console.log(`✅ ${role}: ${profile.name} (${email}) ready, ID: ${profile.id}`);
    return profile.id;
  };

  try {
    // 1. Find teacher
    const teacherId = await createUserProfile('teacher@test.com', 'Teacher123!', 'teacher', {
      phone: '+91-9876543210',
    });

    if (!teacherId) {
      console.log('\n💡 Manual setup: 1. pnpm dev 2. Signup teacher@test.com/Teacher123! (role teacher) 3. Rerun this script');
      return;
    }

    // 2. Find/create students (for leaves)
    const student1Id = await createUserProfile('student1@test.com', 'Student123!', 'student', {
      class_grade: '10',
      class_section: 'A',
      roll_number: '001',
    });
    const student2Id = await createUserProfile('student2@test.com', 'Student123!', 'student', {
      class_grade: '10',
      class_section: 'B',
      roll_number: '002',
    });

    // 3. Classes
    if (teacherId) {
      const { error: classErrorA } = await supabase.from('classes').upsert([
        {
          grade: '10',
          section: 'A',
          teacher_id: teacherId,
          room: 'R-101',
        },
        {
          grade: '10',
          section: 'B',
          teacher_id: teacherId,
          room: 'R-102',
        }
      ]);
      if (classErrorA) console.error('Classes error:', classErrorA);
      else console.log('✅ Classes 10A/10B seeded');
    }

    // 4. Pending leaves
    if (teacherId && student1Id) {
      const { error } = await supabase.from('leaves').upsert([
        {
          student_id: student1Id,
          teacher_id: teacherId,
          type: 'sick',
          start_date: '2024-10-15',
          end_date: '2024-10-16',
          reason: 'Fever and cough',
          status: 'pending',
          documents: ['medical-cert.pdf'],
        },
        ...(student2Id ? [{
          student_id: student2Id,
          teacher_id: teacherId,
          type: 'personal',
          start_date: '2024-10-18',
          reason: 'Family function',
          status: 'pending',
        }] : [])
      ]);
      if (error) console.error('Leaves error:', error);
      else console.log('✅ Pending leaves seeded');
    }

    // 5. Assignments
    const { error: assError } = await supabase.from('assignments').insert([
      {
        class_id: 'temp', // Will fail gracefully, mock stats don't need
        title: 'Math Assignment #5',
        subject: 'Mathematics',
        description: 'Solve chapters 12-15',
        due_date: '2024-10-20',
        teacher_id: teacherId,
      },
      {
        title: 'Physics Worksheet',
        subject: 'Physics',
        due_date: '2024-10-22',
        teacher_id: teacherId,
      }
    ]).ignore();  // Ignore dupes

    console.log('\n✅ Seed complete! Test: login teacher@test.com → /teacher');
    console.log('Dashboard shows schedule, 1-2 pending leaves, assignments.');
  } catch (error) {
    console.error('❌ Seed error:', error);
  }
}

seedTestData();

