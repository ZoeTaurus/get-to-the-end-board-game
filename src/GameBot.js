// JavaScript version of GameBot for compatibility
/**
 * @typedef {'person' | 'circle'} PieceType
 * @typedef {'player' | 'bot'} Player
 * @typedef {{ type: PieceType, owner: Player, eatenCount?: number }} Piece
 * @typedef {{ from: {row: number, col: number}, to: {row: number, col: number}, eatenPiece?: {row: number, col: number} }} Move
 * @typedef {{ board: (Piece|null)[][], currentPlayer: Player }} GameState
 */

const PieceType = {
  PERSON: 'person',
  CIRCLE: 'circle'
};

const Player = {
  PLAYER: 'player',
  BOT: 'bot'
};

export class GameBot {
  constructor(difficulty) {
    this.difficulty = difficulty;
  }

  // --- FIX #1: THE "QUARANTINE ZONE" ---
  // We now create a deep copy of the game state AT THE VERY BEGINNING.
  // The 'real' gameState is never touched by the thinking process again.
  makeMove(gameState) {
    // Create a perfectly safe, deep-copied clone for the bot to think with.
    const safeGameState = JSON.parse(JSON.stringify(gameState));
    
    const allPossibleMoves = this.getAllValidMoves(safeGameState, Player.BOT);

    if (allPossibleMoves.length === 0) {
      return null;
    }

    // This rule is still golden: if you can eat, you must eat.
    const captureMoves = allPossibleMoves.filter(move => move.eatenPiece);
    if (captureMoves.length > 0) {
      // Add some unpredictability - sometimes choose a non-capture move
      const shouldBeUnpredictable = Math.random() < 0.15; // 15% chance to be unpredictable
      
      if (shouldBeUnpredictable && this.difficulty >= 3) {
        // Choose a random non-capture move to be unpredictable
        const nonCaptureMoves = allPossibleMoves.filter(move => !move.eatenPiece);
        if (nonCaptureMoves.length > 0) {
          return nonCaptureMoves[Math.floor(Math.random() * nonCaptureMoves.length)];
        }
      }
      
      if (this.difficulty >= 3) {
        // Higher-level AI will pick the BEST capture.
        return this.findBestMove(safeGameState, captureMoves, this.getDepth());
      }
      return captureMoves[Math.floor(Math.random() * captureMoves.length)];
    }
    
    // If no captures, proceed with difficulty-specific logic.
    switch (this.difficulty) {
      case 1:
        return this.easyMove(allPossibleMoves);
      case 2:
        return this.mediumMove(safeGameState, allPossibleMoves);
      default: // Levels 3, 4, and 5
        return this.findBestMove(safeGameState, allPossibleMoves, this.getDepth());
    }
  }
  
  // Helper to set AI "thinking" depth based on difficulty
  getDepth() {
    switch(this.difficulty) {
      case 3: return 2;
      case 4: return 4;
      case 5: return 6; // This will be very tough!
      default: return 2;
    }
  }

  // Easy and Medium moves are fine as they don't use minimax.
  easyMove(moves) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  mediumMove(gameState, moves) {
    let bestMove = null;
    let bestScore = -Infinity;

    for (const move of moves) {
        // This simple evaluation is fine for a medium bot
        const score = (move.to.col - move.from.col) * 10;
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    return bestMove || this.easyMove(moves);
  }

  // The findBestMove function which starts the deep thinking process.
  findBestMove(gameState, moves, depth) {
    let bestMove = null;
    let bestValue = -Infinity;
    
    for (const move of moves) {
      const newGameState = this.simulateMove(gameState, move);
      const boardValue = this.minimax(newGameState, depth - 1, false, -Infinity, Infinity);
      
      if (boardValue > bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
    }
    
    return bestMove || moves[0];
  }
  
  /**
   * The core Minimax algorithm with Alpha-Beta Pruning.
   * This allows the bot to "look ahead" several moves.
   */
  minimax(state, depth, isMaximizingPlayer, alpha, beta) {
    if (depth === 0 || this.isGameOver(state)) {
      return this.evaluateBoard(state);
    }

    const possibleMoves = this.getAllValidMoves(state, isMaximizingPlayer ? Player.BOT : Player.PLAYER);

    if (isMaximizingPlayer) {
      let maxEval = -Infinity;
      for (const move of possibleMoves) {
        const newState = this.simulateMove(state, move);
        const evaluation = this.minimax(newState, depth - 1, false, alpha, beta);
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) {
          break; // Prune
        }
      }
      return maxEval;
    } else { // Minimizing Player
      let minEval = Infinity;
      for (const move of possibleMoves) {
        const newState = this.simulateMove(state, move);
        const evaluation = this.minimax(newState, depth - 1, true, alpha, beta);
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) {
          break; // Prune
        }
      }
      return minEval;
    }
  }

  // --- WIZARD BOT SUPER SMART EVALUATION FUNCTION ---
  // This wizard bot can anticipate, defend, attack, and detect traps!
  evaluateBoard(state) {
    // Check for a terminal state (win/loss). This is the highest priority.
    if (this.isGameOver(state)) {
      const winner = this.getWinner(state);
      if (winner === Player.BOT) return 100000;    // A win is the best possible score
      if (winner === Player.PLAYER) return -100000; // A loss is the worst
    }

    let totalScore = 0;
    const pieceValue = { [PieceType.PERSON]: 100, [PieceType.CIRCLE]: 150 };
    
    // --- STEP 1: BASIC MATERIAL AND POSITION ---
    for (let r = 0; r < state.board.length; r++) {
        for (let c = 0; c < state.board[0].length; c++) {
            const piece = state.board[r][c];
            if (piece) {
                const value = pieceValue[piece.type];
                const positionalScore = c * c;
                const playerPositionalAdvantage = (state.board[0].length - 1 - c);
                
                if (piece.owner === Player.BOT) {
                    totalScore += value + positionalScore;
                } else {
                    totalScore -= (value + (playerPositionalAdvantage * playerPositionalAdvantage));
                }
            }
        }
    }

    // --- STEP 2: WIZARD THREAT ANALYSIS ---
    // Check for threats everywhere and analyze defensive positions
    const botMoves = this.getAllValidMoves(state, Player.BOT);
    const playerMoves = this.getAllValidMoves(state, Player.PLAYER);
    const botCaptures = botMoves.filter(m => m.eatenPiece);
    const playerCaptures = playerMoves.filter(m => m.eatenPiece);

    // --- STEP 3: RETREAT AND DEFENSE ANALYSIS ---
    // For each bot piece, check if it's threatened and if it can retreat or be defended
    for (let r = 0; r < state.board.length; r++) {
      for (let c = 0; c < state.board[0].length; c++) {
        const piece = state.board[r][c];
        if (piece && piece.owner === Player.BOT) {
          
          // Check if this piece is threatened
          const isThreatenedByPlayer = playerCaptures.some(capture => 
            capture.to.row === r && capture.to.col === c
          );
          
          if (isThreatenedByPlayer) {
            totalScore -= 3000; // Heavy penalty for being threatened
            
            // Check if piece can retreat (find safe moves for this piece)
            const retreatMoves = botMoves.filter(move => 
              move.from.row === r && move.from.col === c
            );
            
            let canRetreatSafely = false;
            for (const retreat of retreatMoves) {
              const afterRetreat = this.simulateMove(state, retreat);
              const playerMovesAfterRetreat = this.getAllValidMoves(afterRetreat, Player.PLAYER);
              const stillThreatened = playerMovesAfterRetreat.some(capture => 
                capture.eatenPiece && 
                capture.to.row === retreat.to.row && 
                capture.to.col === retreat.to.col
              );
              
              if (!stillThreatened) {
                canRetreatSafely = true;
                totalScore += 1500; // Bonus for having a safe retreat option
                break;
              }
            }
            
            // Check if other pieces can defend this threatened piece
            const canBeDefended = botMoves.some(move => {
              const afterMove = this.simulateMove(state, move);
              const playerMovesAfterDefense = this.getAllValidMoves(afterMove, Player.PLAYER);
              const stillThreatened = playerMovesAfterDefense.some(capture => 
                capture.eatenPiece && 
                capture.to.row === r && 
                capture.to.col === c
              );
              return !stillThreatened;
            });
            
            if (canBeDefended) {
              totalScore += 1000; // Bonus for defensive options
            }
          }
        }
      }
    }

    // --- STEP 4: SMART CAPTURE WITH DEEP ANALYSIS ---
    // Check if capturing is safe by looking for defensive pieces behind
    for (const captureMove of botCaptures) {
      const afterCapture = this.simulateMove(state, captureMove);
      
      // Check immediate counter-attack
      const playerMovesAfterCapture = this.getAllValidMoves(afterCapture, Player.PLAYER);
      const canPlayerCaptureBack = playerMovesAfterCapture.some(m => 
        m.eatenPiece && 
        m.to.row === captureMove.to.row && 
        m.to.col === captureMove.to.col
      );
      
      if (canPlayerCaptureBack) {
        // Look deeper - check if there are defensive pieces behind the target
        const counterCapture = playerMovesAfterCapture.find(m => 
          m.eatenPiece && 
          m.to.row === captureMove.to.row && 
          m.to.col === captureMove.to.col
        );
        
        if (counterCapture) {
          const afterPlayerCapture = this.simulateMove(afterCapture, counterCapture);
          const botMovesAfterPlayerCapture = this.getAllValidMoves(afterPlayerCapture, Player.BOT);
          const canBotCaptureAgain = botMovesAfterPlayerCapture.some(m => 
            m.eatenPiece && 
            m.to.row === captureMove.to.row && 
            m.to.col === captureMove.to.col
          );
          
          if (canBotCaptureAgain) {
            totalScore += 2000; // Good! We can capture back after they capture us
          } else {
            totalScore -= 5000; // Bad! This is a trap - we'll lose the piece
          }
        }
      } else {
        totalScore += 8000; // Safe capture - go for it!
      }
    }

    // --- STEP 5: ANTICIPATE PLAYER MOVES ---
    // Predict what the player might do and prepare for it
    if (state.currentPlayer === Player.PLAYER) {
      // Look at player's best captures and try to block them
      for (const playerCapture of playerCaptures) {
        // Check if we can block this capture
        const canBlock = botMoves.some(move => {
          const afterBlock = this.simulateMove(state, move);
          const playerMovesAfterBlock = this.getAllValidMoves(afterBlock, Player.PLAYER);
          return !playerMovesAfterBlock.some(capture => 
            capture.eatenPiece && 
            capture.to.row === playerCapture.to.row && 
            capture.to.col === playerCapture.to.col
          );
        });
        
        if (canBlock) {
          totalScore += 500; // Bonus for being able to block player threats
        } else {
          totalScore -= 1000; // Penalty for unstoppable player threats
        }
      }
      
      totalScore -= playerCaptures.length * 800; // General penalty for player threats
    }

    // --- STEP 6: TRAP DETECTION ---
    // Check if moves lead us into traps (positions where we'll be surrounded)
    for (const move of botMoves) {
      const afterMove = this.simulateMove(state, move);
      const playerResponseMoves = this.getAllValidMoves(afterMove, Player.PLAYER);
      const playerResponses = playerResponseMoves.filter(m => m.eatenPiece);
      
      // If this move puts us in a position where player has multiple capture options, it's a trap
      if (playerResponses.length > 1) {
        totalScore -= 2000; // Heavy penalty for walking into traps
      }
      
      // Check if this move helps us control the center or create formations
      if (move.to.row > 0 && move.to.row < state.board.length - 1 && 
          move.to.col > 0 && move.to.col < state.board[0].length - 1) {
        totalScore += 100; // Small bonus for central control
      }
    }

    // --- STEP 7: FORMATION AND COORDINATION ---
    // Check if our pieces are working together
    for (let r = 0; r < state.board.length; r++) {
      for (let c = 0; c < state.board[0].length; c++) {
        const piece = state.board[r][c];
        if (piece && piece.owner === Player.BOT) {
          // Count friendly pieces nearby
          let friendlyNeighbors = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr;
              const nc = c + dc;
              if (this.isValidPosition(nr, nc, state.board.length, state.board[0].length)) {
                const neighbor = state.board[nr][nc];
                if (neighbor && neighbor.owner === Player.BOT) {
                  friendlyNeighbors++;
                }
              }
            }
          }
          totalScore += friendlyNeighbors * 50; // Bonus for piece coordination
        }
      }
    }
    
    return totalScore;
  }
  
  // --- Helper Functions ---

  getAllValidMoves(gameState, player) {
    const moves = [];
    const board = gameState.board;
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[0].length; col++) {
        const piece = board[row][col];
        if (piece && piece.owner === player) {
          if (piece.type === PieceType.PERSON) {
            this.getPersonMoves(gameState, row, col, moves);
          } else if (piece.type === PieceType.CIRCLE) {
            this.getCircleMoves(gameState, row, col, moves);
          }
        }
      }
    }
    return moves;
  }

  getPersonMoves(gameState, row, col, moves) {
    const board = gameState.board;
    const opponent = board[row][col].owner === Player.PLAYER ? Player.BOT : Player.PLAYER;
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const eatDirections = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

    for (const [dRow, dCol] of directions) {
      const newRow = row + dRow;
      const newCol = col + dCol;
      if (this.isValidPosition(newRow, newCol, board.length, board[0].length) && !board[newRow][newCol]) {
        moves.push({ from: { row, col }, to: { row: newRow, col: newCol } });
      }
    }
    for (const [dRow, dCol] of eatDirections) {
      const newRow = row + dRow;
      const newCol = col + dCol;
      if (this.isValidPosition(newRow, newCol, board.length, board[0].length) && board[newRow][newCol]?.owner === opponent) {
        moves.push({ from: { row, col }, to: { row: newRow, col: newCol }, eatenPiece: { row: newRow, col: newCol } });
      }
    }
  }

  getCircleMoves(gameState, row, col, moves) {
    const board = gameState.board;
    const opponent = board[row][col].owner === Player.PLAYER ? Player.BOT : Player.PLAYER;
    const piece = board[row][col];
    const allDirections = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];

    for (const [dRow, dCol] of allDirections) {
      const newRow = row + dRow;
      const newCol = col + dCol;
      if (this.isValidPosition(newRow, newCol, board.length, board[0].length)) {
        if (!board[newRow][newCol]) {
        moves.push({ from: { row, col }, to: { row: newRow, col: newCol } });
        } else if (board[newRow][newCol]?.owner === opponent && (piece.eatenCount || 0) < 2) {
          moves.push({ from: { row, col }, to: { row: newRow, col: newCol }, eatenPiece: { row: newRow, col: newCol } });
        }
      }
    }
  }

  /**
   * Simulates a move on a new board instance to prevent changing the original game state.
   * This is crucial for the recursive AI functions.
   */
  simulateMove(state, move) {
    // This next line is the most important part!
    // It creates a "deep copy" of the board and all the piece objects in it.
    const newBoard = state.board.map(row => 
      row.map(cell => (cell ? { ...cell } : null))
    );
    
    const movingPiece = newBoard[move.from.row][move.from.col];

    // This should never happen, but it's good practice to check.
    if (!movingPiece) {
      return state;
    }

    // Apply the move on the new, safe-to-edit board.
    newBoard[move.to.row][move.to.col] = movingPiece;
    newBoard[move.from.row][move.from.col] = null;

    // Handle eating logic.
    if (move.eatenPiece) {
      newBoard[move.eatenPiece.row][move.eatenPiece.col] = null;
      if (movingPiece.type === PieceType.CIRCLE) {
        // Make sure to update the count on the new piece object!
        movingPiece.eatenCount = (movingPiece.eatenCount || 0) + 1;
      }
    }

    // Return the completely new game state for the bot to think about.
    return {
      board: newBoard,
      currentPlayer: state.currentPlayer === Player.PLAYER ? Player.BOT : Player.PLAYER
    };
  }

  isValidPosition(row, col, boardRows, boardCols) {
    return row >= 0 && row < boardRows && col >= 0 && col < boardCols;
  }

  isGameOver(state) {
    if (this.countPieces(state, Player.BOT) === 0 || this.countPieces(state, Player.PLAYER) === 0) {
              return true;
    }
    for(let r = 0; r < state.board.length; r++) {
        if (state.board[r][0]?.owner === Player.PLAYER && state.board[r][0]?.type === PieceType.PERSON) return true;
        if (state.board[r][state.board[0].length - 1]?.owner === Player.BOT && state.board[r][state.board[0].length - 1]?.type === PieceType.PERSON) return true;
    }
    return false;
  }

  getWinner(state) {
    const botPieces = this.countPieces(state, Player.BOT);
    const playerPieces = this.countPieces(state, Player.PLAYER);
    
    if (botPieces === 0) return Player.PLAYER;
    if (playerPieces === 0) return Player.BOT;

    for(let r = 0; r < state.board.length; r++) {
        if (state.board[r][0]?.owner === Player.PLAYER && state.board[r][0]?.type === PieceType.PERSON) return Player.PLAYER;
        if (state.board[r][state.board[0].length - 1]?.owner === Player.BOT && state.board[r][state.board[0].length - 1]?.type === PieceType.PERSON) return Player.BOT;
    }
    
    return null;
  }

  countPieces(state, player) {
      let count = 0;
      for (let r = 0; r < state.board.length; r++) {
          for (let c = 0; c < state.board[0].length; c++) {
              if (state.board[r][c]?.owner === player) {
                  count++;
              }
          }
      }
      return count;
  }
}

// --------------------- Helper Functions for Your Game ---------------------

/**
 * Helper function to convert your game's board format to the GameBot's format
 * Note: The new bot uses column-based win conditions (bot wins at right column, player at left column)
 */
export function convertBoardForBot(board) {
  const convertedBoard = board.map(row => 
    row.map(cell => {
      if (!cell) return null;
      return {
        type: cell.type === 'person' ? PieceType.PERSON : PieceType.CIRCLE,
        owner: cell.color === 'red' ? Player.PLAYER : Player.BOT, // Red = Player, Blue = Bot
        eatenCount: cell.eatenCount || 0
      };
    })
  );
  
  return convertedBoard;
}

/**
 * Helper function to convert a GameBot move back to your game's format
 */
export function convertMoveFromBot(move) {
  return {
    from: [move.from.row, move.from.col],
    to: [move.to.row, move.to.col]
  };
}
