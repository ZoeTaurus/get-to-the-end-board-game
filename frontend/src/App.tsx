import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Login from './Login';

type PlayerColor = 'red' | 'blue';
type PieceType = 'person' | 'circle';
type Screen = 'home' | 'game' | 'login' | 'help';

interface Player {
  username: string;
  color: PlayerColor;
}


interface Position {
  row: number;
  col: number;
}

interface Piece {
  type: PieceType;
  color: PlayerColor;
  eatenCount: number;
}

const App: React.FC = () => {
  // Game state
  const [board, setBoard] = useState<(Piece | null)[][]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerColor>('red');
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [validCaptures, setValidCaptures] = useState<Position[]>([]);
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameMessage, setGameMessage] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Player state
  const [players, setPlayers] = useState<Record<PlayerColor, Player>>({
    red: { username: '', color: 'red' },
    blue: { username: '', color: 'blue' }
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [screen, setScreen] = useState<Screen>('home');

  // Initialize game when it starts
  const initializeGame = useCallback(() => {
    const newBoard: (Piece | null)[][] = Array(4).fill(null).map(() => Array(6).fill(null));
    
    // Initialize red pieces (left side)
    newBoard[0][0] = { type: 'person', color: 'red', eatenCount: 0 };
    newBoard[1][0] = { type: 'person', color: 'red', eatenCount: 0 };
    newBoard[2][0] = { type: 'person', color: 'red', eatenCount: 0 };
    newBoard[3][0] = { type: 'circle', color: 'red', eatenCount: 0 };
    
    // Initialize blue pieces (right side)
    newBoard[0][5] = { type: 'person', color: 'blue', eatenCount: 0 };
    newBoard[1][5] = { type: 'person', color: 'blue', eatenCount: 0 };
    newBoard[2][5] = { type: 'person', color: 'blue', eatenCount: 0 };
    newBoard[3][5] = { type: 'circle', color: 'blue', eatenCount: 0 };
    
    setBoard(newBoard);
    setCurrentPlayer('red');
    setSelectedPiece(null);
    setValidMoves([]);
    setValidCaptures([]);
    setWinner(null);
    setGameMessage(`${players.red.username}'s turn`);
    setShowConfetti(false);
  }, [players]);

  useEffect(() => {
    if (gameStarted) {
      initializeGame();
    }
  }, [gameStarted, initializeGame]);

  // Handle confetti cleanup
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  const handleLogin = (username: string) => {
    if (!username.trim()) {
      alert('Please enter a valid username');
      return;
    }
    
    const updatedPlayers = {
      ...players,
      red: { ...players.red, username }
    };
    setPlayers(updatedPlayers);
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('players', JSON.stringify(updatedPlayers));
    setScreen('home');
  };

  const startGame = () => {
    setGameStarted(true);
    setScreen('game');
  };

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
  const calculateValidMoves = (row: number, col: number, piece: Piece): { moves: Position[], captures: Position[] } => {
    const moves: Position[] = [];
    const captures: Position[] = [];
    
    // Define all possible directions
    const personMoveDirections = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // up, down, left, right
    const personCaptureDirections = [[-1, -1], [-1, 1], [1, -1], [1, 1]]; // diagonals
    const circleDirections = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
    
    // Check captures first (since they take priority)
    if (piece.eatenCount < 2) { // Only check captures if the piece hasn't eaten 2 pieces yet
      const captureDirections = piece.type === 'person' ? personCaptureDirections : circleDirections;
      for (const [dx, dy] of captureDirections) {
        const newRow = row + dx;
        const newCol = col + dy;
        
        if (isValidPosition(newRow, newCol)) {
          const targetPiece = board[newRow][newCol];
          if (targetPiece && targetPiece.color !== piece.color) {
            captures.push({ row: newRow, col: newCol });
          }
        }
      }
    }
    
    // Then check moves if no captures are available
    if (captures.length === 0) {
      const moveDirections = piece.type === 'person' ? personMoveDirections : circleDirections;
      for (const [dx, dy] of moveDirections) {
        const newRow = row + dx;
        const newCol = col + dy;
        
        if (isValidPosition(newRow, newCol) && !board[newRow][newCol]) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }
    
    return { moves, captures };
  };

  const isValidPosition = (row: number, col: number): boolean => {
    return row >= 0 && row < 4 && col >= 0 && col < 6;
  };

  // Check win conditions
  const checkWinCondition = (board: (Piece | null)[][]): PlayerColor | null => {
    // Check if any piece has eaten 2 pieces
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        const piece = board[row][col];
        if (piece && piece.eatenCount >= 2) {
          return piece.color;
        }
      }
    }
    return null;
  };


  const handleCellClick = (row: number, col: number) => {
    if (winner || !gameStarted) return;

    const clickedPiece = board[row][col];
    
    // If a piece is already selected
    if (selectedPiece) {
      // If clicking the same piece, deselect it
      if (selectedPiece.row === row && selectedPiece.col === col) {
        setSelectedPiece(null);
        setValidMoves([]);
        setValidCaptures([]);
        return;
      }

      // Check if the clicked cell is a valid move
      const isValidMove = validMoves.some(move => move.row === row && move.col === col);
      const isValidCapture = validCaptures.some(capture => capture.row === row && capture.col === col);

      if (isValidMove || isValidCapture) {
        const newBoard = board.map(r => [...r]);
        
        // Move the piece
        const piece = newBoard[selectedPiece.row][selectedPiece.col];
        if (!piece) return;
        
        newBoard[row][col] = piece;
        newBoard[selectedPiece.row][selectedPiece.col] = null;

        // Handle capture
        if (isValidCapture) {
          piece.eatenCount = (piece.eatenCount || 0) + 1;
        }

        setBoard(newBoard);
        setSelectedPiece(null);
        setValidMoves([]);
        setValidCaptures([]);

        // Check for win condition
        const winningColor = checkWinCondition(newBoard);
        if (winningColor) {
          setWinner(winningColor);
          setGameMessage(`${players[winningColor].username} wins!`);
          return;
        }

        // Switch turns
        const nextPlayer = currentPlayer === 'red' ? 'blue' : 'red';
        setCurrentPlayer(nextPlayer);
        setGameMessage(`It's ${players[nextPlayer].username}'s turn`);
      }
      return;
    }

    // If no piece is selected yet
    if (clickedPiece && clickedPiece.color === currentPlayer) {
      setSelectedPiece({ row, col });
      const { moves, captures } = calculateValidMoves(row, col, clickedPiece);
      setValidMoves(moves);
      setValidCaptures(captures);
    }
  };

  const HomeScreen = () => (
    <div className="home-screen">
      <h1>Get To The End</h1>
      <div className="home-buttons">
        <button onClick={startGame}>Play Game</button>
        <button onClick={() => setScreen('help')}>Help</button>
      </div>
      <p className="coming-soon">More stuff coming soon!</p>
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
              {players[currentPlayer].username}'s Turn
            </div>
            <div className="game-message">{gameMessage}</div>
          </div>
        </div>
        
        <div className="board-container">
          <div className="board">
            {board.map((row, rowIndex) => (
              <div key={rowIndex} className="row">
                {row.map((cell, colIndex) => {
                  const isSelected = selectedPiece && 
                    selectedPiece.row === rowIndex && 
                    selectedPiece.col === colIndex;
                  
                  const isValidMove = validMoves.some(
                    move => move.row === rowIndex && move.col === colIndex
                  );
                  
                  const isValidCapture = validCaptures.some(
                    capture => capture.row === rowIndex && capture.col === colIndex
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
                      {cell && (
                        <div className={`piece ${cell.type} ${cell.color}`}>
                          {cell.type === 'circle' && cell.eatenCount !== undefined && 
                            <span className="eaten-count">{cell.eatenCount}</span>
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