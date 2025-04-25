const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Serve index.html for all routes (for client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Store waiting players and active games
const waitingPlayers = new Map();
const activeGames = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle player joining queue
  socket.on('joinQueue', (username) => {
    console.log('Player joined queue:', username);
    
    // Add player to waiting list
    waitingPlayers.set(socket.id, { username, socket });

    // Check for available players
    if (waitingPlayers.size >= 2) {
      const players = Array.from(waitingPlayers.entries()).slice(0, 2);
      const [player1, player2] = players;

      // Remove players from waiting list
      waitingPlayers.delete(player1[0]);
      waitingPlayers.delete(player2[0]);

      // Create game room
      const gameId = `game_${Date.now()}`;
      activeGames.set(gameId, {
        players: [
          { id: player1[0], username: player1[1].username },
          { id: player2[0], username: player2[1].username }
        ],
        currentTurn: player1[0]
      });

      // Join both players to game room
      player1[1].socket.join(gameId);
      player2[1].socket.join(gameId);

      // Notify players of game start
      io.to(gameId).emit('gameStart', {
        gameId,
        players: [
          { id: player1[0], username: player1[1].username },
          { id: player2[0], username: player2[1].username }
        ],
        currentTurn: player1[0]
      });
    } else {
      // Notify player they're waiting
      socket.emit('waiting');
    }
  });

  // Handle game moves
  socket.on('makeMove', ({ gameId, move }) => {
    const game = activeGames.get(gameId);
    if (game && game.currentTurn === socket.id) {
      // Update current turn
      const currentPlayerIndex = game.players.findIndex(p => p.id === socket.id);
      game.currentTurn = game.players[(currentPlayerIndex + 1) % 2].id;
      
      // Broadcast move to both players
      io.to(gameId).emit('moveMade', {
        move,
        nextTurn: game.currentTurn
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Remove from waiting players if present
    waitingPlayers.delete(socket.id);

    // Handle active games
    activeGames.forEach((game, gameId) => {
      if (game.players.some(p => p.id === socket.id)) {
        // Notify other player of disconnection
        io.to(gameId).emit('playerDisconnected');
        activeGames.delete(gameId);
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 