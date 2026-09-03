require('dotenv').config();
const supabase = require('./config/supabase');

(async () => {
  const { data, error } = await supabase.from('issues').insert({
    title: 'Test Issue',
    description: 'Test Desc',
    category: 'Other',
    severity: 'Low',
    lat: 0,
    lng: 0,
    reported_by: '00000000-0000-0000-0000-000000000000' // dummy uuid
  });
  console.log('Error:', error);
  console.log('Data:', data);
})();
