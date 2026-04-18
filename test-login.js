import supabase from './supabase-test/supabaseClient.js';

async function testLogin(email, password) {
  console.log(`Testing login: ${email}`);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Login error:', error.message);
    if (error.status) console.error('Status:', error.status);
    if (error.data) console.error('Data:', JSON.stringify(error.data));
  } else {
    console.log('✅ Login success, user ID:', data.user.id);
  }
}

testLogin('teacher@test.com', 'Teacher123!');
testLogin('admin@test.com', 'Admin123!');
testLogin('teacher@school.edu', 'Teacher123!');

