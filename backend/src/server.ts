import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';

interface Player {
  id: string;
  ws: WebSocket;
  username: string;
  color?: 'red' | 'blue';
  roomId?: string;
}

interface Room {
  id: string;
  players: Player[];
  board: (null | { type: 'person' | 'circle'; color: 'red' | 'blue'; eaten?: number })[][];
  currentPlayer: 'red' | 'blue';
  winner?: 'red' | 'blue';
}

const players = new Map<string, Player>();
const rooms = new Map<string, Room>();

const wss = new WebSocket.Server({ port: 8080 });

function createInitialBoard(): Room['board'] {
  const board: Room['board'] = Array(4).fill(null).map(() => Array(6).fill(null));
  
  // Set up blue pieces
  board[0][0] = { type: 'person', color: 'blue' };
  board[0][1] = { type: 'circle', color: 'blue' };
  board[0][2] = { type: 'person', color: 'blue' };
  
  // Set up red pieces
  board[3][3] = { type: 'person', color: 'red' };
  board[3][4] = { type: 'circle', color: 'red' };
  board[3][5] = { type: 'person', color: 'red' };
  
  return board;
}

function broadcastToRoom(room: Room, message: any) {
  room.players.forEach(player => {
    player.ws.send(JSON.stringify(message));
  });
}

wss.on('connection', (ws: WebSocket) => {
  const playerId = uuidv4();
  
  ws.on('message', (message: string) => {
    const data = JSON.parse(message);
    
    switch (data.type) {
      case 'join': {
        const player: Player = {
          id: playerId,
          ws,
          username: data.username
        };
        players.set(playerId, player);
        
        let room: Room | undefined;
        
        // Try to find a room with one player
        for (const [roomId, existingRoom] of rooms) {
          if (existingRoom.players.length === 1) {
            room = existingRoom;
            break;
          }
        }
        
        if (!room) {
          // Create new room if none found
          room = {
            id: uuidv4(),
            players: [],
            board: createInitialBoard(),
            currentPlayer: 'blue'
          };
          rooms.set(room.id, room);
        }
        
        // Assign color based on join order
        player.color = room.players.length === 0 ? 'blue' : 'red';
        player.roomId = room.id;
        room.players.push(player);
        
        // Notify player of successful join
        ws.send(JSON.stringify({
          type: 'joined',
          roomId: room.id,
          color: player.color
        }));
        
        if (room.players.length === 2) {
          // Start game when room is full
          broadcastToRoom(room, {
            type: 'gameStart',
            board: room.board,
            currentPlayer: room.currentPlayer,
            players: room.players.map(p => ({
              id: p.id,
              username: p.username,
              color: p.color
            }))
          });
        }
        break;
      }
      
      case 'move': {
        const player = players.get(playerId);
        if (!player?.roomId) return;
        
        const room = rooms.get(player.roomId);
        if (!room) return;
        
        if (room.currentPlayer !== player.color) return;
        
        const { fromRow, fromCol, toRow, toCol } = data;
        const piece = room.board[fromRow][fromCol];
        
        if (!piece || piece.color !== player.color) return;
        
        // Update board
        room.board[toRow][toCol] = piece;
        room.board[fromRow][fromCol] = null;
        
        // Handle captures if any
        if (data.capturedPiece) {
          const { row, col } = data.capturedPiece;
          room.board[row][col] = null;
          if (piece.type === 'circle') {
            piece.eaten = (piece.eaten || 0) + 1;
          }
        }
        
        // Switch current player
        room.currentPlayer = room.currentPlayer === 'red' ? 'blue' : 'red';
        
        // Check win condition
        if (data.isWinningMove) {
          room.winner = player.color;
        }
        
        // Broadcast updated game state
        broadcastToRoom(room, {
          type: 'gameUpdate',
          board: room.board,
          currentPlayer: room.currentPlayer,
          winner: room.winner
        });
        break;
      }
    }
  });
  
  ws.on('close', () => {
    const player = players.get(playerId);
    if (player?.roomId) {
      const room = rooms.get(player.roomId);
      if (room) {
        // Remove player from room
        room.players = room.players.filter(p => p.id !== playerId);
        if (room.players.length === 0) {
          // Delete empty room
          rooms.delete(room.id);
        } else {
          // Notify remaining player
          broadcastToRoom(room, {
            type: 'playerLeft',
            playerId
          });
        }
      }
    }
    players.delete(playerId);
  });
});

console.log('WebSocket server is running on port 8080'); 