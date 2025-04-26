import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import LoadingScreen from './components/LoadingScreen';
import './App.css';
import Login from './Login';

type PieceType = 'person' | 'circle';
type PlayerColor = 'red' | 'blue';
type GameScreen = 'home' | 'game' | 'help';

interface Piece {
  type: PieceType;
  color: PlayerColor;
  eatenCount: number;
}

interface Player {
  color: PlayerColor;
  username: string;
}

const socket = io(window.location.origin);

function App() {
  const [screen, setScreen] = useState<GameScreen>('home');
  const [board, setBoard] = useState<(Piece | null)[][]>(
    Array(4).fill(null).map(() => Array(6).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = useState<PlayerColor>('red');
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [validCaptures, setValidCaptures] = useState<[number, number][]>([]);
  const [gameMessage, setGameMessage] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [opponent, setOpponent] = useState('');
  const [gameId, setGameId] = useState('');
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [players, setPlayers] = useState<{red: Player, blue: Player}>(() => {
    // Try to get saved player data from local storage
    const savedPlayers = localStorage.getItem('players');
    if (savedPlayers) {
      return JSON.parse(savedPlayers);
    }
    return {
      red: { color: 'red', username: '' },
      blue: { color: 'blue', username: 'Player 2' }
    };
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const isMyTurnRef = useRef(isMyTurn);

  useEffect(() => {
    // Socket event listeners
    socket.on('waiting', () => {
      setIsSearching(true);
    });

    socket.on('gameStart', (data) => {
      setIsSearching(false);
      setGameStarted(true);
      setScreen('game');
      const isPlayer1 = data.players[0].id === socket.id;
      const player1Name = data.players[0].username;
      const player2Name = data.players[1].username;
      setOpponent(isPlayer1 ? player2Name : player1Name);
      setGameId(data.gameId);
      
      // Set initial turn state
      const isMyTurnNow = data.currentTurn === socket.id;
      setIsMyTurn(isMyTurnNow);
      setCurrentPlayer('red'); // Game always starts with red
      
      // Update players with correct usernames
      setPlayers({
        red: { color: 'red', username: player1Name },
        blue: { color: 'blue', username: player2Name }
      });
      
      // Initialize game
      initializeGame();
    });

    socket.on('moveMade', (data) => {
      const { row, col, selectedPiece, board: newBoardState, winner: moveWinner } = data.move;
      
      // Update the board state
      if (newBoardState) {
        setBoard(newBoardState);
      }
      
      // Clear selection states
      setSelectedPiece(null);
      setValidMoves([]);
      setValidCaptures([]);
      
      // If the move resulted in a win, update game state
      if (moveWinner) {
        setWinner(moveWinner);
        setGameMessage(`${players[moveWinner].username} wins!`);
        if (moveWinner === getMyColor()) {
          setShowConfetti(true);
        }
      } else {
        // Only update turn state if there's no winner
        const isMyTurnNow = data.nextTurn === socket.id;
        setIsMyTurn(isMyTurnNow);
        setCurrentPlayer(prev => prev === 'red' ? 'blue' : 'red');
      }
    });

    socket.on('playerDisconnected', () => {
      setGameStarted(false);
      setIsSearching(false);
      setScreen('home');
    });

    socket.on('gameOver', (data) => {
      setWinner(data.winner);
      setGameMessage(data.message);
      if (data.winner === getMyColor()) {
        setShowConfetti(true);
      }
      // Stop the timer when game is over
      if (timerId) {
        clearInterval(timerId);
        setTimerId(null);
      }
    });

    return () => {
      socket.off('waiting');
      socket.off('gameStart');
      socket.off('moveMade');
      socket.off('playerDisconnected');
      socket.off('gameOver');
    };
  }, [board, currentPlayer, username, opponent, timerId]);

  useEffect(() => { isMyTurnRef.current = isMyTurn; }, [isMyTurn]);

  // Handle login
  const handleLogin = (username: string) => {
    setUsername(username);
    setIsLoggedIn(true);
    // Remove automatic game search
    setScreen('home');
  };

  // Handle logout
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    // Clear all game state
    setGameStarted(false);
    setWinner(null);
    setSelectedPiece(null);
    setValidMoves([]);
    setValidCaptures([]);
    setGameMessage('');
    setShowConfetti(false);
    setPlayers({
      red: { color: 'red', username: '' },
      blue: { color: 'blue', username: 'Player 2' }
    });
    
    // Clear user state
    setIsLoggedIn(false);
    setUsername('');
    
    // Clear local storage
    localStorage.removeItem('lastUsername');
    
    // Reset screen
    setScreen('home');
    
    // Close confirmation dialog
    setShowLogoutConfirm(false);
    
    // Disconnect and reconnect socket for a clean state
    if (socket && socket.connected) {
      socket.disconnect();
      setTimeout(() => {
        socket.connect();
      }, 100);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  // Initialize the game
  const initializeGame = () => {
    const newBoard = Array(4).fill(null).map(() => Array(6).fill(null));
    
    // Set up blue pieces on the left side
    newBoard[0][0] = { type: 'person', color: 'blue', eatenCount: 0 };
    newBoard[1][0] = { type: 'circle', color: 'blue', eatenCount: 0 };
    newBoard[2][0] = { type: 'person', color: 'blue', eatenCount: 0 };
    newBoard[3][0] = { type: 'person', color: 'blue', eatenCount: 0 };
    
    // Set up red pieces on the right side
    newBoard[0][5] = { type: 'person', color: 'red', eatenCount: 0 };
    newBoard[1][5] = { type: 'person', color: 'red', eatenCount: 0 };
    newBoard[2][5] = { type: 'circle', color: 'red', eatenCount: 0 };
    newBoard[3][5] = { type: 'person', color: 'red', eatenCount: 0 };
    
    setBoard(newBoard);
    setCurrentPlayer('red');
    setWinner(null);
    setSelectedPiece(null);
    setValidMoves([]);
    setValidCaptures([]);
    setGameMessage(`It's ${players.red.username}'s turn. Select a piece to move.`);
  };

  // Start new game on component mount
  useEffect(() => {
    initializeGame();
  }, []);

  // Calculate valid moves for a selected piece
  const calculateValidMoves = (board: (Piece | null)[][], row: number, col: number) => {
    const piece = board[row][col];
    if (!piece) return { moves: [], captures: [] };

    const moves: [number, number][] = [];
    const captures: [number, number][] = [];
    
    // All possible directions
    const allDirections = [
      [-1, 0],  // up
      [1, 0],   // down
      [0, -1],  // left
      [0, 1],   // right
      [-1, -1], // up-left
      [-1, 1],  // up-right
      [1, -1],  // down-left
      [1, 1]    // down-right
    ];

    if (piece.type === 'person') {
      // Person moves orthogonally (up, down, left, right)
      for (let i = 0; i < 4; i++) {
        const [dRow, dCol] = allDirections[i];
        const newRow = row + dRow;
        const newCol = col + dCol;
        
        // Check if the move is within board boundaries and the target cell is empty
        if (
          newRow >= 0 && newRow < board.length &&
          newCol >= 0 && newCol < board[0].length &&
          !board[newRow][newCol]
        ) {
          moves.push([newRow, newCol]);
        }
      }

      // Person captures diagonally
      for (let i = 4; i < 8; i++) {
        const [dRow, dCol] = allDirections[i];
        const newRow = row + dRow;
        const newCol = col + dCol;
        
        // Check if the capture is within board boundaries and there's an opponent's piece
        if (
          newRow >= 0 && newRow < board.length &&
          newCol >= 0 && newCol < board[0].length &&
          board[newRow][newCol] &&
          board[newRow][newCol]?.color !== piece.color
        ) {
          captures.push([newRow, newCol]);
        }
      }
    } else if (piece.type === 'circle') {
      // Circle moves and captures in any direction
      for (const [dRow, dCol] of allDirections) {
        const newRow = row + dRow;
        const newCol = col + dCol;
        
        // Check if the move/capture is within board boundaries
        if (
          newRow >= 0 && newRow < board.length &&
          newCol >= 0 && newCol < board[0].length
        ) {
          const targetCell = board[newRow][newCol];
          if (!targetCell) {
            moves.push([newRow, newCol]);
          } else if (
            targetCell.color !== piece.color &&
            piece.eatenCount < 2
          ) {
            captures.push([newRow, newCol]);
          }
        }
      }
    }
    
    return { moves, captures };
  };

  // Check win conditions
  const checkWinCondition = (newBoard: (Piece | null)[][], currentCol: number) => {
    // Check for reaching the opposite end
    const blueWin = newBoard.some((row, rowIndex) => 
      row[5] !== null && row[5].color === 'blue'  // Blue piece on rightmost column
    );
    const redWin = newBoard.some((row, rowIndex) => 
      row[0] !== null && row[0].color === 'red'  // Red piece on leftmost column
    );
    if (blueWin) return 'blue';
    if (redWin) return 'red';
    // Check for capturing all opponent pieces
    const bluePiecesExist = newBoard.flat().some(cell => cell && cell.color === 'blue');
    const redPiecesExist = newBoard.flat().some(cell => cell && cell.color === 'red');
    if (!bluePiecesExist) return 'red';
    if (!redPiecesExist) return 'blue';
    return null;
  };

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    // Don't allow moves if game is over
    if (!gameStarted || !isMyTurn || winner) return;
    
    const piece = board[rowIndex][colIndex];
    const myColor = getMyColor();
    
    if (selectedPiece) {
      const [selectedRow, selectedCol] = selectedPiece;
      const selectedPieceData = board[selectedRow][selectedCol];
      
      // Clicking the same piece deselects it
      if (selectedRow === rowIndex && selectedCol === colIndex) {
        setSelectedPiece(null);
        setValidMoves([]);
        setValidCaptures([]);
        return;
      }
      
      // Clicking another piece of your color selects it instead
      if (piece && piece.color === myColor) {
        setSelectedPiece([rowIndex, colIndex]);
        const { moves, captures } = calculateValidMoves(board, rowIndex, colIndex);
        setValidMoves(moves);
        setValidCaptures(captures);
        return;
      }
      
      const isValidMove = validMoves.some(([r, c]) => r === rowIndex && c === colIndex);
      const isValidCapture = validCaptures.some(([r, c]) => r === rowIndex && c === colIndex);
      
      if (isValidMove || isValidCapture) {
        const newBoard = board.map(r => [...r]);
        const movingPiece = {...board[selectedRow][selectedCol]!};
        
        if (isValidCapture) {
          if (movingPiece.type === 'circle') {
            movingPiece.eatenCount = (movingPiece.eatenCount || 0) + 1;
          }
        }
        
        newBoard[rowIndex][colIndex] = movingPiece;
        newBoard[selectedRow][selectedCol] = null;
        
        // Check for win condition
        const winnerColor = checkWinCondition(newBoard, colIndex);
        
        // Emit move to server with full board state
        socket.emit('makeMove', {
          gameId,
          move: {
            row: rowIndex,
            col: colIndex,
            selectedPiece: { row: selectedRow, col: selectedCol },
            board: newBoard,
            winner: winnerColor // Include winner in move data
          }
        });
        
        setBoard(newBoard);
        setSelectedPiece(null);
        setValidMoves([]);
        setValidCaptures([]);
        
        // If there's a winner, emit gameOver
        if (winnerColor) {
          socket.emit('gameOver', { 
            gameId, 
            winner: winnerColor, 
            message: `${players[winnerColor].username} wins!` 
          });
        }
      }
    } 
    else if (piece && piece.color === myColor) {
      setSelectedPiece([rowIndex, colIndex]);
      const { moves, captures } = calculateValidMoves(board, rowIndex, colIndex);
      setValidMoves(moves);
      setValidCaptures(captures);
    }
  };

  const handleMove = (row: number, col: number, piece: any) => {
    if (!isMyTurn || !gameStarted) return;
    
    // Emit move to server
    socket.emit('makeMove', {
      gameId,
      move: { row, col, piece }
    });
    
    // Update local game state
    // ... existing move logic ...
  };

  // Helper to get local player's color
  const getMyColor = () => username === players.red.username ? 'red' : 'blue';

  // Add timer reset function
  const resetTimer = useCallback(() => {
    // Clear existing timer
    if (timerId) {
      clearInterval(timerId);
    }
    
    setTimeLeft(30);
    const newTimerId = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          // Only emit gameOver if it's my turn
          if (isMyTurnRef.current) {
            const otherPlayer = getMyColor() === 'red' ? 'blue' : 'red';
            socket.emit('gameOver', { 
              gameId, 
              winner: otherPlayer, 
              message: `${players[otherPlayer].username} wins by timeout!` 
            });
          }
          clearInterval(newTimerId);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    setTimerId(newTimerId);
  }, [getMyColor, players, gameId, timerId]);

  // Reset timer on turn change
  useEffect(() => {
    if (gameStarted && !winner) {
      resetTimer();
    }
  }, [currentPlayer, gameStarted, winner, resetTimer]);

  // Clean up timer on unmount and logout
  useEffect(() => {
    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [timerId]);

  const HomeScreen = () => (
    <div className="home-screen">
      <h1>Get To The End</h1>
      <div className="home-buttons">
        <button type="button" onClick={() => {
          socket.emit('joinQueue', username);
          setIsSearching(true);
        }}>
          Play Game
        </button>
        <button type="button" onClick={() => setScreen('help')}>
          Help
        </button>
        <button
          type="button"
          onClick={handleLogoutClick}
          className="logout-button"
        >
          Logout
        </button>
      </div>
      <p className="coming-soon">More stuff coming soon!</p>
      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="logout-confirm-overlay">
          <div className="logout-confirm-dialog">
            <h2>Are you sure you want to logout?</h2>
            <div className="logout-confirm-buttons">
              <button onClick={handleLogoutConfirm} className="confirm-yes">Yes</button>
              <button onClick={handleLogoutCancel} className="confirm-no">No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const HelpScreen = () => (
    <div className="help-screen">
      <div className="help-content">
        <h2>How to Play</h2>
        
        <h3>Pieces</h3>
        <p><strong>Person-shaped piece:</strong></p>
        <ul>
          <li>Can move back, forth, and sideways</li>
          <li>Can only eat opponent's pieces diagonally</li>
        </ul>

        <p><strong>Circle-shaped piece:</strong></p>
        <ul>
          <li>Can move in any direction</li>
          <li>Can eat in any direction</li>
          <li>Can only eat 2 pieces before getting full</li>
        </ul>

        <h3>How to Win</h3>
        <ul>
          <li>Eat all opponent's pieces, OR</li>
          <li>Get to the other side of the board</li>
        </ul>

        <h3>Setup</h3>
        <p>Starting from the left: Place 2 person-shaped pieces, then a circle-shaped piece, and finally another person-shaped piece.</p>

        <div className="video-section">
          <p>Still don't get it? Watch this video!</p>
          <a href="https://youtu.be/ZJ1hJTOzmhg" target="_blank" rel="noopener noreferrer" className="video-button">
            Watch Tutorial Video
          </a>
        </div>

        <button onClick={() => setScreen('home')} className="back-button">
          Back to Home
        </button>
      </div>
    </div>
  );

  // Show loading screen when searching for opponent
  if (isSearching) {
    return <LoadingScreen />;
  }

  // If not logged in, show login screen
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // Show different screens based on state
  if (screen === 'home') {
    return <HomeScreen />;
  }

  if (screen === 'help') {
    return <HelpScreen />;
  }

  // Game screen (existing game content)
  return (
    <div className="app">
      <div className="game-content">
        {winner && (
          <div className="winner-announcement">
            {winner === getMyColor() ? (
              <>
                <h2 style={{ color: winner === 'red' ? '#ff4444' : '#4444ff' }}>You WON!!!!</h2>
                {showConfetti && <ConfettiOverlay />}
              </>
            ) : (
              <>
                <h2 style={{ color: '#888' }}>Sorry, you lost.</h2>
                <div className="rain">
                  {Array.from({ length: 60 }).map((_, i) => (
                    <div
                      key={i}
                      className="raindrop"
                      style={{
                        left: `${Math.random() * 100}vw`,
                        animationDelay: `${Math.random()}s`,
                        animationDuration: `${0.8 + Math.random() * 0.7}s`,
                      }}
                    />
                  ))}
                </div>
              </>
            )}
            <button onClick={() => {
              initializeGame();
              setScreen('home');
            }}>Back to Home</button>
          </div>
        )}
        <div className="game-info-container">
          <div className="game-status">
            <div className="player-indicator" style={{ backgroundColor: getMyColor() === 'red' ? '#ff4444' : '#4444ff' }}>
              {isMyTurn ? 'Your Turn' : `${opponent}'s Turn`}
              <div className="timer" style={{ fontSize: '1.2rem', marginTop: '5px', color: getMyColor() === 'red' ? '#ff4444' : '#4444ff' }}>
                Time left: {timeLeft}s
              </div>
            </div>
            <div className="game-message" style={{ color: getMyColor() === 'red' ? '#ff4444' : '#4444ff' }}>
              {isMyTurn ? 'Select a piece to move.' : `Waiting for ${opponent}'s move...`}
            </div>
          </div>
        </div>
        
        <div className="board-container">
          <div className="board">
            {board.map((row, rowIndex) => (
              <div key={rowIndex} className="row">
                {row.map((piece, colIndex) => {
                  const isSelected = selectedPiece && 
                    selectedPiece[0] === rowIndex && 
                    selectedPiece[1] === colIndex;
                  
                  const isValidMove = validMoves.some(
                    ([r, c]) => r === rowIndex && c === colIndex
                  );
                  
                  const isValidCapture = validCaptures.some(
                    ([r, c]) => r === rowIndex && c === colIndex
                  );
                  
                  return (
                    <div 
                      key={`${rowIndex}-${colIndex}`} 
                      className={`cell ${(rowIndex + colIndex) % 2 === 0 ? 'light' : 'dark'} 
                        ${isSelected ? 'selected' : ''} 
                        ${isValidMove ? 'valid-move' : ''} 
                        ${isValidCapture ? 'valid-capture' : ''}`}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    >
                      {piece && (
                        <div className={`piece ${piece.type} ${piece.color}`}>
                          {piece.type === 'circle' && piece.eatenCount !== undefined && 
                            <span className="eaten-count">{piece.eatenCount}</span>
                          }
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Add ConfettiOverlay component
const ConfettiOverlay = () => {
  const colors = ['#ffd300', '#de561c', '#ff3366', '#4a90e2', '#00c48c', '#ffb900'];
  return (
    <div className="confetti">
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}vw`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            transform: `rotate(${Math.random() * 360}deg)`,
            animationDelay: `${Math.random() * 0.7}s`,
            animationDuration: `${2 + Math.random() * 1.5}s`,
          }}
        />
      ))}
    </div>
  );
};

export default App; 