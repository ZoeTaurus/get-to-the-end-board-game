/**
 * An enumeration for the different types of pieces in the game.
 * This makes the code more readable and easier to manage.
 */
export enum PieceType {
  PERSON = 'person',
  CIRCLE = 'circle',
}

/**
 * An enumeration for the two players.
 * This helps differentiate between the player's pieces and the bot's pieces.
 */
export enum Player {
  PLAYER = 'player',
  BOT = 'bot',
}

/**
 * An interface representing a single piece on the board.
 * It stores the piece's type, its owner, and any specific state like how many pieces a circle has eaten.
 */
interface Piece {
  type: PieceType;
  owner: Player;
  eatenCount?: number; // Only for Circle pieces
}

/**
 * An interface representing a single move on the board.
 * It's crucial for the bot to evaluate and choose moves.
 */
interface Move {
  from: { row: number; col: number };
  to: { row: number; col: number };
  eatenPiece?: { row: number; col: number };
}

/**
 * An interface for the current state of the game board.
 * This is the central piece of information the bot will use to make its decisions.
 */
interface GameState {
  board: (Piece | null)[][]; // A 2D array representing the board
  currentPlayer: Player; // Who's turn it is
}

/**
 * A class representing the game bot with different difficulty levels.
 * The core logic for each AI level is contained within this class.
 */
export class GameBot {
  private difficulty: number; // 1 to 5

  constructor(difficulty: number) {
    this.difficulty = difficulty;
  }

  /**
   * Main function to get the bot's next move based on the current game state and difficulty.
   *
   * @param {GameState} gameState - The current state of the board.
   * @returns {Move | null} The bot's chosen move, or null if no valid moves exist.
   */
  public makeMove(gameState: GameState): Move | null {
    // A helper function to find all possible moves for the bot.
    const allPossibleMoves = this.getAllValidMoves(gameState, gameState.currentPlayer);

    if (allPossibleMoves.length === 0) {
      return null;
    }

    // CRITICAL: ALWAYS prioritize captures if available - this is the main fix
    const captureMoves = allPossibleMoves.filter(move => move.eatenPiece);
    if (captureMoves.length > 0) {
      // Always capture when possible - no exceptions!
      return captureMoves[0];
    }

    // AI Logic for each difficulty level
    switch (this.difficulty) {
      case 1: // Easy Mode: Pure Randomness
        return this.easyMove(allPossibleMoves);
      case 2: // Medium Mode: Prioritizes eating and advancing
        return this.mediumMove(gameState, allPossibleMoves);
      case 3: // Hard Mode: Minimax AI with a shallow search (depth 1)
        return this.hardMove(gameState, allPossibleMoves);
      case 4: // Expert Mode: Deeper Minimax with Alpha-Beta Pruning (depth 2)
        return this.expertMove(gameState, allPossibleMoves);
      case 5: // Unbeatable Mode: Aggressive, optimal Minimax AI (depth 3)
        return this.unbeatableMove(gameState, allPossibleMoves);
      default:
        return this.easyMove(allPossibleMoves);
    }
  }

  /**
   * Retrieves all valid moves for a given player from the current game state.
   * This is a critical helper function for the bot's AI.
   * @param {GameState} gameState - The current game state.
   * @param {Player} player - The player whose moves to find.
   * @returns {Move[]} An array of all possible valid moves.
   */
  private getAllValidMoves(gameState: GameState, player: Player): Move[] {
    const moves: Move[] = [];
    const board = gameState.board;
    const boardRows = board.length;
    const boardCols = board[0].length;

    for (let row = 0; row < boardRows; row++) {
      for (let col = 0; col < boardCols; col++) {
        const piece = board[row][col];
        if (piece && piece.owner === player) {
          // Check moves for the specific piece type.
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

  /**
   * Helper function to find all valid moves for a Person piece.
   */
  private getPersonMoves(gameState: GameState, row: number, col: number, moves: Move[]) {
    const board = gameState.board;
    const owner = board[row][col]!.owner;
    const opponent = owner === Player.PLAYER ? Player.BOT : Player.PLAYER;
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // Back, forth, sideways
    const eatDirections = [[-1, -1], [-1, 1], [1, -1], [1, 1]]; // Diagonal

    // Movement
    for (const [dRow, dCol] of directions) {
      const newRow = row + dRow;
      const newCol = col + dCol;
      if (this.isValidPosition(newRow, newCol, board.length, board[0].length) && !board[newRow][newCol]) {
        moves.push({ from: { row, col }, to: { row: newRow, col: newCol } });
      }
    }

    // Eating
    for (const [dRow, dCol] of eatDirections) {
      const newRow = row + dRow;
      const newCol = col + dCol;
      if (this.isValidPosition(newRow, newCol, board.length, board[0].length) && board[newRow][newCol]?.owner === opponent) {
        moves.push({ from: { row, col }, to: { row: newRow, col: newCol }, eatenPiece: { row: newRow, col: newCol } });
      }
    }
  }

  /**
   * Helper function to find all valid moves for a Circle piece.
   */
  private getCircleMoves(gameState: GameState, row: number, col: number, moves: Move[]) {
    const board = gameState.board;
    const owner = board[row][col]!.owner;
    const opponent = owner === Player.PLAYER ? Player.BOT : Player.PLAYER;
    const piece = board[row][col]!;
    const allDirections = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];

    for (const [dRow, dCol] of allDirections) {
      let newRow = row + dRow;
      let newCol = col + dCol;
      // Normal movement (one step)
      if (this.isValidPosition(newRow, newCol, board.length, board[0].length) && !board[newRow][newCol]) {
        moves.push({ from: { row, col }, to: { row: newRow, col: newCol } });
      }

      // Eating (if the circle isn't "full")
      if ((piece.eatenCount ?? 0) < 2) {
        if (this.isValidPosition(newRow, newCol, board.length, board[0].length) && board[newRow][newCol]?.owner === opponent) {
          moves.push({ from: { row, col }, to: { row: newRow, col: newCol }, eatenPiece: { row: newRow, col: newCol } });
        }
      }
    }
  }

  /**
   * A simple check to ensure a position is within the board's boundaries.
   * FIXED: Now handles non-square boards (4x6)
   */
  private isValidPosition(row: number, col: number, boardRows: number, boardCols: number): boolean {
    return row >= 0 && row < boardRows && col >= 0 && col < boardCols;
  }

  /**
   * LEVEL 1: Easy Bot Logic - Pure Randomness
   * @param {Move[]} allPossibleMoves - All available moves.
   */
  private easyMove(allPossibleMoves: Move[]): Move {
    const randomIndex = Math.floor(Math.random() * allPossibleMoves.length);
    return allPossibleMoves[randomIndex];
  }

  /**
   * LEVEL 2: Medium Bot Logic - Prioritizes Eating and Advancing
   * This bot is a noticeable step up from the easy bot. It will prioritize
   * eating moves, but if none exist, it will make a move that advances a piece.
   * @param {GameState} gameState - The current game state.
   * @param {Move[]} allPossibleMoves - All available moves.
   */
  private mediumMove(gameState: GameState, allPossibleMoves: Move[]): Move {
    const eatingMoves = allPossibleMoves.filter(move => move.eatenPiece);
    if (eatingMoves.length > 0) {
      return eatingMoves[0]; // Take first capture (more consistent than random)
    }

    const advancingMoves = allPossibleMoves.filter(move => {
        // FIXED: A move is advancing if the piece gets closer to the winning column
        const isBot = gameState.board[move.from.row][move.from.col]?.owner === Player.BOT;
        const startCol = move.from.col;
        const endCol = move.to.col;

        // Bot (blue) starts on LEFT (col 0) and advances by moving RIGHT (toward column 5)
        if (isBot && endCol > startCol) return true;
        // Player (red) starts on RIGHT (col 5) and advances by moving LEFT (toward column 0)  
        if (!isBot && endCol < startCol) return true;
        return false;
    });

    if (advancingMoves.length > 0) {
        const randomIndex = Math.floor(Math.random() * advancingMoves.length);
        return advancingMoves[randomIndex];
    }

    // Fallback to random if no eating or advancing moves are available
    return this.easyMove(allPossibleMoves);
  }

  /**
   * LEVEL 3: Hard Bot Logic (Simple AI) - Shallow Minimax
   * This bot uses the improved evaluation function to make a single move lookahead (depth 1).
   * It's much smarter than the medium bot because it can anticipate a better position, not just
   * an immediate gain.
   * @param {GameState} gameState - The current game state.
   * @param {Move[]} allPossibleMoves - All available moves.
   */
  private hardMove(gameState: GameState, allPossibleMoves: Move[]): Move {
    let bestMove: Move | null = null;
    let bestScore = -Infinity;
    const depth = 1; // REDUCED to prevent browser crashes

    for (const move of allPossibleMoves) {
      const newGameState = this.simulateMove(gameState, move);
      const score = this.minimax(newGameState, depth, false, -Infinity, Infinity);

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove || this.mediumMove(gameState, allPossibleMoves); // Fallback
  }

  /**
   * LEVEL 4: Expert Bot Logic (More Complicated AI) - Deeper Minimax with Alpha-Beta Pruning
   * This bot is a significant step up. It uses the Minimax algorithm with a deeper search
   * (depth 2) and an optimization called Alpha-Beta Pruning to make it more efficient.
   * @param {GameState} gameState - The current game state.
   * @param {Move[]} allPossibleMoves - All available moves.
   */
  private expertMove(gameState: GameState, allPossibleMoves: Move[]): Move {
    let bestMove: Move | null = null;
    let bestScore = -Infinity;
    const depth = 2; // REDUCED to prevent browser crashes

    for (const move of allPossibleMoves) {
      const newGameState = this.simulateMove(gameState, move);
      // 'false' indicates it's now the opponent's turn.
      const score = this.minimax(newGameState, depth, false, -Infinity, Infinity);

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove || this.hardMove(gameState, allPossibleMoves);
  }

  /**
   * LEVEL 5: Unbeatable Bot Logic (More Complicated AI) - Aggressive Minimax
   * This bot is the most intelligent, using a deeper search (depth 3) to find the most
   * optimal moves and avoid traps. The evaluation function is also more heavily weighted
   * for this level to ensure it always prioritizes a win.
   * @param {GameState} gameState - The current game state.
   * @param {Move[]} allPossibleMoves - All available moves.
   */
  private unbeatableMove(gameState: GameState, allPossibleMoves: Move[]): Move {
    let bestMove: Move | null = null;
    let bestScore = -Infinity;
    const depth = 3; // REDUCED to prevent browser crashes

    for (const move of allPossibleMoves) {
      // Check for an immediate win condition first. This is a top priority for this level.
      const simulatedState = this.simulateMove(gameState, move);
      if (this.checkWin(simulatedState)) {
        return move;
      }

      const score = this.minimax(simulatedState, depth, false, -Infinity, Infinity);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove || this.expertMove(gameState, allPossibleMoves);
  }

  /**
   * The core Minimax algorithm with Alpha-Beta Pruning.
   * @param {GameState} state - The current state to evaluate.
   * @param {number} depth - How many more moves to look ahead.
   * @param {boolean} isMaximizingPlayer - True if it's the bot's turn, false if it's the opponent's.
   * @param {number} alpha - The best score found for the maximizing player.
   * @param {number} beta - The best score found for the minimizing player.
   * @returns {number} The score of the best possible outcome from this state.
   */
  private minimax(state: GameState, depth: number, isMaximizingPlayer: boolean, alpha: number, beta: number): number {
    if (depth === 0 || this.checkWin(state)) {
      return this.evaluateBoard(state, Player.BOT);
    }

    if (isMaximizingPlayer) {
      // Bot's turn (Maximizing player)
      let bestScore = -Infinity;
      const moves = this.getAllValidMoves(state, Player.BOT);
      for (const move of moves) {
        const newGameState = this.simulateMove(state, move);
        const score = this.minimax(newGameState, depth - 1, false, alpha, beta);
        bestScore = Math.max(bestScore, score);
        alpha = Math.max(alpha, bestScore);
        if (beta <= alpha) {
          break; // Beta cut-off
        }
      }
      return bestScore;
    } else {
      // Player's turn (Minimizing player)
      let bestScore = Infinity;
      const moves = this.getAllValidMoves(state, Player.PLAYER);
      for (const move of moves) {
        const newGameState = this.simulateMove(state, move);
        const score = this.minimax(newGameState, depth - 1, true, alpha, beta);
        bestScore = Math.min(bestScore, score);
        beta = Math.min(beta, bestScore);
        if (beta <= alpha) {
          break; // Alpha cut-off
        }
      }
      return bestScore;
    }
  }

  /**
   * An improved evaluation function to score a game state.
   * Higher score is better for the bot. This is the core of the AI's intelligence.
   * @param {GameState} state - The game state to evaluate.
   * @param {Player} player - The player to evaluate the board for.
   * @returns {number} The numerical score of the board.
   */
  private evaluateBoard(state: GameState, player: Player): number {
    const opponent = player === Player.PLAYER ? Player.BOT : Player.PLAYER;
    let score = 0;
    const boardRows = state.board.length;
    const boardCols = state.board[0].length;
    const personScore = 100;
    const circleScore = 200; // Circles are more valuable due to their versatility.

    // Heuristic 1: Check for win condition first.
    if (this.checkWin(state)) {
      return state.currentPlayer === player ? 100000 : -100000;
    }

    // Heuristic 2: Score based on remaining pieces and their value.
    for (let row = 0; row < boardRows; row++) {
      for (let col = 0; col < boardCols; col++) {
        const piece = state.board[row][col];
        if (piece) {
          const pieceValue = piece.type === PieceType.CIRCLE ? circleScore : personScore;
          if (piece.owner === player) {
            score += pieceValue;
          } else {
            score -= pieceValue;
          }
        }
      }
    }

    // Heuristic 3: Proximity to winning position (for Person pieces)
    // FIXED: Bot wins at column 5 (rightmost), Player wins at column 0 (leftmost)
    for (let row = 0; row < boardRows; row++) {
      for (let col = 0; col < boardCols; col++) {
        const piece = state.board[row][col];
        if (piece && piece.type === PieceType.PERSON) {
          if (piece.owner === Player.BOT) {
            // Bot wants to move RIGHT toward column 5
            score += (col / (boardCols - 1)) * 500; // Higher bonus for being closer to col 5
          } else {
            // Player wants to move LEFT toward column 0
            score -= ((boardCols - 1 - col) / (boardCols - 1)) * 500; // Penalty for player being closer to col 0
          }
        }
      }
    }

    // Heuristic 4: Circle's eaten count
    // Give a bonus for circle pieces that have eaten other pieces.
    for (let row = 0; row < boardRows; row++) {
      for (let col = 0; col < boardCols; col++) {
        const piece = state.board[row][col];
        if (piece && piece.type === PieceType.CIRCLE) {
          if (piece.owner === player) {
            score += (piece.eatenCount ?? 0) * 300; // Increased bonus for eating
          } else {
            score -= (piece.eatenCount ?? 0) * 300;
          }
        }
      }
    }

    // Heuristic 5: Threat assessment and piece safety
    // The bot will look for opportunities to eat opponent pieces.
    const botThreats = this.getAllValidMoves(state, Player.BOT).filter(move => move.eatenPiece).length;
    score += botThreats * 500; // INCREASED bonus for capture opportunities

    // The bot will also try to avoid having its own pieces eaten.
    // BUT: Only penalize if it's the PLAYER's turn (if it's bot's turn, bot can capture first!)
    if (state.currentPlayer === Player.PLAYER) {
      const playerThreats = this.getAllValidMoves(state, Player.PLAYER).filter(move => move.eatenPiece).length;
      score -= playerThreats * 400; // Only penalize when it's actually player's turn
    }

    // Heuristic 6: Check for opponent's winning path.
    // This is the key fix. The bot will now actively scan for and penalize moves that
    // lead to an opponent's "PERSON" reaching the last row.
    const opponentWinPath = this.checkIfOpponentHasClearPath(state, Player.BOT);
    if (opponentWinPath) {
        score = -10000; // A massive penalty, basically a "do not do this"
    }

    return score;
  }

  /**
   * Simulates a move on a new board instance to prevent changing the original game state.
   * This is crucial for the recursive AI functions.
   * @param {GameState} state - The current game state.
   * @param {Move} move - The move to simulate.
   * @returns {GameState} The new game state after the move.
   */
  private simulateMove(state: GameState, move: Move): GameState {
    // Create a deep copy of the board to avoid mutation.
    const newBoard = state.board.map(row => [...row]);
    const movingPiece = newBoard[move.from.row][move.from.col];

    if (!movingPiece) {
      return state;
    }

    // Apply the move.
    newBoard[move.to.row][move.to.col] = movingPiece;
    newBoard[move.from.row][move.from.col] = null;

    // Handle eating logic.
    if (move.eatenPiece) {
      newBoard[move.eatenPiece.row][move.eatenPiece.col] = null;
      if (movingPiece.type === PieceType.CIRCLE) {
        movingPiece.eatenCount = (movingPiece.eatenCount ?? 0) + 1;
      }
    }

    return {
      board: newBoard,
      currentPlayer: state.currentPlayer === Player.PLAYER ? Player.BOT : Player.PLAYER
    };
  }

  /**
   * Checks if the game has ended with a winner.
   * @param {GameState} state - The game state to check.
   * @returns {boolean} True if a player has won, false otherwise.
   */
  private checkWin(state: GameState): boolean {
    const boardRows = state.board.length;
    const boardCols = state.board[0].length;
    let botPieces = 0;
    let playerPieces = 0;

    for (let row = 0; row < boardRows; row++) {
      for (let col = 0; col < boardCols; col++) {
        const piece = state.board[row][col];
        if (piece) {
          if (piece.owner === Player.BOT) {
            botPieces++;
            // FIXED: Bot wins by reaching column 5 (rightmost), not bottom row
            if (piece.type === PieceType.PERSON && col === boardCols - 1) { // col 5
              return true;
            }
          } else {
            playerPieces++;
            // FIXED: Player wins by reaching column 0 (leftmost), not top row
            if (piece.type === PieceType.PERSON && col === 0) {
              return true;
            }
          }
        }
      }
    }
    // Check for winning condition: all opponent's pieces are eaten.
    return botPieces === 0 || playerPieces === 0;
  }

  /**
   * NEW HELPER FUNCTION: This function checks for a clear winning path.
   * It's crucial for the new evaluation function.
   * @param {GameState} state - The game state to check.
   * @param {Player} evaluatingPlayer - The player whose perspective to evaluate from.
   * @returns {boolean} True if the opponent has a clear winning path, false otherwise.
   */
  private checkIfOpponentHasClearPath(state: GameState, evaluatingPlayer: Player): boolean {
    const board = state.board;
    const boardRows = board.length;
    const boardCols = board[0].length;

    // FIXED: Check for clear HORIZONTAL paths, not vertical
    // Player wins by reaching column 0, so check if any player piece has a clear path LEFT
    for (let row = 0; row < boardRows; row++) {
      for (let col = 1; col < boardCols; col++) { // Start from col 1, check path to col 0
        const piece = board[row][col];
        // Check for a player's piece that could move left to win
        if (piece && piece.type === PieceType.PERSON && piece.owner === Player.PLAYER) {
          // Check if there is an unobstructed path to column 0 (left side)
          let pathIsClear = true;
          for (let checkCol = col - 1; checkCol >= 0; checkCol--) {
            // A path is NOT clear if there is a piece of the bot blocking the way
            if (board[row][checkCol] && board[row][checkCol]!.owner === Player.BOT) {
              pathIsClear = false;
              break;
            }
          }
          if (pathIsClear) {
            return true; // Found a clear horizontal path to win.
          }
        }
      }
    }
    return false;
  }
}

// --------------------- Helper Functions for Your Game ---------------------

/**
 * Helper function to convert your game's board format to the GameBot's format
 */
export function convertBoardForBot(board: any[][]): (Piece | null)[][] {
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
export function convertMoveFromBot(move: Move): { from: [number, number], to: [number, number] } {
  return {
    from: [move.from.row, move.from.col],
    to: [move.to.row, move.to.col]
  };
}
