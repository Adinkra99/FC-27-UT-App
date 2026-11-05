const http = require('http');

const data = JSON.stringify({
  messages: [{ role: 'user', text: 'what chemistry style for hugo ekitike' }]
});

const req = http.request(
  {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/gemini/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  },
  (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      console.log('STATUS:', res.statusCode);
      try {
        const json = JSON.parse(body);
        console.log('\n--- RESPONSE TEXT ---');
        console.log(json.text);
        console.log('\n--- TELEMETRY ---');
        console.log(json.routingTelemetry);
      } catch (e) {
        console.log('BODY:', body);
      }
    });
  }
);

req.on('error', (e) => console.error('REQUEST ERROR:', e));
req.write(data);
req.end();
