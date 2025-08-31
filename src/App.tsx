import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import LoadingScreen from './components/LoadingScreen';
import ShopScreen from './components/ShopScreen';
import './App.css';
import Login from './Login';
import { GameBot, convertBoardForBot, convertMoveFromBot } from './GameBot.js';

type PieceType = 'person' | 'circle';
type PlayerColor = 'red' | 'blue';
type GameScreen = 'home' | 'game' | 'help' | 'bots' | 'private' | 'shop';

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

// Import the comprehensive translation system
import { getTranslation, languageDisplayNames, languageList } from './translations';

function App() {
  const [screen, setScreen] = useState<GameScreen>('home');
  const [board, setBoard] = useState<(Piece | null)[][]>(
    Array(4).fill(null).map(() => Array(6).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = useState<PlayerColor>('red');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameMode, setGameMode] = useState<'online' | 'bot' | 'local'>('online');
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'normal' | 'hard' | 'pro' | 'wizard'>('easy');
  const [botTimeouts, setBotTimeouts] = useState<{ move: NodeJS.Timeout | null; fallback: NodeJS.Timeout | null }>({ move: null, fallback: null });
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  
  // Private game state
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [privateGameId, setPrivateGameId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isJoiningGame, setIsJoiningGame] = useState(false);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeExpiryTime, setCodeExpiryTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(300); // 5 minutes in seconds
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
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'English';
  });
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem('boardTheme');
    return savedTheme || 'original';
  });

  const handleThemeSelect = (theme: string) => {
    setCurrentTheme(theme);
    localStorage.setItem('boardTheme', theme);
  };

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

    // Private game socket listeners
    socket.on('privateGameJoined', (data) => {
      console.log('Joined private game:', data);
      setWaitingForOpponent(false);
      setIsJoiningGame(false);
      
      // Set up the game
      setPlayers({
        red: { color: 'red', username: data.hostUsername },
        blue: { color: 'blue', username: username || 'Player 2' }
      });
      
      // Don't override gameMode for local games
      if (gameMode !== 'local') {
        setGameMode('online');
      }
      setPrivateGameId(data.gameId); // Set the private game ID
      
      // Initialize the game board with pieces
      initializeGame();
      
      setScreen('game');
      setGameStarted(true);
      setCurrentPlayer('red');
      setIsMyTurn(false); // Host goes first
    });

    socket.on('privateGameCreated', (data) => {
      console.log('Private game created successfully:', data);
      setWaitingForOpponent(true);
    });

    socket.on('privateGameError', (data) => {
      console.error('Private game error:', data);
      setWaitingForOpponent(false);
      setIsJoiningGame(false);
      setIsCreatingGame(false);
      setGeneratedCode('');
      setPrivateGameId('');
      setIsHost(false);
      // You could show an error message to the user here
    });

    socket.on('opponentJoinedPrivateGame', (data) => {
      console.log('Opponent joined private game:', data);
      setWaitingForOpponent(false);
      
      // Start the game
      setPlayers({
        red: { color: 'red', username: username || 'Player 1' },
        blue: { color: 'blue', username: data.opponentUsername }
      });
      
      // Don't override gameMode for local games
      if (gameMode !== 'local') {
        setGameMode('online');
      }
      setPrivateGameId(data.gameId); // Set the private game ID
      
      // Initialize the game board with pieces
      initializeGame();
      
      setScreen('game');
      setGameStarted(true);
      setCurrentPlayer('red');
      setIsMyTurn(true); // Host goes first
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
    
    // Clear bot timeouts
    if (botTimeouts.move) clearTimeout(botTimeouts.move);
    if (botTimeouts.fallback) clearTimeout(botTimeouts.fallback);
    setBotTimeouts({ move: null, fallback: null });
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

  // Generate private game code
  const generateGameCode = useCallback(() => {
    // Generate a random 4-character alphanumeric code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    const charactersLength = characters.length;
    
    for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * charactersLength);
      code += characters.charAt(randomIndex);
    }
    
    const gameId = `private_${Date.now()}`;
    
    setGeneratedCode(code);
    setPrivateGameId(gameId);
    setIsCreatingGame(true);
    setIsHost(true);
    setWaitingForOpponent(true);
    setCodeExpiryTime(Date.now() + 300000);
    setTimeRemaining(300);
    
    socket.emit('createPrivateGame', {
      gameCode: code,
      gameId: gameId,
      hostUsername: username || 'Player 1'
    });
  }, [username, socket]);

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
    
    // Set appropriate game message based on game mode
    if (gameMode === 'local') {
      setGameMessage(getTranslation(language).game.turnMessage.replace('{player}', players.red.username));
    } else {
      setGameMessage(getTranslation(language).game.turnMessage.replace('{player}', players.red.username));
    }
  };



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
          console.log('🎯 CAPTURE: Removing piece at', [rowIndex, colIndex], 'Piece was:', newBoard[rowIndex][colIndex]);
          // Remove the captured piece from the board
          newBoard[rowIndex][colIndex] = null;
          console.log('🎯 CAPTURE: Board after removal:', JSON.stringify(newBoard));
          
          if (movingPiece.type === 'circle') {
            movingPiece.eatenCount = (movingPiece.eatenCount || 0) + 1;
            console.log('🎯 CAPTURE: Updated circle eaten count to:', movingPiece.eatenCount);
          }
        }
        
        // Place the moving piece in the new position
        newBoard[rowIndex][colIndex] = movingPiece;
        newBoard[selectedRow][selectedCol] = null;
        
        // Check for win condition
        const winnerColor = checkWinCondition(newBoard, colIndex);
        
        console.log('Game mode when checking win condition:', gameMode);
        console.log('Winner color detected:', winnerColor);
        
        // If playing against bot, handle locally
        if (gameMode === 'bot') {
          console.log('Executing bot game logic');
          // Clear any existing bot timeouts
          if (botTimeouts.move) clearTimeout(botTimeouts.move);
          if (botTimeouts.fallback) clearTimeout(botTimeouts.fallback);
          
          setBoard(newBoard);
          setSelectedPiece(null);
          setValidMoves([]);
          setValidCaptures([]);
          
          if (winnerColor) {
            // Clear bot timeouts when game ends
            if (botTimeouts.move) clearTimeout(botTimeouts.move);
            if (botTimeouts.fallback) clearTimeout(botTimeouts.fallback);
            setBotTimeouts({ move: null, fallback: null });
            
            setWinner(winnerColor);
            setGameMessage(winnerColor === 'red' ? 'You won!' : 'Bot won!');
            if (winnerColor === 'red') {
              setShowConfetti(true);
            }
          } else {
            // Switch to bot's turn
            setCurrentPlayer('blue');
            setIsMyTurn(false); // Give turn to bot
            
                // Bot makes move after a natural delay to feel more human
    console.log('🤖 Bot turn triggered, thinking...');
            const botMoveTimeout = setTimeout(() => {
      try {
              makeBotMove(botDifficulty, 'blue', false);
      } catch (error) {
        console.log('🤖 Bot crashed, forcing random move');
        forceBotRandomMove('blue', false);
      }
    }, 800 + Math.random() * 400); // 800-1200ms delay, feels natural
    
    // Fallback: if bot doesn't move within 3 seconds, force a move
            const fallbackTimeout = setTimeout(() => {
      console.log('🤖 Bot taking too long, forcing move');
              forceBotRandomMove('blue', false);
    }, 3000);
            
    // Store timeouts to clear if game ends
            setBotTimeouts({ move: botMoveTimeout, fallback: fallbackTimeout });
          }
        } else if (gameMode === 'local') {
          console.log('Executing local game logic');
          // Local same-device play - handle locally
          setBoard(newBoard);
          setSelectedPiece(null);
          setValidMoves([]);
          setValidCaptures([]);
          
          if (winnerColor) {
            console.log('Local game winner detected:', winnerColor);
            console.log('Players state:', players);
            console.log('Setting game message to:', `${players[winnerColor].username} wins!`);
            setWinner(winnerColor);
            setGameMessage(`${players[winnerColor].username} wins!`);
            if (winnerColor === 'red') {
              setShowConfetti(true);
            }
          } else {
            // Switch turns
            const nextPlayer = currentPlayer === 'red' ? 'blue' : 'red';
            setCurrentPlayer(nextPlayer);
            setIsMyTurn(true);
            
            // Update game message for local game
            setGameMessage(getTranslation(language).game.turnMessage.replace('{player}', players[nextPlayer].username));
          }
        } else {
          // Online play - emit move to server
          // Use different handling for private games vs regular games
          const roomId = privateGameId ? privateGameId : gameId;
          socket.emit('makeMove', {
            gameId: roomId,
            move: {
              row: rowIndex,
              col: colIndex,
              selectedPiece: { row: selectedRow, col: selectedCol },
              board: newBoard,
              winner: winnerColor
            }
          });
          
          setBoard(newBoard);
          setSelectedPiece(null);
          setValidMoves([]);
          setValidCaptures([]);
          
          // If there's a winner, emit gameOver
          if (winnerColor) {
            const roomId = privateGameId ? privateGameId : gameId;
            socket.emit('gameOver', { 
              gameId: roomId,
              winner: winnerColor, 
              message: `${players[winnerColor].username} wins!` 
            });
          }
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
  const getMyColor = () => {
    if (gameMode === 'local') {
      // In local mode, red always goes first, so the current player is the one whose turn it is
      return currentPlayer;
    }
    return username === players.red.username ? 'red' : 'blue';
  };

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
          if (isMyTurnRef.current) {
            const otherPlayer = getMyColor() === 'red' ? 'blue' : 'red';
            const roomId = privateGameId ? privateGameId : gameId;
            socket.emit('gameOver', { 
              gameId: roomId,
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
  }, [gameId, players, socket]);

  // Reset timer on turn change and game start (only for online games)
  useEffect(() => {
    if (gameStarted && !winner && gameMode === 'online') {
      resetTimer();
    }
  }, [currentPlayer, gameStarted, winner, resetTimer, gameMode]);

  // Clean up timer on unmount and logout
  useEffect(() => {
    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [timerId]);

  // OLD BOT AI FUNCTIONS - DEPRECATED (Now using GameBot class)
  // Smart move evaluation with prediction
  const findBestMove = (board: (Piece | null)[][], fromRow: number, fromCol: number, piece: Piece, moves: [number, number][], captures: [number, number][], predictionDepth: number, botColor: 'blue'): [number, number] | null => {
    let bestMove: [number, number] | null = null;
    let bestScore = -Infinity;
    
    // Evaluate all possible moves
    for (const [toRow, toCol] of [...moves, ...captures]) {
      const isCapture = captures.some(([r, c]) => r === toRow && c === toCol);
      
      // Simulate the move
      const newBoard = board.map(row => [...row]);
      const movingPiece = {...piece};
      
      if (isCapture && movingPiece.type === 'circle') {
        movingPiece.eatenCount = (movingPiece.eatenCount || 0) + 1;
      }
      
      newBoard[toRow][toCol] = movingPiece;
      newBoard[fromRow][fromCol] = null;
      
      // Check if this move wins immediately
      const winner = checkWinCondition(newBoard, toCol);
      if (winner === botColor) {
        return [toRow, toCol]; // Winning move!
      }
      
      // Calculate move score
      let score = 0;
      
      // Base score for advancing towards goal
      if (toCol > fromCol) score += 2;
      if (toCol === 5) score += 10; // Near goal
      
      // Score for captures
      if (isCapture) score += 3;
      
      // Score for blocking opponent
      if (toCol === 4) score += 1; // Block near goal
      
      // Safety check - avoid moves that put piece in danger
      if (predictionDepth > 0) {
        const dangerScore = evaluateMoveSafety(newBoard, toRow, toCol, botColor, predictionDepth - 1);
        score += dangerScore;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = [toRow, toCol];
      }
    }
    
    return bestMove;
  };
  
  // Evaluate if a move is safe from capture
  const evaluateMoveSafety = (board: (Piece | null)[][], row: number, col: number, pieceColor: 'blue', depth: number): number => {
    if (depth === 0) return 0;
    
    let safetyScore = 0;
    
    // Check if this piece can be captured by opponent
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        const opponentPiece = board[r][c];
        if (opponentPiece && opponentPiece.color !== pieceColor) {
          const { captures } = calculateValidMoves(board, r, c);
          if (captures.some(([cr, cc]) => cr === row && cc === col)) {
            safetyScore -= 5; // Piece can be captured
            
            // Check if we can capture back
            if (depth > 1) {
              const canCaptureBack = canPieceCaptureOpponent(board, row, col, pieceColor);
              if (canCaptureBack) {
                safetyScore += 2; // Can capture back
              }
            }
          }
        }
      }
    }
    
    return safetyScore;
  };
  
  // Check if a piece can capture an opponent
  const canPieceCaptureOpponent = (board: (Piece | null)[][], row: number, col: number, pieceColor: 'blue'): boolean => {
    const piece = board[row][col];
    if (!piece) return false;
    
    const { captures } = calculateValidMoves(board, row, col);
    return captures.length > 0;
  };
  
  // SOPHISTICATED BOT AI FUNCTIONS - DEPRECATED (Now using GameBot class)
  
  // Easy Bot: Basic strategy with some intelligence
  const findEasyBotMove = (board: (Piece | null)[][], fromRow: number, fromCol: number, piece: Piece, moves: [number, number][], captures: [number, number][], botColor: 'blue'): [number, number] | null => {
    // Prefer captures if available (70% chance)
    if (captures.length > 0 && Math.random() < 0.7) {
      // Prefer captures that advance towards the goal
      const advancingCaptures = captures.filter(([r, c]) => c > fromCol);
      if (advancingCaptures.length > 0) {
        return advancingCaptures[Math.floor(Math.random() * advancingCaptures.length)];
      }
      return captures[Math.floor(Math.random() * captures.length)];
    }
    
    // Otherwise, prefer moves that advance towards the goal
    if (moves.length > 0) {
      const advancingMoves = moves.filter(([r, c]) => c > fromCol);
      if (advancingMoves.length > 0) {
        return advancingMoves[Math.floor(Math.random() * advancingMoves.length)];
      }
      return moves[Math.floor(Math.random() * moves.length)];
    }
    
    return null;
  };
  
  // Normal Bot: 3-round prediction with safety analysis
  const findNormalBotMove = (board: (Piece | null)[][], fromRow: number, fromCol: number, piece: Piece, moves: [number, number][], captures: [number, number][], botColor: 'blue', predictionDepth: number): [number, number] | null => {
    let bestMove: [number, number] | null = null;
    let bestScore = -Infinity;
    
    // Check for immediate winning moves first
    for (const [toRow, toCol] of [...moves, ...captures]) {
      const isCapture = captures.some(([r, c]) => r === toRow && c === toCol);
      const newBoard = simulateMove(board, fromRow, fromCol, toRow, toCol, piece, isCapture);
      
      if (checkWinCondition(newBoard, toCol) === botColor) {
        return [toRow, toCol]; // Winning move!
      }
    }
    
    // Evaluate all moves with prediction
    for (const [toRow, toCol] of [...moves, ...captures]) {
      const isCapture = captures.some(([r, c]) => r === toRow && c === toCol);
      const newBoard = simulateMove(board, fromRow, fromCol, toRow, toCol, piece, isCapture);
      
      let score = evaluateMoveScore(newBoard, toRow, toCol, fromCol, isCapture, botColor);
      
      // Add safety analysis
      if (predictionDepth > 0) {
        const safetyScore = evaluateMoveSafety(newBoard, toRow, toCol, botColor, predictionDepth - 1);
        score += safetyScore;
      }
      
      // Add strategic blocking
      if (toCol === 4) { // Near player's goal
        score += 2; // Block opponent
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = [toRow, toCol];
      }
    }
    
    return bestMove;
  };
  
  // Hard Bot: 5-round prediction with advanced tactics
  const findHardBotMove = (board: (Piece | null)[][], fromRow: number, fromCol: number, piece: Piece, moves: [number, number][], captures: [number, number][], botColor: 'blue', predictionDepth: number): [number, number] | null => {
    let bestMove: [number, number] | null = null;
    let bestScore = -Infinity;
    
    // Check for immediate winning moves first
    for (const [toRow, toCol] of [...moves, ...captures]) {
      const isCapture = captures.some(([r, c]) => r === toRow && c === toCol);
      const newBoard = simulateMove(board, fromRow, fromCol, toRow, toCol, piece, isCapture);
      
      if (checkWinCondition(newBoard, toCol) === botColor) {
        return [toRow, toCol]; // Winning move!
      }
    }
    
    // Advanced evaluation with deep prediction
    for (const [toRow, toCol] of [...moves, ...captures]) {
      const isCapture = captures.some(([r, c]) => r === toRow && c === toCol);
      const newBoard = simulateMove(board, fromRow, fromCol, toRow, toCol, piece, isCapture);
      
      let score = evaluateMoveScore(newBoard, toRow, toCol, fromCol, isCapture, botColor);
      
      // Deep safety analysis
      if (predictionDepth > 0) {
        const safetyScore = evaluateMoveSafety(newBoard, toRow, toCol, botColor, predictionDepth - 1);
        score += safetyScore;
        
        // Add tactical analysis
        const tacticalScore = evaluateTacticalPosition(newBoard, toRow, toCol, botColor, predictionDepth - 1);
        score += tacticalScore;
      }
      
      // Strategic positioning
      if (toCol === 4) score += 3; // Block near goal
      if (toCol === 5) score += 15; // Near bot's goal
      
      // Piece coordination
      score += evaluatePieceCoordination(newBoard, toRow, toCol, botColor);
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = [toRow, toCol];
      }
    }
    
    return bestMove;
  };
  
  // Helper function to simulate a move
  const simulateMove = (board: (Piece | null)[][], fromRow: number, fromCol: number, toRow: number, toCol: number, piece: Piece, isCapture: boolean): (Piece | null)[][] => {
    const newBoard = board.map(row => [...row]);
    const movingPiece = {...piece};
    
    if (isCapture && movingPiece.type === 'circle') {
      movingPiece.eatenCount = (movingPiece.eatenCount || 0) + 1;
    }
    
    newBoard[toRow][toCol] = movingPiece;
    newBoard[fromRow][fromCol] = null;
    
    return newBoard;
  };
  
  // Evaluate move score
  const evaluateMoveScore = (board: (Piece | null)[][], toRow: number, toCol: number, fromCol: number, isCapture: boolean, botColor: 'blue'): number => {
    let score = 0;
    
    // Base score for advancing towards goal
    if (toCol > fromCol) score += 3;
    if (toCol === 5) score += 20; // Near goal
    
    // Score for captures
    if (isCapture) score += 8;
    
    // Score for blocking opponent
    if (toCol === 4) score += 5; // Block near goal
    
    return score;
  };
  
  // Evaluate tactical position
  const evaluateTacticalPosition = (board: (Piece | null)[][], row: number, col: number, botColor: 'blue', depth: number): number => {
    if (depth === 0) return 0;
    
    let tacticalScore = 0;
    
    // Check if this position threatens opponent pieces
    const { captures } = calculateValidMoves(board, row, col);
    tacticalScore += captures.length * 2;
    
    // Check if this position protects other bot pieces
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        const piece = board[r][c];
        if (piece && piece.color === botColor) {
          // Check if this position can protect the piece
          if (Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1) {
            tacticalScore += 1;
          }
        }
      }
    }
    
    return tacticalScore;
  };
  

  
  // Evaluate piece coordination
  const evaluatePieceCoordination = (board: (Piece | null)[][], row: number, col: number, botColor: 'blue'): number => {
    let coordinationScore = 0;
    
    // Check if this move creates a defensive formation
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        const piece = board[r][c];
        if (piece && piece.color === botColor) {
          const distance = Math.abs(r - row) + Math.abs(c - col);
          if (distance === 1) {
            coordinationScore += 2; // Adjacent pieces
          } else if (distance === 2) {
            coordinationScore += 1; // Nearby pieces
          }
        }
      }
    }
    
    return coordinationScore;
  };

  // COMPLETELY NEW BOT SYSTEM - 5 DIFFICULTY LEVELS
    // SUPER SMART BOT USING GAMEBOT AI
  const makeBotMove = (difficulty: 'easy' | 'normal' | 'hard' | 'pro' | 'wizard', playerColor: 'blue', isPlayerTurn: boolean) => {
    console.log('🤖 SUPER SMART BOT: Using GameBot AI with difficulty:', difficulty);
    
    // Simple safety check
    if (playerColor !== 'blue' || isPlayerTurn) {
      return;
    }
    
    // Map difficulty to GameBot levels (much smarter!)
    const difficultyMap: { [key: string]: number } = {
      'easy': 3,      // Was basic strategy → Now Hard AI (minimax)
      'normal': 4,    // Was basic strategy → Now Expert AI (deep minimax)
      'hard': 4,      // Was basic strategy → Now Expert AI (deep minimax)
      'pro': 5,       // Was basic strategy → Now Unbeatable AI
      'wizard': 5     // Was basic strategy → Now Unbeatable AI
    };
    
    const botLevel = difficultyMap[difficulty] || 4;
    console.log('🤖 GameBot AI Level:', botLevel);
    
    // Use GameBot AI to choose the best move
    const gameBot = new GameBot(botLevel);
    const botBoard = convertBoardForBot(board);
    const gameState = { 
      board: botBoard, 
      currentPlayer: 'bot' as any // The bot is playing as Player.BOT (blue pieces)
    };
    
    const botMove = gameBot.makeMove(gameState);
    
    if (!botMove) {
      console.log('🤖 GameBot found no valid moves');
      setCurrentPlayer('red');
      setIsMyTurn(true);
      return;
    }
    
    console.log('🤖 GameBot AI chose move:', botMove);
    
    // Convert GameBot move back to our format
    const gameMove = convertMoveFromBot(botMove);
    const [fromRow, fromCol] = gameMove.from;
    const [toRow, toCol] = gameMove.to;
    
    // Get the piece being moved
    const piece = board[fromRow][fromCol];
    if (!piece) {
      console.log('🤖 Error: No piece found at source position');
      return;
    }
    
    // Execute the move with proper capture handling
    setBoard(prevBoard => {
      const updatedBoard = prevBoard.map(row => [...row]);
      const movingPiece = {...piece};
      
      // Handle captures using the GameBot's eatenPiece information (more reliable)
      if (botMove.eatenPiece) {
        const [eatenRow, eatenCol] = [botMove.eatenPiece.row, botMove.eatenPiece.col];
        console.log('🤖 BOT CAPTURE: Removing piece at', [eatenRow, eatenCol], 'Piece was:', updatedBoard[eatenRow][eatenCol]);
        
        // Remove the captured piece from the board
        updatedBoard[eatenRow][eatenCol] = null;
        
          if (movingPiece.type === 'circle') {
            movingPiece.eatenCount = (movingPiece.eatenCount || 0) + 1;
          console.log('🤖 BOT CAPTURE: Updated circle eaten count to:', movingPiece.eatenCount);
        }
      }
      
      // Place the moving piece in the new position AFTER removing captured piece
      updatedBoard[toRow][toCol] = movingPiece;
      updatedBoard[fromRow][fromCol] = null;
      
      // Check for win condition IMMEDIATELY using the updated board (no setTimeout)
      const winnerColor = checkWinCondition(updatedBoard, 0);
        if (winnerColor) {
          setWinner(winnerColor);
          setGameMessage(winnerColor === 'red' ? 'You won!' : 'Bot won!');
          if (winnerColor === 'red') {
            setShowConfetti(true);
          }
        }
      
      return updatedBoard;
    });
    
    // Switch turns like a normal game
    setCurrentPlayer('red');
    setIsMyTurn(true);
  };

  // Force bot to make a random move when it's taking too long
  const forceBotRandomMove = (playerColor: 'blue', isPlayerTurn: boolean) => {
    // Safety check: only move if it's actually the bot's turn
    if (playerColor !== 'blue' || isPlayerTurn) {
      console.log('🤖 Bot tried to force move but it\'s not the bot\'s turn');
      return;
    }
    
    // Additional safety check: prevent multiple bot moves
    if (isMyTurn) {
      console.log('🤖 Force move safety check failed - bot already moved or not bot\'s turn');
      return;
    }
    
    console.log('🤖 Forcing random bot move using GameBot Easy mode');
    
    // Use the GameBot in easy mode for forced moves
    const gameBot = new GameBot(1); // Easy mode = random moves
    
    // Convert your board format to the GameBot's format
    const botBoard = convertBoardForBot(board);
    const gameState = {
      board: botBoard,
      currentPlayer: 'blue' as any // GameBot expects 'blue' for bot
    };
    
    // Get the bot's move
    const botMove = gameBot.makeMove(gameState);
    
    if (!botMove) {
      console.log('🤖 GameBot found no valid moves for forced move');
      setCurrentPlayer('red');
      setIsMyTurn(true);
      return;
    }
    
    // Convert the bot's move back to your game's format
    const gameMove = convertMoveFromBot(botMove);
    const [fromRow, fromCol] = gameMove.from;
    const [toRow, toCol] = gameMove.to;
    
    // Get the piece being moved
    const piece = board[fromRow][fromCol];
    if (!piece) {
      console.log('🤖 Error: No piece found at source position for forced move');
      return;
    }
    
    // Execute the move
      setBoard(prevBoard => {
        const updatedBoard = prevBoard.map(row => [...row]);
        const movingPiece = {...piece};
        
      // Check if this is a capture using the GameBot's eatenPiece information
      if (botMove.eatenPiece) {
        const [eatenRow, eatenCol] = [botMove.eatenPiece.row, botMove.eatenPiece.col];
        console.log('🤖 FORCED BOT CAPTURE: Removing piece at', [eatenRow, eatenCol], 'Piece was:', updatedBoard[eatenRow][eatenCol]);
        
        // Remove the captured piece from the board
        updatedBoard[eatenRow][eatenCol] = null;
        
        if (movingPiece.type === 'circle') {
          movingPiece.eatenCount = (movingPiece.eatenCount || 0) + 1;
        }
      }
      
      // Place the moving piece in the new position
      updatedBoard[toRow][toCol] = movingPiece;
      updatedBoard[fromRow][fromCol] = null;
      
      // Check for win condition INSIDE the callback using the updated board
      const winnerColor = checkWinCondition(updatedBoard, 0);
      
      if (winnerColor) {
        setWinner(winnerColor);
        setGameMessage(winnerColor === 'red' ? 'You won!' : 'Bot won!');
        if (winnerColor === 'red') {
          setShowConfetti(true);
        }
      }
        
        return updatedBoard;
      });
      
      // Switch back to player's turn
      setCurrentPlayer('red');
      setIsMyTurn(true);
      
      // Clear bot timeouts since bot has moved
      if (botTimeouts.move) clearTimeout(botTimeouts.move);
      if (botTimeouts.fallback) clearTimeout(botTimeouts.fallback);
      setBotTimeouts({ move: null, fallback: null });
      
    console.log('🤖 Forced random move completed using GameBot');
  };

  const HomeScreen = () => (
    <div className="home-screen">
      
      {/* Navigation Bar */}
      <div className="nav-bar">
        <div className="nav-option active">
          <span>{getTranslation(language).navigation.home}</span>
        </div>
        {/* Bot functionality temporarily hidden for future update
        <div className="nav-option" onClick={() => setScreen('bots')}>
          <span>{getTranslation(language).navigation.bots}</span>
        </div>
        */}
        <div className="nav-option" onClick={() => setScreen('private')}>
          <span>{getTranslation(language).navigation.private}</span>
        </div>
        <div className="nav-option" onClick={() => setScreen('shop')}>
          <span>🛍️ Shop</span>
        </div>
      </div>
      
      <div className="home-buttons">
        <button type="button" onClick={() => {
          socket.emit('joinQueue', username);
          setIsSearching(true);
        }}>
          {getTranslation(language).game.startGame}
        </button>
        <button type="button" onClick={() => setScreen('help')}>
          {getTranslation(language).help.title}
        </button>
        <button
          type="button"
          onClick={handleLogoutClick}
          className="logout-button"
        >
          {getTranslation(language).game.logout}
        </button>
        <div className="language-select-container">
          <label htmlFor="language-select">{getTranslation(language).login.language}:</label>
          <select 
            id="language-select"
            className="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {languageList.map(lang => (
              <option key={lang} value={lang}>
                {languageDisplayNames[lang]}
              </option>
            ))}
          </select>
        </div>
      </div>
      
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

  const BotsScreen = () => (
    <div className="bots-screen">
      {/* Navigation Bar */}
      <div className="nav-bar">
        <div className="nav-option" onClick={() => setScreen('home')}>
          <span>{getTranslation(language).navigation.home}</span>
        </div>
        <div className="nav-option active">
          <span>{getTranslation(language).navigation.bots}</span>
        </div>
        <div className="nav-option" onClick={() => setScreen('private')}>
          <span>{getTranslation(language).navigation.private}</span>
        </div>
      </div>
      
      <div className="bots-content">
        <h2>Play Against Bots</h2>
        <p>Choose your opponent's difficulty level:</p>
        
        <div className="bot-options">
          <div className="bot-option" onClick={() => {
            // Set up players for bot game
            setPlayers({
              red: { color: 'red', username: username || 'Player 1' },
              blue: { color: 'blue', username: `Bot (${getTranslation(language).bots.easyBot})` }
            });
            // Don't call initializeGame() as it resets currentPlayer
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
            setGameStarted(true);
            setCurrentPlayer('red');
            setIsMyTurn(true); // Player starts first in bot games
            setScreen('game');
            setGameMode('bot');
            setBotDifficulty('easy');
            
            // Set initial game message for bot game
            setGameMessage(getTranslation(language).game.turnMessage.replace('{player}', username || 'Player 1'));
          }}>
            <h3>🤖 {getTranslation(language).bots.easyBot}</h3>
                          <p>{getTranslation(language).bots.easyDescription}</p>
              <p className="bot-description">{getTranslation(language).bots.goodForBeginners}</p>
          </div>
          
          <div className="bot-option" onClick={() => {
            // Set up players for bot game
            setPlayers({
              red: { color: 'red', username: username || 'Player 1' },
              blue: { color: 'blue', username: `Bot (${getTranslation(language).bots.normalBot})` }
            });
            // Don't call initializeGame() as it resets currentPlayer
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
            setGameStarted(true);
            setCurrentPlayer('red');
            setIsMyTurn(true); // Player starts first in bot games
            setScreen('game');
            setGameMode('bot');
            setBotDifficulty('normal');
            
            // Set initial game message for bot game
            setGameMessage(getTranslation(language).game.turnMessage.replace('{player}', username || 'Player 1'));
          }}>
            <h3>🤖 {getTranslation(language).bots.normalBot}</h3>
                          <p>{getTranslation(language).bots.normalDescription}</p>
              <p className="bot-description">{getTranslation(language).bots.challengingButFair}</p>
          </div>
          
          <div className="bot-option" onClick={() => {
            // Set up players for bot game
            setPlayers({
              red: { color: 'red', username: username || 'Player 1' },
              blue: { color: 'blue', username: `Bot (${getTranslation(language).bots.hardBot})` }
            });
            // Don't call initializeGame() as it resets currentPlayer
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
            setGameStarted(true);
            setCurrentPlayer('red');
            setIsMyTurn(true); // Player starts first in bot games
            setScreen('game');
            setGameMode('bot');
            setBotDifficulty('hard');
            
            // Set initial game message for bot game
            setGameMessage(getTranslation(language).game.turnMessage.replace('{player}', username || 'Player 1'));
          }}>
            <h3>🤖 {getTranslation(language).bots.hardBot}</h3>
                          <p>{getTranslation(language).bots.hardDescription}</p>
              <p className="bot-description">{getTranslation(language).bots.forExperiencedPlayers}</p>
          </div>
          
          <div className="bot-option" onClick={() => {
            // Set up players for bot game
            setPlayers({
              red: { color: 'red', username: username || 'Player 1' },
              blue: { color: 'blue', username: `Bot (${getTranslation(language).bots.proBot})` }
            });
            // Don't call initializeGame() as it resets currentPlayer
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
            setGameStarted(true);
            setCurrentPlayer('red');
            setIsMyTurn(true); // Player starts first in bot games
            setScreen('game');
            setGameMode('bot');
            setBotDifficulty('pro');
            
            // Set initial game message for bot game
            setGameMessage(getTranslation(language).game.turnMessage.replace('{player}', username || 'Player 1'));
          }}>
            <h3>🤖 {getTranslation(language).bots.proBot}</h3>
                          <p>{getTranslation(language).bots.proDescription}</p>
              <p className="bot-description">{getTranslation(language).bots.forAdvancedPlayers}</p>
        </div>
        
          <div className="bot-option" onClick={() => {
            // Set up players for bot game
            setPlayers({
              red: { color: 'red', username: username || 'Player 1' },
              blue: { color: 'blue', username: `Bot (${getTranslation(language).bots.wizardBot})` }
            });
            // Don't call initializeGame() as it resets currentPlayer
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
            setGameStarted(true);
            setCurrentPlayer('red');
            setIsMyTurn(true); // Player starts first in bot games
            setScreen('game');
            setGameMode('bot');
            setBotDifficulty('wizard');
            
            // Set initial game message for bot game
            setGameMessage(getTranslation(language).game.turnMessage.replace('{player}', username || 'Player 1'));
          }}>
            <h3>🤖 {getTranslation(language).bots.wizardBot}</h3>
                          <p>{getTranslation(language).bots.wizardDescription}</p>
              <p className="bot-description">{getTranslation(language).bots.forMasterPlayers}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const PrivateScreen = ({ 
    socket, 
    username, 
    generateGameCode,
    generatedCode,
    isCreatingGame,
    waitingForOpponent,
    privateGameId,
    isHost,
    codeExpiryTime,
    timeRemaining
  }: { 
    socket: any; 
    username: string; 
    generateGameCode: () => void;
    generatedCode: string;
    isCreatingGame: boolean;
    waitingForOpponent: boolean;
    privateGameId: string;
    isHost: boolean;
    codeExpiryTime: number | null;
    timeRemaining: number;
  }) => {
      const [gameCode, setGameCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [showNicknameInput, setShowNicknameInput] = useState(false);
  const [opponentNickname, setOpponentNickname] = useState('');
  const [isJoiningGame, setIsJoiningGame] = useState(false);

    const joinGameWithCode = useCallback(() => {
      if (gameCode.length === 4) {
        setIsJoiningGame(true);
        
        // Emit socket event to join private game
        socket.emit('joinPrivateGame', {
          gameCode: gameCode.toUpperCase(),
          username: username || 'Player 2'
        });
        
        console.log('Joining private game with code:', gameCode.toUpperCase());
      }
    }, [gameCode, username]);

    const startSameDeviceGame = useCallback(() => {
      setShowNicknameInput(true);
  }, []);

    const confirmSameDeviceGame = useCallback(() => {
      if (opponentNickname.trim()) {
        // Set up players for same device game
        const playerSetup = {
          red: { color: 'red' as const, username: username || 'Player 1' },
          blue: { color: 'blue' as const, username: opponentNickname }
        };
        console.log('Setting up players for local game:', playerSetup);
        setPlayers(playerSetup);
        
        // Initialize the game board
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
        setGameStarted(true);
        setCurrentPlayer('red');
        setIsMyTurn(true);
        setGameMode('local');
        setScreen('game');
        
        // Set initial game message for local game
        setGameMessage(getTranslation(language).game.turnMessage.replace('{player}', username || 'Player 1'));
        
        setShowNicknameInput(false);
        setOpponentNickname('');
        
        console.log('Starting same device game with opponent:', opponentNickname);
      }
    }, [opponentNickname, username]);

      // Countdown timer for code expiration
      useEffect(() => {
        if (codeExpiryTime && timeRemaining > 0) {
          const timer = setInterval(() => {
            setTimeRemaining(prev => {
              if (prev <= 1) {
                // Code expired
                setGeneratedCode('');
                setIsCreatingGame(false);
                setWaitingForOpponent(false);
                setPrivateGameId('');
                setIsHost(false);
                setCodeExpiryTime(null);
                setTimeRemaining(300);
                
                // Emit cancel event to server
                if (privateGameId) {
                  socket.emit('cancelPrivateGame', { gameId: privateGameId });
                }
                
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
          return () => clearInterval(timer);
        }
      }, [codeExpiryTime, timeRemaining, privateGameId]);

      return (
        <div className="private-screen">
        {/* Navigation Bar */}
        <div className="nav-bar">
          <div className="nav-option" onClick={() => setScreen('home')}>
            <span>{getTranslation(language).navigation.home}</span>
          </div>
          {/* Bot functionality temporarily hidden for future update
          <div className="nav-option" onClick={() => setScreen('bots')}>
            <span>{getTranslation(language).navigation.bots}</span>
          </div>
          */}
          <div className="nav-option active">
            <span>{getTranslation(language).navigation.private}</span>
          </div>
        </div>
        
        <div className="private-content">
          <h2>{getTranslation(language).private.title}</h2>
          <p>{getTranslation(language).private.subtitle}</p>
          
          {/* Game Code Input Section */}
          <div className="game-code-section">
            <h3>{getTranslation(language).private.enterGameCode}</h3>
            <div className="code-input-container">
              <input
                type="text"
                placeholder=""
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase().slice(0, 4))}
                maxLength={4}
                className="code-input"
              />
              <button 
                onClick={joinGameWithCode}
                disabled={gameCode.length !== 4}
                className="join-code-button"
              >
                {getTranslation(language).private.joinGame}
        </button>
            </div>
          </div>

          {/* Game Options */}
          <div className="private-options">
            <div className="private-option" onClick={!generatedCode ? generateGameCode : undefined}>
              {!generatedCode ? (
                <div>
                  <h3>🎮 {getTranslation(language).private.generateGameCode}</h3>
                  <p>{getTranslation(language).private.createNewGame}</p>
                  <p className="private-description">{getTranslation(language).private.generateCodeDescription}</p>
                </div>
              ) : (
                <div>
                  <h3>🎮 {getTranslation(language).private.gameCreated}</h3>
                  <p>{getTranslation(language).private.shareCodeWithFriend}</p>
                  <div className="generated-code">
                    <strong>{getTranslation(language).private.gameCode}: {generatedCode}</strong>
                    {waitingForOpponent && (
                      <p className="waiting-message">⏳ {getTranslation(language).game.waitingForOpponent}</p>
                    )}
                    {timeRemaining > 0 && (
                      <p className="timer-message">⏰ {getTranslation(language).private.codeExpiresIn} {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</p>
                    )}
                    <button 
                      onClick={() => {
                        // Store the game ID before clearing state
                        const gameIdToCancel = privateGameId;
                        
                        // Clear local state
                        setGeneratedCode('');
                        setIsCreatingGame(false);
                        setWaitingForOpponent(false);
                        setPrivateGameId('');
                        setIsHost(false);
                        setCodeExpiryTime(null);
                        setTimeRemaining(300);
                        
                        // Emit cancel event to server with the stored game ID
                        if (gameIdToCancel) {
                          socket.emit('cancelPrivateGame', { gameId: gameIdToCancel });
                        }
                        
                        // Clear any existing timers
                        if (timerId) {
                          clearInterval(timerId);
                          setTimerId(null);
                        }
                      }}
                      className="cancel-code-button"
                    >
                      {getTranslation(language).private.cancel}
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="private-option" onClick={startSameDeviceGame}>
              <h3>📱 {getTranslation(language).private.playOnSameDevice}</h3>
              <p>{getTranslation(language).private.playWithSomeoneOnDevice}</p>
              <p className="private-description">{getTranslation(language).private.noAccountNeeded}</p>
            </div>
          </div>

          {/* Nickname Input Modal */}
          {showNicknameInput && (
            <div className="nickname-modal-overlay">
              <div className="nickname-modal">
                <h3>{getTranslation(language).private.enterOpponentsNickname}</h3>
                <p>{getTranslation(language).private.nicknameNotSaved}</p>
                <input
                  type="text"
                  placeholder={getTranslation(language).private.opponentsNickname}
                  value={opponentNickname}
                  onChange={(e) => setOpponentNickname(e.target.value)}
                  className="nickname-input"
                />
                <div className="nickname-modal-buttons">
                  <button onClick={confirmSameDeviceGame} className="confirm-button">
                    {getTranslation(language).private.startGame}
                  </button>
                  <button onClick={() => {
                    setShowNicknameInput(false);
                    setOpponentNickname('');
                  }} className="cancel-button">
                    {getTranslation(language).private.cancel}
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
  };

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
          {getTranslation(language).game.backToHome}
        </button>
      </div>
    </div>
  );

  // Show loading screen when searching for opponent
  if (isSearching) {
    return <LoadingScreen language={language} />;
  }

  // If not logged in, show login screen
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} language={language} />;
  }

  // Show different screens based on state
  if (screen === 'home') {
    return <HomeScreen />;
  }

  if (screen === 'help') {
    return <HelpScreen />;
  }

  if (screen === 'shop') {
    return (
      <ShopScreen
        language={language}
        currentTheme={currentTheme}
        onThemeSelect={handleThemeSelect}
        onBack={() => setScreen('home')}
      />
    );
  }

  if (screen === 'bots') {
    return <BotsScreen />;
  }

  if (screen === 'private') {
            return <PrivateScreen 
          socket={socket} 
          username={username} 
          generateGameCode={generateGameCode}
          generatedCode={generatedCode}
          isCreatingGame={isCreatingGame}
          waitingForOpponent={waitingForOpponent}
          privateGameId={privateGameId}
          isHost={isHost}
          codeExpiryTime={codeExpiryTime}
          timeRemaining={timeRemaining}
        />;
  }

  // Game screen (existing game content)
  return (
    <div className="app">
      <div className="game-content">
        {winner && (
          <div className="winner-announcement">
            {gameMode === 'local' ? (
              <>
                <h2 style={{ color: winner === 'red' ? '#ff4444' : '#4444ff' }}>
                  {`${players[winner].username} wins!`}
                </h2>
                {showConfetti && <ConfettiOverlay />}
              </>
            ) : (
              winner === getMyColor() ? (
                <>
                  <h2 style={{ color: winner === 'red' ? '#ff4444' : '#4444ff' }}>
                    {getTranslation(language).game.youWin}
                  </h2>
                  {showConfetti && <ConfettiOverlay />}
                </>
              ) : (
                <>
                  <h2 style={{ color: '#888' }}>{getTranslation(language).game.youLose}</h2>
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
              )
            )}
            <button onClick={() => {
              initializeGame();
              setScreen('home');
            }}>{getTranslation(language).game.backToHome}</button>
          </div>
        )}
        <div className="game-info-container">
          <div className="game-status">
            <div className="player-indicator" style={{ backgroundColor: getMyColor() === 'red' ? '#ff4444' : '#4444ff' }}>
              {gameMode === 'local'
                ? `${currentPlayer === 'red' ? players.red.username : players.blue.username} ${getTranslation(language).game.opponentTurn}`
                : (isMyTurn
                  ? getTranslation(language).game.yourTurn
                  : (gameMode === 'bot'
                      ? getTranslation(language).game.opponentTurn.replace('{opponent}', 'Bot')
                      : getTranslation(language).game.opponentTurn.replace('{opponent}', opponent)
                    )
                  )
              }
              {gameMode === 'online' && (
                <div className="timer" style={{ fontSize: '1.2rem', marginTop: '5px', color: getMyColor() === 'red' ? '#ff4444' : '#4444ff' }}>
                  {getTranslation(language).game.timeLeft.replace('{seconds}', timeLeft.toString())}
                </div>
              )}
            </div>
            <div className="game-message" style={{ color: getMyColor() === 'red' ? '#ff4444' : '#4444ff' }}>
              {isMyTurn ? getTranslation(language).game.selectPiece : (
                gameMode === 'bot' ? getTranslation(language).game.waitingForOpponent : 
                gameMode === 'local' ? getTranslation(language).game.waitingForMove.replace('{opponent}', currentPlayer === 'red' ? players.red.username : players.blue.username) :
                                  getTranslation(language).game.waitingForMove.replace('{opponent}', opponent)
              )}
            </div>
          </div>
        </div>
        
        <div className="board-container">
          <div className={`board theme-${currentTheme}`}>
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