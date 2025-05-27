const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.url}`);
  
  let filePath = '.' + req.url;
  
  // Default to temp/main.html if root is requested
  if (filePath === './') {
    filePath = './temp/main.html';
  }
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    let contentType = 'text/html';
    
    if (ext === '.js') contentType = 'text/javascript';
    else if (ext === '.css') contentType = 'text/css';
    
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {'Content-Type': contentType});
    res.end(content);
  } else {
    res.writeHead(404);
    res.end('File not found: ' + filePath);
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Direct access: http://localhost:${PORT}/temp/main.html`);
}); 