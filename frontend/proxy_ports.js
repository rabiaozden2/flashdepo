const http = require('http');

// Port 3001: Depo Yöneticisi Giriş Portalı -> http://localhost:3000/seller/login
const server3001 = http.createServer((req, res) => {
  const targetPath = req.url === '/' ? '/seller/login' : req.url;
  res.writeHead(302, { Location: `http://localhost:3000${targetPath}` });
  res.end();
});

server3001.listen(3001, () => {
  console.log('🏢 Depo Yöneticisi Giriş Portalı active at http://localhost:3001');
});

// Port 3002: Admin Giriş Portalı -> http://localhost:3000/admin/login
const server3002 = http.createServer((req, res) => {
  const targetPath = req.url === '/' ? '/admin/login' : req.url;
  res.writeHead(302, { Location: `http://localhost:3000${targetPath}` });
  res.end();
});

server3002.listen(3002, () => {
  console.log('👑 Admin Giriş Portalı active at http://localhost:3002');
});
