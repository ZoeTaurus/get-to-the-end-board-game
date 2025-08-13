const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = createServer(app);
const io = new Server(server);

// Security middleware
const rateLimit = require('express-rate-limit');

// Rate limiting to prevent brute force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/login', loginLimiter);
app.use('/register', loginLimiter);
app.use(generalLimiter);

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Input validation middleware
const validateInput = (req, res, next) => {
  const { username, password } = req.body;
  
  // Check for suspicious patterns
  if (username && (username.includes('<script>') || username.includes('javascript:'))) {
    return res.status(400).json({ error: 'Invalid input detected' });
  }
  
  if (password && (password.includes('<script>') || password.includes('javascript:'))) {
    return res.status(400).json({ error: 'Invalid input detected' });
  }
  
  next();
};

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.json());

// Apply input validation to login/register routes
app.post('/login', validateInput, (req, res) => {
  // Your existing login logic here
  res.json({ success: true });
});

app.post('/register', validateInput, (req, res) => {
  // Your existing register logic here
  res.json({ success: true });
});

// Socket.io connection handling with rate limiting
const connectedIPs = new Map();

io.use((socket, next) => {
  const clientIP = socket.handshake.address;
  const now = Date.now();
  
  // Rate limit connections per IP
  if (connectedIPs.has(clientIP)) {
    const lastConnection = connectedIPs.get(clientIP);
    if (now - lastConnection < 1000) { // 1 second between connections
      return next(new Error('Connection rate limit exceeded'));
    }
  }
  
  connectedIPs.set(clientIP, now);
  next();
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Clean up on disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Serve the main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 