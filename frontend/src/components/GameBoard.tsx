          <div
            key={`${row}-${col}`}
            className={`w-12 h-12 border border-gray-300 flex items-center justify-center relative ${
              isSelected ? 'bg-blue-100' : ''
            }`}
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