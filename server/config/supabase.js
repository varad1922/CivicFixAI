const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
// We use the Service Role Key on the backend to bypass RLS when necessary (e.g. creating users, background tasks).
// For user-context actions, we will pass the user's JWT or rely on specific backend-controlled RLS logic.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase Environment Variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
