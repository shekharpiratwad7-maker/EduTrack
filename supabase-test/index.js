import supabase from './supabaseClient.js'

async function createTestAdmin() {
  const email = 'admin@test.com';
  const password = 'Admin123!';
  console.log('Creating test admin user and profile...');

  try {
    // Try signUp to create user if not exists (email confirm should be disabled in Supabase Auth settings)
    let { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    let userId;
    if (signUpError && signUpError.message.includes('already')) {
      // User exists, login instead
      ({ data: authData, error: signUpError } = await supabase.auth.signInWithPassword({ email, password }));
    }

    if (signUpError || !authData.user) {
      console.error('Auth error:', signUpError?.message || 'No user data');
      return;
    }

    userId = authData.user.id;
    console.log('✅ Auth user ready, ID:', userId);

    // Upsert profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        name: 'Admin User',
        role: 'admin',
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Profile upsert error:', profileError.message);
    } else {
      console.log('✅ Profile created/updated');
      console.log(`Test login: ${email} / ${password}`);
      console.log('Dashboard: https://supabase.com/dashboard/project/awvorymvzuworimeknmv/auth/users (check user)');
    }

    // Sign out
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Script error:', error);
  }
}

createTestAdmin();
