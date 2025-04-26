import React, { useState, useEffect, useCallback } from 'react';
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
      const { row, col, selectedPiece, board: newBoardState } = data.move;
      
      // Update the entire board state
      if (newBoardState) {
        setBoard(newBoardState);
      } else {
        // Fallback to manual move if board state isn't provided
        const newBoard = board.map(r => [...r]);
        if (selectedPiece && selectedPiece.row !== undefined && selectedPiece.col !== undefined) {
          const movingPiece = {...newBoard[selectedPiece.row][selectedPiece.col]!};
          
          // Check if it's a capture move
          if (newBoard[row][col]) {
            if (movingPiece.type === 'circle') {
              movingPiece.eatenCount = (movingPiece.eatenCount || 0) + 1;
            }
          }
          
          newBoard[row][col] = movingPiece;
          newBoard[selectedPiece.row][selectedPiece.col] = null;
          setBoard(newBoard);
        }
      }

      // Clear selection states
      setSelectedPiece(null);
      setValidMoves([]);
      setValidCaptures([]);
      
      // Check for win condition first
      const hasWinner = checkWinCondition(board, col);
      
      // Only update turn state if there's no winner
      if (!hasWinner) {
        // Update turn state
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

    return () => {
      socket.off('waiting');
      socket.off('gameStart');
      socket.off('moveMade');
      socket.off('playerDisconnected');
    };
  }, [board, currentPlayer, username, opponent]);

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
    // Reset all game states
    setIsLoggedIn(false);
    setGameStarted(false);
    setWinner(null);
    setSelectedPiece(null);
    setValidMoves([]);
    setValidCaptures([]);
    setGameMessage('');
    setShowConfetti(false);
    
    // Reset players but keep the structure
    setPlayers({
      red: { color: 'red', username: '' },
      blue: { color: 'blue', username: 'Player 2' }
    });
    
    // Remove login state
    localStorage.removeItem('isLoggedIn');
    
    // Reset the screen to home and close the confirmation dialog
    setScreen('home');
    setShowLogoutConfirm(false);
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

  // Function to create confetti elements
  const createConfetti = useCallback(() => {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    document.body.appendChild(confetti);

    for (let i = 0; i < 100; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.backgroundColor = ['#ffd300', '#de561c', '#ff3366', '#4a90e2'][Math.floor(Math.random() * 4)];
      piece.style.animationDelay = `${Math.random() * 3}s`;
      confetti.appendChild(piece);
    }

    setTimeout(() => {
      document.body.removeChild(confetti);
    }, 5000);
  }, []);

  useEffect(() => {
    if (winner) {
      createConfetti();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [winner, createConfetti]);

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

    if (blueWin || redWin) {
      const winner = blueWin ? 'blue' : 'red';
      setWinner(winner);
      setGameMessage(`${players[winner].username} WINS by reaching the end!`);
      return true;
    }

    // Check for capturing all opponent pieces
    const bluePiecesExist = newBoard.flat().some(cell => cell && cell.color === 'blue');
    const redPiecesExist = newBoard.flat().some(cell => cell && cell.color === 'red');

    if (!bluePiecesExist) {
      setWinner('red');
      setGameMessage(`${players['red'].username} WINS by capturing all opponent pieces!`);
      return true;
    }

    if (!redPiecesExist) {
      setWinner('blue');
      setGameMessage(`${players['blue'].username} WINS by capturing all opponent pieces!`);
      return true;
    }

    return false;
  };

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    if (!gameStarted || !isMyTurn || winner) return;
    
    const piece = board[rowIndex][colIndex];
    
    // Only allow selecting and moving pieces of your color
    const myColor = username === players.red.username ? 'red' : 'blue';
    
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
        
        // Check for win condition before emitting move
        const hasWinner = checkWinCondition(newBoard, colIndex);
        
        // Emit move to server with full board state
        socket.emit('makeMove', {
          gameId,
          move: {
            row: rowIndex,
            col: colIndex,
            selectedPiece: { row: selectedRow, col: selectedCol },
            board: newBoard
          }
        });
        
        setBoard(newBoard);
        setSelectedPiece(null);
        setValidMoves([]);
        setValidCaptures([]);
        
        // Only update turn state if there's no winner
        if (!hasWinner) {
          setIsMyTurn(false);
          setCurrentPlayer(prev => prev === 'red' ? 'blue' : 'red');
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

  // Add timer reset function
  const resetTimer = useCallback(() => {
    setTimeLeft(30);
    if (timerId) {
      clearInterval(timerId);
    }
    const newTimerId = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          // Time's up - end game and declare other player as winner
          const otherPlayer = currentPlayer === 'red' ? 'blue' : 'red';
          setWinner(otherPlayer);
          setGameMessage(`${players[otherPlayer].username} WINS by timeout!`);
          clearInterval(newTimerId);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    setTimerId(newTimerId);
  }, [currentPlayer, players]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [timerId]);

  // Reset timer on turn change
  useEffect(() => {
    if (gameStarted && !winner) {
      resetTimer();
    }
  }, [currentPlayer, gameStarted, winner, resetTimer]);

  // Stop timer when game ends
  useEffect(() => {
    if (winner && timerId) {
      clearInterval(timerId);
    }
  }, [winner, timerId]);

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
            <h2 style={{ color: winner === 'red' ? '#ff4444' : '#4444ff' }}>
              {players[winner].username} WINS!
            </h2>
            <button onClick={() => {
              initializeGame();
              setScreen('home');
            }}>Back to Home</button>
          </div>
        )}
        <div className="game-info-container">
          <div className="game-status">
            <div className="player-indicator" style={{ backgroundColor: currentPlayer === 'red' ? '#ff4444' : '#4444ff' }}>
              {isMyTurn ? 'Your Turn' : `${opponent}'s Turn`}
              <div className="timer" style={{ fontSize: '1.2rem', marginTop: '5px' }}>
                Time left: {timeLeft}s
              </div>
            </div>
            <div className="game-message" style={{ color: currentPlayer === 'red' ? '#ff4444' : '#4444ff' }}>
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

export default App; 