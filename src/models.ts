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
export interface Piece {
  type: PieceType;
  owner: Player;
  eatenCount?: number; // Only for Circle pieces
}

/**
 * An interface representing a single move on the board.
 * It's crucial for the bot to evaluate and choose moves.
 */
export interface Move {
  from: { row: number; col: number };
  to: { row: number; col: number };
  eatenPiece?: { row: number; col: number };
}

/**
 * An interface for the current state of the game board.
 * This is the central piece of information the bot will use to make its decisions.
 */
export interface GameState {
  board: (Piece | null)[][]; // A 2D array representing the board
  currentPlayer: Player; // Who's turn it is
}
