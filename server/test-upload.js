require('dotenv').config();
const supabase = require('./config/supabase');
async function test() {
  const buffer = Buffer.from('test image content');
  const { data, error } = await supabase.storage.from('civicfix').upload('test.txt', buffer, { upsert: true });
  if (error) console.error(error);
  else console.log('Uploaded:', data);
}
test();
