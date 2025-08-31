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

  // Easy bot - random but avoid obvious suicide moves
  easyMove(moves) {
    // Try to avoid immediate capture if possible
    const safeMoves = moves.filter(move => {
      // Simple check - just see if moving here is obviously dangerous
      // (This is a very basic check for the easy bot)
      return Math.random() > 0.3; // 70% chance to avoid dangerous moves
    });
    
    const movesToConsider = safeMoves.length > 0 ? safeMoves : moves;
    return movesToConsider[Math.floor(Math.random() * movesToConsider.length)];
  }

  mediumMove(gameState, moves) {
    let bestMove = null;
    let bestScore = -Infinity;

    // Filter out dangerous moves first
    const safeMoves = moves.filter(move => {
      const afterMove = this.simulateMove(gameState, move);
      const playerMoves = this.getAllValidMoves(afterMove, Player.PLAYER);
      const playerCaptures = playerMoves.filter(m => m.eatenPiece);
      
      // Don't walk into immediate capture
      const isImmediatelyThreatened = playerCaptures.some(capture => 
        capture.to.row === move.to.row && capture.to.col === move.to.col
      );
      
      return !isImmediatelyThreatened;
    });
    
    const movesToConsider = safeMoves.length > 0 ? safeMoves : moves;

    for (const move of movesToConsider) {
        // Simple evaluation - prefer advancing forward
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
    
    // CRITICAL: Filter out moves that walk into immediate capture!
    const safeMoves = moves.filter(move => {
      const afterMove = this.simulateMove(gameState, move);
      const playerMoves = this.getAllValidMoves(afterMove, Player.PLAYER);
      const playerCaptures = playerMoves.filter(m => m.eatenPiece);
      
      // Check if this move puts our piece in immediate danger
      const isImmediatelyThreatened = playerCaptures.some(capture => 
        capture.to.row === move.to.row && capture.to.col === move.to.col
      );
      
      return !isImmediatelyThreatened; // Only keep safe moves
    });
    
    // If all moves are dangerous, use the original list (better to move than not move)
    const movesToConsider = safeMoves.length > 0 ? safeMoves : moves;
    
    for (const move of movesToConsider) {
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
            totalScore -= 1500; // Reduced penalty for being threatened (was 3000)
            
            // Only retreat if there's IMMEDIATE danger and no other options
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
                totalScore += 800; // Reduced bonus for retreat (was 1500)
                break;
              }
            }
            
            // Prefer capturing threats over retreating
            const canCaptureAttacker = botCaptures.some(capture => {
              return playerCaptures.some(threat => 
                threat.from.row === capture.to.row && 
                threat.from.col === capture.to.col
              );
            });
            
            if (canCaptureAttacker) {
              totalScore += 2000; // Big bonus for counter-attacking instead of retreating
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
              totalScore += 600; // Reduced bonus for defense (was 1000)
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

    // --- STEP 5: BALANCED OFFENSE AND DEFENSE ---
    // Be more aggressive and forward-thinking
    
    // Big bonus for advancing pieces towards the goal
    for (const move of botMoves) {
      if (move.to.col > move.from.col) {
        totalScore += 150; // Bonus for advancing forward
      }
      
      // Extra bonus for getting close to the goal
      if (move.to.col >= state.board[0].length - 2) {
        totalScore += 500; // Near the goal!
      }
    }
    
    // Only worry about player threats if they're immediate and dangerous
    if (state.currentPlayer === Player.PLAYER && playerCaptures.length > 0) {
      // Look at player's best captures and try to block them ONLY if critical
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
          totalScore += 300; // Reduced bonus for blocking (was 500)
        } else {
          totalScore -= 400; // Reduced penalty for unstoppable threats (was 1000)
        }
      }
      
      totalScore -= playerCaptures.length * 300; // Much reduced penalty (was 800)
    }

    // --- STEP 6: SMART TRAP DETECTION ---
    // Check for obvious traps but don't be too paranoid
    for (const move of botMoves) {
      const afterMove = this.simulateMove(state, move);
      const playerResponseMoves = this.getAllValidMoves(afterMove, Player.PLAYER);
      const playerResponses = playerResponseMoves.filter(m => m.eatenPiece);
      
      // Only worry about traps if there are MANY capture options (3+)
      if (playerResponses.length >= 3) {
        totalScore -= 1000; // Reduced penalty for obvious traps (was 2000)
      }
      
      // Check if this move helps us control the center or create formations
      if (move.to.row > 0 && move.to.row < state.board.length - 1 && 
          move.to.col > 0 && move.to.col < state.board[0].length - 1) {
        totalScore += 200; // Increased bonus for central control (was 100)
      }
      
      // Bonus for moving pieces together in formation
      if (move.to.col > move.from.col) {
        totalScore += 80; // Additional forward movement bonus
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
