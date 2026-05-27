const { GoogleGenerativeAI } = require('@google/generative-ai');
fetch('https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyAwEX3CYWVHHqKGwGETae0Mhri38Pv3wqU').then(r=>r.json()).then(console.log);
