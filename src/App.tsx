import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import LoadingScreen from './components/LoadingScreen';
import './App.css';
import Login from './Login';

type PieceType = 'person' | 'circle';
type PlayerColor = 'red' | 'blue';
type GameScreen = 'home' | 'game' | 'help' | 'bots';

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

// Add translations
const translations = {
  en: {
    playGame: 'Play Game',
    help: 'Help',
    logout: 'Logout',
    selectLanguage: 'Select Language:',
    moreComingSoon: 'More stuff coming soon!',
    yourTurn: 'Your Turn',
    opponentTurn: (name: string) => `${name}'s Turn`,
    selectPiece: 'Select a piece to move.',
    waitingForMove: (name: string) => `Waiting for ${name}'s move...`,
    timeLeft: (time: number) => `Time left: ${time}s`,
    youWon: 'You WON!!!!',
    youLost: 'Sorry, you lost.',
    backToHome: 'Back to Home'
  },
  zh: {
    playGame: '开始游戏',
    help: '帮助',
    logout: '退出',
    selectLanguage: '选择语言:',
    moreComingSoon: '更多内容即将推出！',
    yourTurn: '轮到你了',
    opponentTurn: (name: string) => `${name}的回合`,
    selectPiece: '选择一个棋子移动。',
    waitingForMove: (name: string) => `等待${name}移动...`,
    timeLeft: (time: number) => `剩余时间: ${time}秒`,
    youWon: '你赢了！',
    youLost: '抱歉，你输了。',
    backToHome: '返回主页'
  },
  pt: {
    playGame: 'Jogar',
    help: 'Ajuda',
    logout: 'Sair',
    selectLanguage: 'Selecione o idioma:',
    moreComingSoon: 'Mais em breve!',
    yourTurn: 'Sua vez',
    opponentTurn: (name: string) => `Vez de ${name}`,
    selectPiece: 'Selecione uma peça para mover.',
    waitingForMove: (name: string) => `Aguardando ${name} mover...`,
    timeLeft: (time: number) => `Tempo restante: ${time}s`,
    youWon: 'Você GANHOU!',
    youLost: 'Desculpe, você perdeu.',
    backToHome: 'Voltar ao Início'
  },
  th: {
    playGame: 'เริ่มเกม',
    help: 'ช่วยเหลือ',
    logout: 'ออกจากระบบ',
    selectLanguage: 'เลือกภาษา:',
    moreComingSoon: 'เร็วๆ นี้จะมีเพิ่มเติม!',
    yourTurn: 'ตาคุณ',
    opponentTurn: (name: string) => `ตาของ ${name}`,
    selectPiece: 'เลือกตัวหมากที่จะเดิน',
    waitingForMove: (name: string) => `รอ ${name} เดิน...`,
    timeLeft: (time: number) => `เวลาที่เหลือ: ${time} วินาที`,
    youWon: 'คุณชนะ!',
    youLost: 'เสียใจด้วย คุณแพ้',
    backToHome: 'กลับหน้าแรก'
  },
  ar: {
    playGame: 'ابدأ اللعبة',
    help: 'مساعدة',
    logout: 'تسجيل الخروج',
    selectLanguage: 'اختر اللغة:',
    moreComingSoon: 'المزيد قريباً!',
    yourTurn: 'دورك',
    opponentTurn: (name: string) => `دور ${name}`,
    selectPiece: 'اختر قطعة للتحرك.',
    waitingForMove: (name: string) => `في انتظار تحرك ${name}...`,
    timeLeft: (time: number) => `الوقت المتبقي: ${time} ثانية`,
    youWon: 'لقد فزت!',
    youLost: 'عذراً، لقد خسرت.',
    backToHome: 'العودة للصفحة الرئيسية'
  }
};

function App() {
  const [screen, setScreen] = useState<GameScreen>('home');
  const [board, setBoard] = useState<(Piece | null)[][]>(
    Array(4).fill(null).map(() => Array(6).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = useState<PlayerColor>('red');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameMode, setGameMode] = useState<'online' | 'bot'>('online');
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'normal' | 'hard'>('easy');
  const [botTimeouts, setBotTimeouts] = useState<{ move: NodeJS.Timeout | null; fallback: NodeJS.Timeout | null }>({ move: null, fallback: null });
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
  const [language, setLanguage] = useState('en');

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
        
        // If playing against bot, handle locally
        if (gameMode === 'bot') {
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
            
            // Bot makes move after 300ms, with 10-second fallback
            const botMoveTimeout = setTimeout(() => {
              makeBotMove(botDifficulty);
            }, 300);
            
            // Fallback: if bot doesn't move within 10 seconds, force a random move
            const fallbackTimeout = setTimeout(() => {
              console.log('🤖 Bot taking too long, forcing random move');
              forceBotRandomMove();
            }, 10000);
            
            // Store timeouts to clear them if game ends
            setBotTimeouts({ move: botMoveTimeout, fallback: fallbackTimeout });
          }
        } else {
          // Online play - emit move to server
          socket.emit('makeMove', {
            gameId,
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
            socket.emit('gameOver', { 
              gameId, 
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

  // Bot AI Logic
  const makeBotMove = (difficulty: 'easy' | 'normal' | 'hard') => {
    console.log('🤖 Bot making move with difficulty:', difficulty);
    const botColor = 'blue'; // Bot always plays as blue
    const botPieces: [number, number][] = [];
    
    // Find all bot pieces
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[0].length; col++) {
        if (board[row][col] && board[row][col]?.color === botColor) {
          botPieces.push([row, col]);
        }
      }
    }
    
    console.log('🤖 Found bot pieces:', botPieces);
    if (botPieces.length === 0) return;
    
    // Select a random bot piece
    const randomPieceIndex = Math.floor(Math.random() * botPieces.length);
    const [selectedRow, selectedCol] = botPieces[randomPieceIndex];
    const piece = board[selectedRow][selectedCol];
    
    if (!piece) return;
    
    const { moves, captures } = calculateValidMoves(board, selectedRow, selectedCol);
    
    // Bot decision making based on difficulty
    let targetMove: [number, number] | null = null;
    
    if (difficulty === 'easy') {
      // Easy bot: Random moves, prefers captures if available
      if (captures.length > 0 && Math.random() < 0.7) {
        targetMove = captures[Math.floor(Math.random() * captures.length)];
      } else if (moves.length > 0) {
        targetMove = moves[Math.floor(Math.random() * moves.length)];
      }
    } else if (difficulty === 'normal') {
      // Normal bot: Smarter moves, tries to advance towards goal
      if (captures.length > 0) {
        // Prefer captures that advance towards the right
        const advancingCaptures = captures.filter(([r, c]) => c > selectedCol);
        if (advancingCaptures.length > 0) {
          targetMove = advancingCaptures[Math.floor(Math.random() * advancingCaptures.length)];
        } else {
          targetMove = captures[Math.floor(Math.random() * captures.length)];
        }
      } else if (moves.length > 0) {
        // Prefer moves that advance towards the right
        const advancingMoves = moves.filter(([r, c]) => c > selectedCol);
        if (advancingMoves.length > 0) {
          targetMove = advancingMoves[Math.floor(Math.random() * advancingMoves.length)];
        } else {
          targetMove = moves[Math.floor(Math.random() * moves.length)];
        }
      }
    } else if (difficulty === 'hard') {
      // Hard bot: Strategic moves, prioritizes winning moves
      // Check for immediate win moves
      for (const [r, c] of [...moves, ...captures]) {
        const newBoard = board.map(row => [...row]);
        const movingPiece = {...piece};
        
        if (captures.some(([cr, cc]) => cr === r && cc === c)) {
          if (movingPiece.type === 'circle') {
            movingPiece.eatenCount = (movingPiece.eatenCount || 0) + 1;
          }
        }
        
        newBoard[r][c] = movingPiece;
        newBoard[selectedRow][selectedCol] = null;
        
        // Check if this move wins
        const winner = checkWinCondition(newBoard, c);
        if (winner === botColor) {
          targetMove = [r, c];
          break;
        }
      }
      
      // If no winning move, use normal bot logic
      if (!targetMove) {
        if (captures.length > 0) {
          const advancingCaptures = captures.filter(([r, c]) => c > selectedCol);
          if (advancingCaptures.length > 0) {
            targetMove = advancingCaptures[Math.floor(Math.random() * advancingCaptures.length)];
          } else {
            targetMove = captures[Math.floor(Math.random() * captures.length)];
          }
        } else if (moves.length > 0) {
          const advancingMoves = moves.filter(([r, c]) => c > selectedCol);
          if (advancingMoves.length > 0) {
            targetMove = advancingMoves[Math.floor(Math.random() * advancingMoves.length)];
          } else {
            targetMove = moves[Math.floor(Math.random() * moves.length)];
          }
        }
      }
    }
    
    // Execute the move
    if (targetMove) {
      console.log('🤖 Bot executing move:', targetMove);
      const [targetRow, targetCol] = targetMove;
      const newBoard = board.map(row => [...row]);
      const movingPiece = {...piece};
      
      const isCapture = captures.some(([r, c]) => r === targetRow && c === targetCol);
      if (isCapture && movingPiece.type === 'circle') {
        movingPiece.eatenCount = (movingPiece.eatenCount || 0) + 1;
      }
      
      newBoard[targetRow][targetCol] = movingPiece;
      newBoard[selectedRow][selectedCol] = null;
      
      // Check for win condition
      const winnerColor = checkWinCondition(newBoard, targetCol);
      
      setBoard(newBoard);
      setCurrentPlayer('red');
      
      if (winnerColor) {
        setWinner(winnerColor);
        setGameMessage(winnerColor === 'red' ? 'You won!' : 'Bot won!');
        if (winnerColor === 'red') {
          setShowConfetti(true);
        }
      }
    } else {
      console.log('🤖 No valid move found for bot');
    }
  };

  // Force bot to make a random move when it's taking too long
  const forceBotRandomMove = () => {
    console.log('🤖 Forcing random bot move');
    const botColor = 'blue';
    const botPieces: [number, number][] = [];
    
    // Find all bot pieces
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[0].length; col++) {
        if (board[row][col] && board[row][col]?.color === botColor) {
          botPieces.push([row, col]);
        }
      }
    }
    
    if (botPieces.length === 0) return;
    
    // Pick a random piece and make a random valid move
    const randomPieceIndex = Math.floor(Math.random() * botPieces.length);
    const [selectedRow, selectedCol] = botPieces[randomPieceIndex];
    const piece = board[selectedRow][selectedCol];
    
    if (!piece) return;
    
    const { moves, captures } = calculateValidMoves(board, selectedRow, selectedCol);
    const allOptions = [...moves, ...captures];
    
    if (allOptions.length > 0) {
      const randomMove = allOptions[Math.floor(Math.random() * allOptions.length)];
      const [targetRow, targetCol] = randomMove;
      
      const newBoard = board.map(row => [...row]);
      const movingPiece = {...piece};
      
      const isCapture = captures.some(([r, c]) => r === targetRow && c === targetCol);
      if (isCapture && movingPiece.type === 'circle') {
        movingPiece.eatenCount = (movingPiece.eatenCount || 0) + 1;
      }
      
      newBoard[targetRow][targetCol] = movingPiece;
      newBoard[selectedRow][selectedCol] = null;
      
      // Check for win condition
      const winnerColor = checkWinCondition(newBoard, targetCol);
      
      setBoard(newBoard);
      setCurrentPlayer('red');
      
      if (winnerColor) {
        setWinner(winnerColor);
        setGameMessage(winnerColor === 'red' ? 'You won!' : 'Bot won!');
        if (winnerColor === 'red') {
          setShowConfetti(true);
        }
      }
      
      console.log('🤖 Forced random move completed');
    }
  };

  const HomeScreen = () => (
    <div className="home-screen">
      <h1>Get To The End</h1>
      
      {/* Navigation Bar */}
      <div className="nav-bar">
        <div className="nav-option active">
          <span>Home</span>
        </div>
        <div className="nav-option" onClick={() => setScreen('bots')}>
          <span>Bots</span>
        </div>
      </div>
      
      <div className="home-buttons">
        <button type="button" onClick={() => {
          socket.emit('joinQueue', username);
          setIsSearching(true);
        }}>
          {translations[language].playGame}
        </button>
        <button type="button" onClick={() => setScreen('help')}>
          {translations[language].help}
        </button>
        <button
          type="button"
          onClick={handleLogoutClick}
          className="logout-button"
        >
          {translations[language].logout}
        </button>
        <div className="language-select-container">
          <label htmlFor="language-select">{translations[language].selectLanguage}</label>
          <select 
            id="language-select"
            className="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="zh">中文 (Chinese)</option>
            <option value="pt">Português (Portuguese)</option>
            <option value="th">ไทย (Thai)</option>
            <option value="ar">العربية (Arabic)</option>
          </select>
        </div>
      </div>
      <p className="coming-soon">{translations[language].moreComingSoon}</p>
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
      <div className="bots-content">
        <h2>Play Against Bots</h2>
        <p>Choose your opponent's difficulty level:</p>
        
        <div className="bot-options">
          <div className="bot-option" onClick={() => {
            initializeGame();
            setGameStarted(true);
            setCurrentPlayer('red');
            setScreen('game');
            setGameMode('bot');
            setBotDifficulty('easy');
          }}>
            <h3>🤖 Easy Bot</h3>
            <p>Random moves, occasionally captures</p>
            <p className="bot-description">Good for beginners</p>
          </div>
          
          <div className="bot-option" onClick={() => {
            initializeGame();
            setGameStarted(true);
            setCurrentPlayer('red');
            setScreen('game');
            setGameMode('bot');
            setBotDifficulty('normal');
          }}>
            <h3>🤖 Normal Bot</h3>
            <p>Smart moves, tries to advance</p>
            <p className="bot-description">Challenging but fair</p>
          </div>
          
          <div className="bot-option" onClick={() => {
            initializeGame();
            setGameStarted(true);
            setCurrentPlayer('red');
            setScreen('game');
            setGameMode('bot');
            setBotDifficulty('hard');
          }}>
            <h3>🤖 Hard Bot</h3>
            <p>Strategic moves, looks for wins</p>
            <p className="bot-description">For experienced players</p>
          </div>
        </div>
        
        <button onClick={() => setScreen('home')} className="back-button">
          ← Back to Home
        </button>
      </div>
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

  if (screen === 'bots') {
    return <BotsScreen />;
  }

  // Game screen (existing game content)
  return (
    <div className="app">
      <div className="game-content">
        {winner && (
          <div className="winner-announcement">
            {winner === getMyColor() ? (
              <>
                <h2 style={{ color: winner === 'red' ? '#ff4444' : '#4444ff' }}>
                  {translations[language].youWon}
                </h2>
                {showConfetti && <ConfettiOverlay />}
              </>
            ) : (
              <>
                <h2 style={{ color: '#888' }}>{translations[language].youLost}</h2>
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
            }}>{translations[language].backToHome}</button>
          </div>
        )}
        <div className="game-info-container">
          <div className="game-status">
            <div className="player-indicator" style={{ backgroundColor: getMyColor() === 'red' ? '#ff4444' : '#4444ff' }}>
              {isMyTurn ? translations[language].yourTurn : (gameMode === 'bot' ? 'Bot\'s Turn' : translations[language].opponentTurn(opponent))}
              {gameMode === 'online' && (
                <div className="timer" style={{ fontSize: '1.2rem', marginTop: '5px', color: getMyColor() === 'red' ? '#ff4444' : '#4444ff' }}>
                  {translations[language].timeLeft(timeLeft)}
                </div>
              )}
            </div>
            <div className="game-message" style={{ color: getMyColor() === 'red' ? '#ff4444' : '#4444ff' }}>
              {isMyTurn ? translations[language].selectPiece : (gameMode === 'bot' ? 'Bot is thinking...' : translations[language].waitingForMove(opponent))}
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