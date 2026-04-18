import supabase from './supabaseClient.js';

async function seedDummyNotifications() {
  console.log('🔔 Seeding dummy notifications for test parent...');

  const PARENT_EMAIL = 'parent@test.com';
  
  try {
    // Sign in as parent to get ID and RLS bypass
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email: PARENT_EMAIL,
      password: 'Parent123!'
    });

    if (signInError) {
      console.log('❌ Parent login failed. Create account:');
      console.log('1. Sign up parent@test.com / Parent123! in app');
      console.log('2. Complete profile (role=parent)');
      console.log('3. Logout, rerun this script');
      return;
    }

    const parentId = sessionData.session.user.id;

    console.log(`✅ Logged in parent ID: ${parentId.slice(-6)}`);

    // Dummy notifications (mix unread/read, types)
    const dummyNotifications = [
      {
        recipient_id: parentId,
        title: "Aarav attendance marked Present",
        message: "Your child Aarav Patel was marked present for Math class on Jan 15.",
        type: 'attendance'
      },
      {
        recipient_id: parentId,
        title: "New grade posted for Diya",
        message: "Diya Sharma received 92/100 in Science Unit Test 1 (A+). Great job!",
        type: 'grade',
        read_at: new Date(Date.now() - 2*24*60*60*1000).toISOString() // read 2 days ago
      },
      {
        recipient_id: parentId,
        title: "School Announcement: Parent-Teacher Meeting",
        message: "PTM scheduled for Jan 25, 4PM. Attendance mandatory.",
        type: 'announcement'
      },
      {
        recipient_id: parentId,
        title: "Leave application approved",
        message: "Aarav's leave for Jan 20-21 has been approved by teacher.",
        type: 'leave',
        read_at: null
      },
      {
        recipient_id: parentId,
        title: "Math assignment due tomorrow",
        message: "Chapter 5 exercises due by 11:59 PM. Submit via portal.",
        type: 'alert'
      },
      {
        recipient_id: parentId,
        title: "Science test rescheduled",
        message: "Unit Test 2 moved to Jan 22 due to holiday.",
        type: 'announcement',
        read_at: new Date().toISOString()
      },
      {
        recipient_id: parentId,
        title: "Fee payment due",
        message: "School fee for Q1 due in 3 days. Pay online portal.",
        type: 'alert'
      },
      {
        recipient_id: parentId,
        title: "Sports day tomorrow",
        message: "Annual sports day at 8AM. Participation optional.",
        type: 'alert'
      }
    ];

    const { error } = await supabase
      .from('notifications')
      .insert(dummyNotifications);

    if (error) {
      console.error('❌ Insert error:', error);
    } else {
      console.log('🎉 6 dummy notifications seeded!');
      console.log('💡 Visit /parent/notifications as parent');
      console.log('🔔 Expected: 4 unread (attendance, announcement, leave, alert), 2 read');
    }

    // Sign out
    await supabase.auth.signOut();
  } catch (err) {
    console.error('💥 Script error:', err);
  }
}

seedDummyNotifications();

