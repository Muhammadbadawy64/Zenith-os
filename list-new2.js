require('dotenv').config({ path: '.env.local' });
fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + process.env.GOOGLE_GEMINI_API_KEY).then(r=>r.json()).then(console.log).catch(console.error);
