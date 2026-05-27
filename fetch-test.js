fetch('http://localhost:3000/api/12week/macro', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ goals: ['???? ???????'], monthMapping: { '0': [1,2,3] }, locale: 'ar' })
}).then(async r => {
  console.log(r.status);
  console.log(await r.text());
}).catch(console.error);
