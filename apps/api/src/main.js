console.log('Hayyamed API starting...'); 
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', message: 'Hayyamed API running!' }));
});

server.listen(4000, '0.0.0.0', () => {
  console.log('Hayyamed API running on port 4000');
});