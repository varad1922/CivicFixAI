require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

(async () => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create a dummy user
    const email = 'test_insert_' + Date.now() + '@example.com';
    const password = 'Password123!';
    const { data: user, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    
    if (authError) {
      console.log('Auth Error:', authError);
      return;
    }
    
    console.log('User created:', user.user.id);
    
    // Sign in to get JWT
    const authClient = createClient(supabaseUrl, supabaseKey); // anon key is usually needed for sign in, but we can try service role
    // Wait, service_role can sign in but let's try.
    const { data: sessionData, error: signInError } = await authClient.auth.signInWithPassword({
      email,
      password
    });
    
    if (signInError) {
      console.log('Sign in Error:', signInError);
    } else {
      console.log('Signed in. Token:', sessionData.session.access_token);
      
      const userClient = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${sessionData.session.access_token}` } }
      });
      
      const { data: insertData, error: insertError } = await userClient.from('issues').insert({
        title: 'Test Issue Auth',
        description: 'Test Desc',
        category: 'Other',
        severity: 'Low',
        lat: 0,
        lng: 0,
        reported_by: user.user.id
      });
      
      console.log('Insert Error with Auth:', insertError);
    }
  } catch (err) {
    console.error(err);
  }
})();
