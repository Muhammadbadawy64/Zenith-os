require('dotenv').config({ path: '.env.local' });
const key = process.env.OPENROUTER_API_KEY;
console.log(key);
console.log(Buffer.from(key || '').toString('hex'));
