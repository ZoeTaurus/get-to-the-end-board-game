const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = createServer(app);
const io = new Server(server);

// Trust proxy for Railway deployment
app.set('trust proxy', true);

// Security middleware
const rateLimit = require('express-rate-limit');

// Rate limiting to prevent brute force attacks (very lenient for testing)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // limit each IP to 1000 requests per windowMs
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
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const timestamp = new Date().toISOString();
  
  // Log all HTTP requests
  console.log(`🌐 HTTP ${req.method} ${req.path} from ${clientIP} - User-Agent: ${userAgent} - Time: ${timestamp}`);
  
  // Log suspicious requests
  if (req.path.includes('..') || req.path.includes('admin') || req.path.includes('config')) {
    console.log(`🚨 SUSPICIOUS REQUEST: ${req.method} ${req.path} from ${clientIP}`);
  }
  
  // Log POST requests with data
  if (req.method === 'POST' && req.body) {
    console.log(`📝 POST data from ${clientIP}:`, JSON.stringify(req.body));
  }
  
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

// Serve static files from the game directory
app.use(express.static(path.join(__dirname, 'src', 'game')));
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

// Socket.io connection handling with rate limiting and detailed logging
const connectedIPs = new Map();
const userSessions = new Map(); // Track user sessions and actions

io.use((socket, next) => {
  const clientIP = socket.handshake.address;
  const userAgent = socket.handshake.headers['user-agent'] || 'Unknown';
  const now = Date.now();
  
  console.log(`🔍 New connection attempt from IP: ${clientIP}, User-Agent: ${userAgent}`);
  
  // No rate limiting for now - allow all connections for testing
  connectedIPs.set(clientIP, now);
  
  // Log successful connection
  console.log(`✅ Connection established - IP: ${clientIP}, Socket ID: ${socket.id}, Time: ${new Date().toISOString()}`);
  
  // Store session info
  userSessions.set(socket.id, {
    ip: clientIP,
    userAgent: userAgent,
    connectedAt: now,
    actions: [],
    lastAction: now
  });
  
  next();
});

// Store waiting players and active games
const waitingPlayers = new Map();
const activeGames = new Map();

io.on('connection', (socket) => {
  const session = userSessions.get(socket.id);
  console.log(`👤 User connected: ${socket.id} from ${session.ip}`);
  
  // Log any data sent by the client
  socket.onAny((eventName, ...args) => {
    const now = Date.now();
    console.log(`📡 Event: ${eventName} from ${socket.id} (${session.ip}) - Data:`, JSON.stringify(args));
    
    // Track user actions
    if (session) {
      session.actions.push({
        event: eventName,
        data: args,
        timestamp: now
      });
      session.lastAction = now;
      
      // Log suspicious patterns
      if (session.actions.length > 10) {
        console.log(`⚠️  High activity detected from ${session.ip} - ${session.actions.length} actions`);
      }
      
      // Check for rapid-fire events (potential bot activity)
      const recentActions = session.actions.filter(action => now - action.timestamp < 5000);
      if (recentActions.length > 20) {
        console.log(`🚨 SUSPICIOUS ACTIVITY: ${session.ip} sent ${recentActions.length} events in 5 seconds!`);
      }
    }
  });
  
  // Game logic
  socket.on('joinQueue', (username) => {
    console.log(`🎮 Player joined queue: ${username} (${socket.id}) from ${session.ip}`);
    
    waitingPlayers.set(socket.id, { username, socket });
    
    if (waitingPlayers.size >= 2) {
      const players = Array.from(waitingPlayers.entries()).slice(0, 2);
      const [player1, player2] = players;
      
      waitingPlayers.delete(player1[0]);
      waitingPlayers.delete(player2[0]);
      
      const gameId = `game_${Date.now()}`;
      activeGames.set(gameId, {
        players: [
          { id: player1[0], username: player1[1].username },
          { id: player2[0], username: player2[1].username }
        ],
        currentTurn: player1[0]
      });
      
      player1[1].socket.join(gameId);
      player2[1].socket.join(gameId);
      
      console.log(`🎯 Game started: ${gameId} with ${player1[1].username} vs ${player2[1].username}`);
      
      io.to(gameId).emit('gameStart', {
        gameId,
        players: [
          { id: player1[0], username: player1[1].username },
          { id: player2[0], username: player2[1].username }
        ],
        currentTurn: player1[0]
      });
    } else {
      socket.emit('waiting');
      console.log(`⏳ Player ${username} waiting for opponent...`);
    }
  });
  
  socket.on('makeMove', ({ gameId, move }) => {
    const game = activeGames.get(gameId);
    if (game && game.currentTurn === socket.id) {
      const currentPlayerIndex = game.players.findIndex(p => p.id === socket.id);
      game.currentTurn = game.players[(currentPlayerIndex + 1) % 2].id;
      
      console.log(`♟️  Move made by ${socket.id} from ${session.ip}:`, JSON.stringify(move));
      
      io.to(gameId).emit('moveMade', {
        move,
        nextTurn: game.currentTurn
      });
    }
  });
  
  socket.on('disconnect', (reason) => {
    const session = userSessions.get(socket.id);
    if (session) {
      console.log(`👋 User disconnected: ${socket.id} from ${session.ip} - Reason: ${reason}`);
      console.log(`📊 Session summary for ${session.ip}:`);
      console.log(`   - Connected for: ${Date.now() - session.connectedAt}ms`);
      console.log(`   - Total actions: ${session.actions.length}`);
      console.log(`   - Actions:`, session.actions.map(a => `${a.event}(${a.timestamp})`).join(', '));
      
      // Clean up game state
      waitingPlayers.delete(socket.id);
      activeGames.forEach((game, gameId) => {
        if (game.players.some(p => p.id === socket.id)) {
          console.log(`🏁 Game ${gameId} ended due to player disconnect`);
          io.to(gameId).emit('playerDisconnected');
          activeGames.delete(gameId);
        }
      });
      
      // Clean up
      userSessions.delete(socket.id);
    }
  });
  
  // Log any errors
  socket.on('error', (error) => {
    console.log(`❌ Socket error from ${socket.id} (${session.ip}):`, error);
  });
});

// Periodic security report
setInterval(() => {
  console.log('\n🔒 SECURITY STATUS REPORT:');
  console.log(`   Active connections: ${io.engine.clientsCount}`);
  console.log(`   Unique IPs: ${connectedIPs.size}`);
  console.log(`   Active sessions: ${userSessions.size}`);
  
  // Check for suspicious patterns
  const now = Date.now();
  const suspiciousIPs = [];
  
  for (const [ip, lastConnection] of connectedIPs.entries()) {
    if (now - lastConnection < 60000) { // Last minute
      const sessionsFromIP = Array.from(userSessions.values()).filter(s => s.ip === ip);
      if (sessionsFromIP.length > 3) {
        suspiciousIPs.push({ ip, sessions: sessionsFromIP.length });
      }
    }
  }
  
  if (suspiciousIPs.length > 0) {
    console.log(`   ⚠️  Suspicious IPs:`, suspiciousIPs);
  }
  
  console.log(''); // Empty line for readability
}, 30000); // Every 30 seconds

// Serve the game
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'game', 'game.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 