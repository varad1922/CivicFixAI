require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

(async () => {
  try {
    // 1. Create client with anon key
    // Wait, we don't have the anon key in server/.env, let's just create a user with service role and then login?
    // Actually, I can just use supabase-js auth.admin to create a user and get a token?
    // Let's just run a SELECT to see if we have permissions.
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase.from('issues').select('*').limit(1);
    console.log('Select error:', error);
  } catch (err) {
    console.error(err);
  }
})();
