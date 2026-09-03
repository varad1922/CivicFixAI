require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

(async () => {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  // We can't run raw SQL, but we can query views or use postgrest to query information_schema if enabled, but it's not exposed by default.
  // Wait, let's just query issues again to confirm.
  const { data, error } = await supabase.from('issues').select('*').limit(1);
  console.log('Issues Select error:', error);
})();
