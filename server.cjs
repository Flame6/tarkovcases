// Combined server for Tarkov Case Sorter
// Serves frontend static files and handles counter API
// Production server - runs via PM2 (see ecosystem.config.cjs)
// Port: Defaults to 5174, can be overridden via PORT environment variable

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

// Sanitize file path to prevent directory traversal attacks
function sanitizePath(filePath) {
  // Remove any path traversal attempts (../, ..\, etc.)
  const normalized = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
  // Remove leading slashes and backslashes
  return normalized.replace(/^[/\\]+/, '');
}

// Validate that resolved path is within allowed directory
function isPathSafe(resolvedPath, allowedDir) {
  const resolved = path.resolve(resolvedPath);
  const allowed = path.resolve(allowedDir);
  return resolved.startsWith(allowed);
}

// Serve static files
async function serveStaticFile(filePath, res) {
  try {
    // Serve Case Images from root directory
    if (filePath.startsWith('/Case Images/') || filePath.startsWith('/Case%20Images/')) {
      // Handle URL encoding (spaces can be %20)
      const decodedPath = decodeURIComponent(filePath);
      // Sanitize path to prevent directory traversal
      const sanitized = sanitizePath(decodedPath.replace(/^\/Case Images\//, '').replace(/^\/Case%20Images\//, ''));
      const fullPath = path.join(ROOT_DIR, 'Case Images', sanitized);
      
      // Security check: ensure path is within allowed directory
      if (!isPathSafe(fullPath, path.join(ROOT_DIR, 'Case Images'))) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden: Invalid path');
        return;
      }
      
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
        res.end('File Not Found');
        return;
      }
    }
    
    // Serve other files from dist directory
    const sanitized = sanitizePath(filePath === '/' ? 'index.html' : filePath);
    const fullPath = path.join(DIST_DIR, sanitized);
    
    // Security check: ensure path is within dist directory
    if (!isPathSafe(fullPath, DIST_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden: Invalid path');
      return;
    }
    
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
      res.end('Not Found');
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
      // Validate request body size (prevent DoS)
      const MAX_BODY_SIZE = 1024; // 1KB should be more than enough for this endpoint
      let body = '';
      let bodySize = 0;
      
      req.on('data', (chunk) => {
        bodySize += chunk.length;
        if (bodySize > MAX_BODY_SIZE) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Request body too large' }));
          req.destroy();
          return;
        }
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          // POST endpoint doesn't require a body, but if one is sent, validate it's empty or valid JSON
          if (body && body.trim()) {
            try {
              JSON.parse(body);
            } catch (parseError) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid JSON in request body' }));
              return;
            }
          }
          
          const currentCount = await getCount();
          // Validate count is a valid number
          if (typeof currentCount !== 'number' || currentCount < 0 || !Number.isFinite(currentCount)) {
            console.error('Invalid count value:', currentCount);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid count value' }));
            return;
          }
          
          const newCount = currentCount + 1;
          // Ensure new count is still valid
          if (!Number.isFinite(newCount) || newCount < 0) {
            console.error('Invalid new count value:', newCount);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to increment count' }));
            return;
          }
          
          await saveCount(newCount);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ count: newCount }));
        } catch (error) {
          console.error('Error incrementing count:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to increment count' }));
        }
      });
      
      req.on('error', (error) => {
        console.error('Request error:', error);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Request error' }));
        }
      });
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

