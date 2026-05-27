require('dotenv').config({ path: '.env.local' });
const key = process.env.OPENROUTER_API_KEY?.trim();
fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + key,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
    messages: [{role: 'user', content: 'Hi'}]
  })
}).then(async r => {
  console.log(r.status);
  console.log(await r.text());
}).catch(console.error);
