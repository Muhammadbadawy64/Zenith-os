require('dotenv').config({ path: '.env.local' });
const key = process.env.OPENROUTER_API_KEY?.trim();
console.log('Key prefix:', key?.substring(0, 15));
fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + key,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'deepseek/deepseek-v4-flash:free',
    messages: [{role: 'user', content: 'Say hello in one word'}]
  })
}).then(async r => {
  const text = await r.text();
  console.log('Status:', r.status);
  console.log('Response:', text.substring(0, 300));
}).catch(console.error);
