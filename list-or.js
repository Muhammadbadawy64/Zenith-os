require('dotenv').config({ path: '.env.local' });
const key = process.env.OPENROUTER_API_KEY?.trim();
fetch('https://openrouter.ai/api/v1/models', {
  headers: { 'Authorization': 'Bearer ' + key }
}).then(r=>r.json()).then(data => {
  const free = data.data.filter(m => m.id.includes(':free'));
  console.log(JSON.stringify(free.map(m => m.id), null, 2));
}).catch(console.error);
