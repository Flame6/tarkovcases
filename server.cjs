// Combined server for Tarkov Case Sorter
// Serves frontend static files and handles counter API

const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { createReadStream, statSync } = require('fs');

const PORT = process.env.PORT || 5174;
const DIST_DIR = path.join(__dirname, 'dist');
const ROOT_DIR = __dirname;
const COUNT_FILE = path.join(__dirname, 'tarkov-count.json');

// Counter API functions
async function getCount() {
  try {
    const data = await fs.readFile(COUNT_FILE, 'utf8');
    return JSON.parse(data).count || 0;
  } catch {
    return 0;
  }
}

async function saveCount(count) {
  await fs.writeFile(COUNT_FILE, JSON.stringify({ count }), 'utf8');
}

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'application/font-woff',
  '.woff2': 'application/font-woff2',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

// Serve static files
async function serveStaticFile(filePath, res) {
  try {
    // Serve Case Images from root directory
    if (filePath.startsWith('/Case Images/') || filePath.startsWith('/Case%20Images/')) {
      // Handle URL encoding (spaces can be %20)
      const decodedPath = decodeURIComponent(filePath);
      const fullPath = path.join(ROOT_DIR, decodedPath);
      const stats = await fs.stat(fullPath);
      if (stats.isFile()) {
        res.writeHead(200, {
          'Content-Type': getMimeType(fullPath),
          'Content-Length': stats.size,
        });
        createReadStream(fullPath).pipe(res);
        return;
      } else {
        res.writeHead(404);
        res.end('File Not Found: ' + decodedPath);
        return;
      }
    }
    
    // Serve other files from dist directory
    const fullPath = path.join(DIST_DIR, filePath === '/' ? 'index.html' : filePath);
    const stats = await fs.stat(fullPath);
    
    if (stats.isFile()) {
      res.writeHead(200, {
        'Content-Type': getMimeType(fullPath),
        'Content-Length': stats.size,
      });
      createReadStream(fullPath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  } catch (error) {
    // Log error for debugging
    console.error('Error serving file:', filePath, error.message);
    
    // If file doesn't exist, serve index.html for SPA routing
    if (filePath !== '/index.html' && !filePath.startsWith('/Case Images/') && !filePath.startsWith('/Case%20Images/')) {
      try {
        const indexPath = path.join(DIST_DIR, 'index.html');
        const stats = await fs.stat(indexPath);
        res.writeHead(200, {
          'Content-Type': 'text/html',
          'Content-Length': stats.size,
        });
        createReadStream(indexPath).pipe(res);
      } catch {
        res.writeHead(404);
        res.end('Not Found');
      }
    } else {
      res.writeHead(404);
      res.end('Not Found: ' + filePath);
    }
  }
}

const server = http.createServer(async (req, res) => {
  // Parse URL manually to handle spaces correctly
  let pathname = req.url.split('?')[0]; // Remove query string
  
  // Handle counter API endpoint
  if (pathname === '/tarkov-optimizer/count') {
    if (req.method === 'GET') {
      try {
        const count = await getCount();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ count }));
      } catch (error) {
        console.error('Error getting count:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to get count' }));
      }
    } else if (req.method === 'POST') {
      try {
        const currentCount = await getCount();
        const newCount = currentCount + 1;
        await saveCount(newCount);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ count: newCount }));
      } catch (error) {
        console.error('Error incrementing count:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to increment count' }));
      }
    } else if (req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
    } else {
      res.writeHead(405);
      res.end();
    }
    return;
  }
  
  // Serve static files
  serveStaticFile(pathname, res);
});

server.listen(PORT, () => {
  console.log(`Tarkov Case Sorter server running on port ${PORT}`);
  console.log(`Serving files from: ${DIST_DIR}`);
});

