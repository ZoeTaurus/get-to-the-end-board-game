import React from 'react';

interface Piece {
  type: 'person' | 'circle';
  color: 'red' | 'blue';
  eatenCount: number;
}

interface GameBoardProps {
  board: (Piece | null)[][];
  selectedPiece: { row: number; col: number } | null;
  validMoves: { row: number; col: number }[];
  validCaptures: { row: number; col: number }[];
  onPieceClick: (row: number, col: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  board,
  selectedPiece,
  validMoves,
  validCaptures,
  onPieceClick
}) => {
  const isSelected = (row: number, col: number) => {
    return selectedPiece && selectedPiece.row === row && selectedPiece.col === col;
  };

  const isValidMove = (row: number, col: number) => {
    return validMoves.some(move => move.row === row && move.col === col);
  };

  const isValidCapture = (row: number, col: number) => {
    return validCaptures.some(capture => capture.row === row && capture.col === col);
  };

  return (
    <div className="grid grid-cols-6 gap-1 bg-gray-200 p-4 rounded-lg">
      {board.map((row, rowIndex) =>
        row.map((piece, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={`w-12 h-12 border border-gray-300 flex items-center justify-center relative cursor-pointer ${
              isSelected(rowIndex, colIndex) ? 'bg-blue-100' : ''
            } ${
              isValidMove(rowIndex, colIndex) ? 'bg-green-100' : ''
            } ${
              isValidCapture(rowIndex, colIndex) ? 'bg-red-100' : ''
            }`}
            onClick={() => onPieceClick(rowIndex, colIndex)}
          >
            {piece && (
              <div
                className={`absolute w-8 h-8 flex items-center justify-center rounded-full ${
                  piece.type === 'circle'
                    ? 'bg-red-500 text-white'
                    : 'bg-blue-500 text-white'
                }`}
              >
                {piece.type === 'person' ? (
                  <span className="text-sm">👤</span>
                ) : (
                  <span className="text-sm">⭕</span>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default GameBoard; 