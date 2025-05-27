const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8080;

// MIME 타입 매핑
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }
  
  // Handle requests to dist folder (go up one level)
  if (filePath.startsWith('./dist/')) {
    filePath = '../' + filePath.substring(2);
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // 파일이 없으면 404
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>404 Not Found</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              h1 { color: #e74c3c; }
              .back-link { color: #3498db; text-decoration: none; }
              .back-link:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <h1>404 - File Not Found</h1>
            <p>The requested file <code>${req.url}</code> was not found.</p>
            <p><a href="/" class="back-link">← Back to home</a></p>
            <hr>
            <p>Available test files:</p>
            <ul>
              <li><a href="/simple-agent-test.html">Simple Agent Test</a></li>
              <li><a href="/dom-event-test-with-agent.html">DOM Event Test</a></li>
            </ul>
          </body>
          </html>
        `);
      } else {
        // 서버 에러
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      // 파일 서빙
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(port, () => {
  console.log(`HTTP Server running at http://localhost:${port}/`);
  console.log('Available test pages:');
  console.log(`  - Simple Agent Test: http://localhost:${port}/simple-agent-test.html`);
  console.log(`  - DOM Event Test: http://localhost:${port}/dom-event-test-with-agent.html`);
});

// 서버 종료 처리 (Ctrl+C 시에만)
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

// 에러 처리
server.on('error', (err) => {
  console.error('Server error:', err);
}); 