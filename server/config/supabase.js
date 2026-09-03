const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables before creating the client
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase Environment Variables. Check server/.env'
  );
}

// Decode the JWT to ensure it is actually the service_role key, not the anon key!
try {
  const payloadStr = Buffer.from(supabaseKey.split('.')[1], 'base64').toString();
  const payload = JSON.parse(payloadStr);
  if (payload.role !== 'service_role') {
    console.warn('\n=============================================================');
    console.warn('CRITICAL CONFIGURATION ERROR:');
    console.warn('SUPABASE_SERVICE_ROLE_KEY in server/.env is NOT a service_role key!');
    console.warn(`It appears to be a '${payload.role}' key. This will cause RLS errors during upload.`);
    console.warn('Please replace it with the actual service_role secret.');
    console.warn('=============================================================\n');
  }
} catch (e) {
  console.warn('Could not validate SUPABASE_SERVICE_ROLE_KEY format.');
}

// Create Supabase client using the backend Service Role Key
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

module.exports = supabase;