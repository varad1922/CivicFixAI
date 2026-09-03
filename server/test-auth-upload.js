require('dotenv').config();
const supabase = require('./config/supabase');
const fs = require('fs');

async function test() {
  const { data: authData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: 'testcitizen@example.com',
    password: 'Password123'
  });
  if (signInErr) {
    console.error('SignIn err (may not exist):', signInErr.message);
  }

  const token = authData?.session?.access_token;
  if (token) {
    console.log('Testing with token...');
    // This happens in authMiddleware!
    const { data: user, error: authErr } = await supabase.auth.getUser(token);
    console.log('User auth result:', !!user);
  }

  const buffer = Buffer.from('test image content');
  const { data, error } = await supabase.storage.from('civicfix').upload(`test-${Date.now()}.txt`, buffer, { upsert: true });
  if (error) console.error('Upload Error:', error.message);
  else console.log('Uploaded:', data.path);
}
test();
