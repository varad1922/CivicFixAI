const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables before creating the client
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase Environment Variables. Check server/.env'
  );
}

// Create Supabase client using the backend Service Role Key
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;