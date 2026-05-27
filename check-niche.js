require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase.from('content_studio').select('niche').limit(1);
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Success, niche exists');
  }
}

test();
