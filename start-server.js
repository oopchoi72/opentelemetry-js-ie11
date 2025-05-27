const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

console.log('Starting server...');

const server = http.createServer((req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  
  let filePath = '.' + req.url;
  
  // Default to temp/main.html if root is requested
  if (filePath === './') {
    filePath = './temp/main.html';
  }
  
  // Check if file exists
  try {
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      let contentType = 'text/html';
      
      switch(ext) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.json': contentType = 'application/json'; break;
        case '.png': contentType = 'image/png'; break;
        case '.jpg': 
        case '.jpeg': contentType = 'image/jpeg'; break;
      }
      
      const content = fs.readFileSync(filePath);
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });
      res.end(content);
      console.log(`[${timestamp}] ✅ Served: ${filePath}`);
    } else {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('File not found: ' + filePath);
      console.log(`[${timestamp}] ❌ File not found: ${filePath}`);
    }
  } catch (error) {
    console.error(`[${timestamp}] Error serving ${filePath}:`, error.message);
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end('Internal server error');
  }
});

server.on('error', (err) => {
  console.error('Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please close other applications using this port.`);
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}/`);
  console.log(`📄 Direct access: http://localhost:${PORT}/temp/main.html`);
  console.log(`📁 Serving files from: ${process.cwd()}`);
  console.log('Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️ Shutting down server...');
  server.close(() => {
    console.log('Server stopped.');
    process.exit(0);
  });
}); 