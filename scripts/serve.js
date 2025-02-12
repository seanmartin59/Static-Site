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

    // If the path doesn't have an extension, try these in order:
    // 1. path/index.html
    // 2. path.html
    if (!path.extname(filePath)) {
        const indexPath = path.join(filePath, 'index.html');
        if (fs.existsSync(indexPath)) {
            filePath = indexPath;
        } else {
            filePath += '.html';
        }
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
            console.error(`Error serving ${filePath}:`, err);
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