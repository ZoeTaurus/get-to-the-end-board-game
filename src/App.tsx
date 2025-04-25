import React, { useState, useEffect, useCallback } from 'react';
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
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // Check if user is already logged in from local storage
    const savedLoginState = localStorage.getItem('isLoggedIn');
    return savedLoginState === 'true';
  });
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

  // Handle login
  const handleLogin = (username: string) => {
    const updatedPlayers = {
      ...players,
      red: { ...players.red, username }
    };
    setPlayers(updatedPlayers);
    setIsLoggedIn(true);
    
    // Save to local storage
    localStorage.setItem('players', JSON.stringify(updatedPlayers));
    localStorage.setItem('isLoggedIn', 'true');
    
    initializeGame();
  };

  // Handle logout
  const handleLogout = () => {
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
    
    // Remove login state but keep credentials
    localStorage.removeItem('isLoggedIn');
    
    // Reset the screen to home
    setScreen('home');
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
    if (winner) return;
    
    const piece = board[rowIndex][colIndex];
    
    if (selectedPiece) {
      const [selectedRow, selectedCol] = selectedPiece;
      const selectedPieceData = board[selectedRow][selectedCol];
      
      // Clicking the same piece deselects it
      if (selectedRow === rowIndex && selectedCol === colIndex) {
        setSelectedPiece(null);
        setValidMoves([]);
        setValidCaptures([]);
        setGameMessage(`It's ${players[currentPlayer].username}'s turn. Select a piece to move.`);
        return;
      }
      
      // Clicking another piece of the same color selects it instead
      if (piece && piece.color === selectedPieceData?.color) {
        setSelectedPiece([rowIndex, colIndex]);
        const { moves, captures } = calculateValidMoves(board, rowIndex, colIndex);
        setValidMoves(moves);
        setValidCaptures(captures);
        setGameMessage(`Select where to move the piece.`);
        return;
      }
      
      const isValidMove = validMoves.some(([r, c]) => r === rowIndex && c === colIndex);
      const isValidCapture = validCaptures.some(([r, c]) => r === rowIndex && c === colIndex);
      
      if (isValidMove || isValidCapture) {
        const newBoard = board.map(row => [...row]);
        const movingPiece = {...board[selectedRow][selectedCol]!};
        
        if (isValidCapture) {
          if (movingPiece.type === 'circle') {
            movingPiece.eatenCount = (movingPiece.eatenCount || 0) + 1;
          }
          // Remove the captured piece and place the capturing piece
          newBoard[rowIndex][colIndex] = movingPiece;
          newBoard[selectedRow][selectedCol] = null;
        } else {
          // Regular move
          newBoard[rowIndex][colIndex] = movingPiece;
          newBoard[selectedRow][selectedCol] = null;
        }
        
        setBoard(newBoard);
        setSelectedPiece(null);
        setValidMoves([]);
        setValidCaptures([]);
        
        const winResult = checkWinCondition(newBoard, colIndex);
        if (winResult) {
          return;
        }
        
        const nextPlayer = currentPlayer === 'red' ? 'blue' : 'red';
        setCurrentPlayer(nextPlayer);
        setGameMessage(`It's ${players[nextPlayer].username}'s turn. Select a piece to move.`);
        return;
      }
      
      setSelectedPiece(null);
      setValidMoves([]);
      setValidCaptures([]);
      setGameMessage(`It's ${players[currentPlayer].username}'s turn. Select a piece to move.`);
    } 
    else if (piece && piece.color === currentPlayer) {
      setSelectedPiece([rowIndex, colIndex]);
      const { moves, captures } = calculateValidMoves(board, rowIndex, colIndex);
      setValidMoves(moves);
      setValidCaptures(captures);
      setGameMessage(`Select where to move the piece.`);
    } else {
      setSelectedPiece(null);
      setValidMoves([]);
      setValidCaptures([]);
      setGameMessage(`It's ${players[currentPlayer].username}'s turn. Select a piece to move.`);
    }
  };

  const HomeScreen = () => (
    <div className="home-screen">
      <h1>Get To The End</h1>
      <div className="home-buttons">
        <button onClick={() => setScreen('game')}>Play Game</button>
        <button onClick={() => setScreen('help')}>Help</button>
        <button onClick={handleLogout} className="logout-button">Logout</button>
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