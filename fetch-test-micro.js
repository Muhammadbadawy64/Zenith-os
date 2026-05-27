fetch('http://localhost:3000/api/12week/micro', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ milestone: 'test', weekNumber: 1, locale: 'ar' })
}).then(async r => {
  console.log(r.status);
  console.log(await r.text());
}).catch(console.error);
