
import { createClient } from '@supabase/supabase-client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedAssignments() {
  console.log('Seeding sample assignments...');

  // 1. Get a teacher and their class
  const { data: teacherClasses, error: classError } = await supabase
    .from('classes')
    .select('id, teacher_id, grade, section')
    .not('teacher_id', 'is', null)
    .limit(1);

  if (classError || !teacherClasses || teacherClasses.length === 0) {
    console.error('No classes with assigned teachers found. Please assign a teacher to a class first.');
    return;
  }

  const { id: classId, teacher_id: teacherId, grade, section } = teacherClasses[0];
  console.log(`Found class ${grade}-${section} with teacher ID: ${teacherId}`);

  const sampleAssignments = [
    {
      class_id: classId,
      teacher_id: teacherId,
      title: 'Mathematics: Introduction to Calculus',
      subject: 'Mathematics',
      description: 'Complete the exercises on page 45-50 of the textbook. Focus on limits and continuity.',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    },
    {
      class_id: classId,
      teacher_id: teacherId,
      title: 'Physics: Newton\'s Laws Project',
      subject: 'Physics',
      description: 'Prepare a presentation or a model demonstrating Newton\'s second law of motion.',
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
    },
    {
      class_id: classId,
      teacher_id: teacherId,
      title: 'English: Essay on "The Great Gatsby"',
      subject: 'English',
      description: 'Write a 1000-word essay analyzing the theme of the American Dream in the novel.',
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
    }
  ];

  const { error: insertError } = await supabase
    .from('assignments')
    .insert(sampleAssignments);

  if (insertError) {
    console.error('Error inserting assignments:', insertError.message);
  } else {
    console.log('Successfully added 3 sample assignments!');
  }
}

seedAssignments();
