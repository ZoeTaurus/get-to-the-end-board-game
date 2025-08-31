const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const nodemailer = require('nodemailer');

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

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.json());

// Email service setup
const verificationCodes = new Map();

// Generate a random 6-digit code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create transporter for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Send verification code email
async function sendVerificationCode(email) {
  try {
    const code = generateVerificationCode();
    const timestamp = Date.now();
    
    // Store the code with timestamp (expires in 10 minutes)
    verificationCodes.set(email, { code, timestamp });
    
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email not configured, using demo mode. Code:', code);
      return { success: true, code, demo: true };
    }
    
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Get to the End - Password Reset</h2>
          <p>You requested to change your password. Here's your verification code:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #4CAF50; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message from Get to the End game.</p>
        </div>
      `
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    
    // Clean up expired codes
    cleanupExpiredCodes();
    
    return { success: true, code };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send verification code');
  }
}

// Verify the code
function verifyCode(email, code) {
  const stored = verificationCodes.get(email);
  if (!stored) return false;
  
  // Check if code is expired (10 minutes)
  if (Date.now() - stored.timestamp > 10 * 60 * 1000) {
    verificationCodes.delete(email);
    return false;
  }
  
  // Check if code matches
  if (stored.code === code) {
    verificationCodes.delete(email); // Remove used code
    return true;
  }
  
  return false;
}

// Clean up expired codes
function cleanupExpiredCodes() {
  const now = Date.now();
  for (const [email, data] of verificationCodes.entries()) {
    if (now - data.timestamp > 10 * 60 * 1000) {
      verificationCodes.delete(email);
    }
  }
}

// Apply input validation to login/register routes
app.post('/login', validateInput, (req, res) => {
  // Your existing login logic here
  res.json({ success: true });
});

app.post('/register', validateInput, (req, res) => {
  // Your existing register logic here
  res.json({ success: true });
});

// Email API endpoints
app.post('/api/send-verification-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const result = await sendVerificationCode(email);
    res.json(result);
  } catch (error) {
    console.error('Error in send-verification-code:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

app.post('/api/verify-code', (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }
    
    const isValid = verifyCode(email, code);
    res.json({ success: isValid });
  } catch (error) {
    console.error('Error in verify-code:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
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
const privateGames = new Map(); // Store private game data

// Helper function to generate unique game codes
function generateGameCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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
    // Check if it's a regular active game
    const game = activeGames.get(gameId);
    if (game && game.currentTurn === socket.id) {
      const currentPlayerIndex = game.players.findIndex(p => p.id === socket.id);
      game.currentTurn = game.players[(currentPlayerIndex + 1) % 2].id;
      
      console.log(`♟️  Move made by ${socket.id} from ${session.ip}:`, JSON.stringify(move));
      
      io.to(gameId).emit('moveMade', {
        move,
        nextTurn: game.currentTurn
      });
      return;
    }

    // Check if it's a private game
    for (const [gameCode, privateGame] of privateGames.entries()) {
      if (privateGame.gameId === gameId && privateGame.players.includes(socket.id)) {
        console.log(`♟️  Private game move made by ${socket.id} from ${session.ip}:`, JSON.stringify(move));
        
        // Find the other player for turn management
        const otherPlayer = privateGame.players.find(id => id !== socket.id);
        
        // Emit move to all players in the private game
        io.to(gameCode).emit('moveMade', {
          move,
          nextTurn: otherPlayer
        });
        return;
      }
    }
  });

  // Private game handlers
  socket.on('createPrivateGame', ({ gameCode, gameId, hostUsername }) => {
    console.log(`🎮 Private game created: ${gameCode} by ${hostUsername} (${socket.id})`);
    
    // Store the private game
    privateGames.set(gameCode, {
      gameId,
      hostSocketId: socket.id,
      hostUsername,
      gameCode,
      createdAt: Date.now(),
      players: [socket.id],
      gameState: 'waiting'
    });
    
    // Join the player to the game room
    socket.join(gameCode);
    socket.emit('privateGameCreated', { gameCode, gameId });
  });

  socket.on('joinPrivateGame', ({ gameCode, username }) => {
    console.log(`🎮 Player ${username} (${socket.id}) trying to join private game: ${gameCode}`);
    
    const privateGame = privateGames.get(gameCode);
    if (!privateGame) {
      socket.emit('privateGameError', { message: 'Game code not found or expired' });
      return;
    }
    
    // Check if game is full (2 players max)
    if (privateGame.players.length >= 2) {
      socket.emit('privateGameError', { message: 'Game is full' });
      return;
    }
    
    // Add player to the game
    privateGame.players.push(socket.id);
    privateGame.gameState = 'playing';
    
    // Join the player to the game room
    socket.join(gameCode);
    
    // Notify host that opponent joined
    io.to(privateGame.hostSocketId).emit('opponentJoinedPrivateGame', {
      opponentUsername: username,
      gameCode,
      gameId: privateGame.gameId
    });
    
    // Notify guest that they joined successfully
    socket.emit('privateGameJoined', {
      hostUsername: privateGame.hostUsername,
      gameCode,
      gameId: privateGame.gameId
    });
    
    // Notify all players that the game has started
    io.to(gameCode).emit('gameStarted', privateGame.players);
    
    console.log(`🎯 Private game ${gameCode} started: ${privateGame.hostUsername} vs ${username}`);
  });

  socket.on('cancelPrivateGame', ({ gameId }) => {
    console.log(`❌ Private game cancelled: ${gameId} by ${socket.id}`);
    
    // Find and remove the private game
    for (const [gameCode, game] of privateGames.entries()) {
      if (game.gameId === gameId) {
        privateGames.delete(gameCode);
        break;
      }
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
      
      // Clean up private games
      for (const [gameCode, game] of privateGames.entries()) {
        const playerIndex = game.players.indexOf(socket.id);
        if (playerIndex > -1) {
          game.players.splice(playerIndex, 1);
          
          // If the game is empty after a player disconnects, remove it
          if (game.players.length === 0) {
            privateGames.delete(gameCode);
            console.log(`🏁 Private game ${gameCode} ended due to player disconnect`);
          } else {
            // Notify the remaining player that the other has left
            socket.to(gameCode).emit('opponentLeft', 'Your opponent has left the game.');
          }
        }
      }
      
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

// Serve the main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 