const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
    // Remove query strings and hash fragments
    const cleanUrl = req.url.split('?')[0].split('#')[0];
    
    // Handle root path
    let filePath = path.join(__dirname, '../public', 
        cleanUrl === '/' ? 'index.html' : cleanUrl);

    // If the path doesn't end with a file extension, append .html
    if (!path.extname(filePath)) {
        filePath += '.html';
    }
    
    const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
    }[path.extname(filePath)] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
            return;
        }

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
}); 