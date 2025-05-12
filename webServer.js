// server.js
import http from 'http';
const port = 3000;  // or another port >1024 to avoid elevation

const server = http.createServer((req, res) => {
  console.log(`\n=== ${req.method} ${req.url} ===`);
  console.log('Headers:', req.headers);

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    if (body) console.log('Body:', body);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  });
});

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
