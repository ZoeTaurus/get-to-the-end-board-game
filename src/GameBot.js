/**
 * PERFECT WIZARD BOT - The Ultimate AI for "Get To The End" Board Game
 * 
 * This bot implements advanced game AI techniques:
 * - Minimax algorithm with alpha-beta pruning for deep strategic analysis
 * - Perfect threat detection and defensive positioning
 * - Safe capture analysis with multi-move lookahead
 * - Advanced formation and coordination strategies
 * - Trap detection and avoidance systems
 * 
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
    // Validate and sanitize difficulty parameter
    if (typeof difficulty !== 'number' || difficulty < 1 || difficulty > 5) {
      console.warn(`Invalid difficulty level: ${difficulty}. Defaulting to level 3.`);
      this.difficulty = 3;
    } else {
      this.difficulty = Math.floor(difficulty); // Ensure integer
    }
  }

  // ====================================================================
  // MAIN AI DECISION FUNCTIONS
  // ====================================================================

  /**
   * MAIN AI DECISION FUNCTION
   * Analyzes the current game state and returns the best possible move.
   * Uses deep copying to ensure the original game state remains unmodified.
   * 
   * @param {GameState} gameState - Current state of the game
   * @returns {Move|null} - Best move to make, or null if no moves available
   */
  makeMove(gameState) {
    // Validate input
    if (!gameState || !gameState.board || !Array.isArray(gameState.board)) {
      console.error('Invalid game state provided to GameBot');
      return null;
    }
    
    // Create a safe, deep-copied clone for AI analysis without side effects
    const safeGameState = JSON.parse(JSON.stringify(gameState));
    
    const allPossibleMoves = this.getAllValidMoves(safeGameState, Player.BOT);

    if (allPossibleMoves.length === 0) {
      return null;
    }

    // PERFECT WIZARD RULE: Always capture when possible, but only if safe!
    const captureMoves = allPossibleMoves.filter(move => move.eatenPiece);
    if (captureMoves.length > 0) {
      if (this.difficulty >= 3) {
        // WIZARD BOT: Always picks the PERFECT capture through deep analysis
        return this.findBestMove(safeGameState, captureMoves, this.getDepth());
      }
      // Lower difficulty bots use simpler capture selection
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
  
  /**
   * PERFECT DEPTH CALCULATION: Deeper thinking for perfect play
   * @returns {number} - Search depth based on difficulty level
   */
  getDepth() {
    switch(this.difficulty) {
      case 1: return 1;  // Easy: Minimal lookahead
      case 2: return 2;  // Medium: Basic planning
      case 3: return 4;  // Hard: Strong strategic thinking (doubled from 2 to 4)
      case 4: return 7;  // Pro: Master level analysis (increased from 5 to 7)
      case 5: return 10; // Wizard: SUPERHUMAN foresight! (increased from 7 to 10)
      default: return 2;
    }
  }

  // ====================================================================
  // DIFFICULTY-SPECIFIC MOVE SELECTION
  // ====================================================================

  // EASY BOT: Simple and beatable, but not completely stupid
  easyMove(moves) {
    // Prefer forward moves (simple strategy)
    const forwardMoves = moves.filter(move => move.to.col > move.from.col);
    
    if (forwardMoves.length > 0 && Math.random() > 0.4) {
      return forwardMoves[Math.floor(Math.random() * forwardMoves.length)];
    }
    
    // Otherwise, random move
    return moves[Math.floor(Math.random() * moves.length)];
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

  // PERFECT MOVE SELECTION: The wizard bot's brain for choosing the absolute best move
  findBestMove(gameState, moves, depth) {
    let bestMove = null;
    let bestValue = -Infinity;
    
    // SAFETY FIRST: Filter out moves that walk into immediate danger
    const safeMoves = moves.filter(move => {
      const afterMove = this.simulateMove(gameState, move);
      const playerMoves = this.getAllValidMoves(afterMove, Player.PLAYER);
      const playerCaptures = playerMoves.filter(m => m.eatenPiece);
      
      // Check if this move puts our piece in immediate danger
      const isImmediatelyThreatened = playerCaptures.some(capture => 
        capture.to.row === move.to.row && capture.to.col === move.to.col
      );
      
      return !isImmediatelyThreatened;
    });
    
    // MOVE PRIORITIZATION: If we have safe moves, use them. Otherwise, take calculated risks.
    const movesToConsider = safeMoves.length > 0 ? safeMoves : moves;

    // URGENT DEFENSE: If player has an immediate winning move, prioritize blocks/captures.
    const urgentThreats = this.countImmediatePlayerWins(gameState);
    let threatFocusedMoves = movesToConsider;
    if (urgentThreats > 0) {
      const reducedThreatMoves = movesToConsider.filter(move => {
        const afterMove = this.simulateMove(gameState, move);
        return this.countImmediatePlayerWins(afterMove) < urgentThreats;
      });
      if (reducedThreatMoves.length > 0) {
        threatFocusedMoves = reducedThreatMoves;
      }
    }

    // STRONGER DEFENSE: Avoid hanging pieces unless there is a recapture plan.
    const saferMoves = threatFocusedMoves.filter(move => this.isMoveSafeWithCounterplay(gameState, move));
    const safeSet = saferMoves.length > 0 ? saferMoves : threatFocusedMoves;

    // ANTI-BLUNDER: Avoid moves that lose material immediately with no recapture,
    // unless it is a direct winning move.
    const nonBlunders = safeSet.filter(move => !this.isBlunderMove(gameState, move));
    const finalMoves = nonBlunders.length > 0 ? nonBlunders : safeSet;
    
    // DEEP ANALYSIS: Use minimax to evaluate each move
    for (const move of finalMoves) {
      const newGameState = this.simulateMove(gameState, move);
      const boardValue = this.minimax(newGameState, depth - 1, false, -Infinity, Infinity);
      const tacticalPenalty = this.evaluateImmediateCaptureRisk(gameState, move);
      const adjustedValue = boardValue - tacticalPenalty;
      
      // TIE-BREAKING: If moves have equal value, prefer more strategic ones
      if (adjustedValue > bestValue || 
          (adjustedValue === bestValue && this.isMoreStrategic(move, bestMove, gameState))) {
        bestValue = adjustedValue;
        bestMove = move;
      }
    }
    
    return bestMove || moves[0];
  }
  
  // Helper function to determine if one move is more strategic than another (for tie-breaking)
  isMoreStrategic(move1, move2, gameState) {
    if (!move2) return true;
    
    // Prefer moves that advance further
    const advance1 = move1.to.col - move1.from.col;
    const advance2 = move2.to.col - move2.from.col;
    if (advance1 !== advance2) return advance1 > advance2;
    
    // Prefer moves that create formations
    const afterMove1 = this.simulateMove(gameState, move1);
    const afterMove2 = this.simulateMove(gameState, move2);
    const support1 = this.countNearbyFriendlies(move1.to.row, move1.to.col, afterMove1.board);
    const support2 = this.countNearbyFriendlies(move2.to.row, move2.to.col, afterMove2.board);
    if (support1 !== support2) return support1 > support2;
    
    // Prefer center moves
    const center1 = Math.abs(move1.to.row - gameState.board.length / 2);
    const center2 = Math.abs(move2.to.row - gameState.board.length / 2);
    return center1 < center2;
  }
  
  // ====================================================================
  // CORE AI ALGORITHMS
  // ====================================================================

  /**
   * The core Minimax algorithm with Alpha-Beta Pruning.
   * This allows the bot to "look ahead" several moves.
   */
  minimax(state, depth, isMaximizingPlayer, alpha, beta) {
    if (depth === 0 || this.isGameOver(state)) {
      return this.evaluateBoard(state);
    }

    const possibleMoves = this.getAllValidMoves(state, isMaximizingPlayer ? Player.BOT : Player.PLAYER);

    // Handle edge case: no moves available (stalemate or blocked position)
    if (possibleMoves.length === 0) {
      return this.evaluateBoard(state); // Evaluate current position
    }

    const orderedMoves = this.orderMovesByHeuristic(state, possibleMoves, isMaximizingPlayer ? Player.BOT : Player.PLAYER);

    if (isMaximizingPlayer) {
      let maxEval = -Infinity;
      for (const move of orderedMoves) {
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
      for (const move of orderedMoves) {
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

  // === ULTRA-SMART WIZARD BOT EVALUATION SYSTEM ===
  // This wizard bot uses advanced chess-like evaluation with deep positional understanding!
  evaluateBoard(state) {
    // TERMINAL STATE CHECK - Highest priority
    if (this.isGameOver(state)) {
      const winner = this.getWinner(state);
      if (winner === Player.BOT) return 100000;    // WIN bonus
      if (winner === Player.PLAYER) return -100000; // LOSS penalty
    }

    let totalScore = 0;
    // DYNAMIC PIECE VALUES: Adjust based on game phase
    const totalPieces = this.countPieces(state.board);
    const isEndgame = totalPieces.bot + totalPieces.player <= 6;
    
    const pieceValue = { 
      [PieceType.PERSON]: isEndgame ? 150 : 100,  // Persons more valuable in endgame (can win!)
      [PieceType.CIRCLE]: isEndgame ? 200 : 180   // Circles provide strategic flexibility
    };
    
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

    // === STEP 2: PERFECT THREAT ANTICIPATION SYSTEM ===
    // Calculate all moves once and reuse for efficiency
    const botMoves = this.getAllValidMoves(state, Player.BOT);
    const playerMoves = this.getAllValidMoves(state, Player.PLAYER);
    const botCaptures = botMoves.filter(m => m.eatenPiece);
    const playerCaptures = playerMoves.filter(m => m.eatenPiece);
    
    // DEEP ANTICIPATION: Look at what player will do after ANY bot move
    // Optimize: Limit analysis for lower difficulties to improve performance
    const anticipatedThreats = [];
    const maxMovesToAnalyze = this.difficulty >= 4 ? botMoves.length : Math.min(botMoves.length, 10);
    
    for (let i = 0; i < maxMovesToAnalyze; i++) {
      const botMove = botMoves[i];
      const afterBotMove = this.simulateMove(state, botMove);
      const playerResponseMoves = this.getAllValidMoves(afterBotMove, Player.PLAYER);
      const playerResponseCaptures = playerResponseMoves.filter(m => m.eatenPiece);
      
      for (const playerResponse of playerResponseCaptures) {
        anticipatedThreats.push({
          botMove: botMove,
          playerThreat: playerResponse,
          threatenedPiece: { row: playerResponse.to.row, col: playerResponse.to.col }
        });
      }
    }
    
    // Massive penalty for moves that create threats
    totalScore -= anticipatedThreats.length * 800;

    // === STEP 3: PERFECT DEFENSIVE ANALYSIS ===
    // Every threatened piece gets IMMEDIATE attention with multiple defense options
    for (let r = 0; r < state.board.length; r++) {
      for (let c = 0; c < state.board[0].length; c++) {
        const piece = state.board[r][c];
        if (piece && piece.owner === Player.BOT) {
          
          // IMMEDIATE threat detection
          const immediateThreats = playerCaptures.filter(capture => 
            capture.to.row === r && capture.to.col === c
          );
          
          // ANTICIPATED threat detection (threats after any bot move)
          const anticipatedThreatsHere = anticipatedThreats.filter(threat =>
            threat.threatenedPiece.row === r && threat.threatenedPiece.col === c
          );
          
          const totalThreats = immediateThreats.length + anticipatedThreatsHere.length;
          
          if (totalThreats > 0) {
            // MASSIVE penalty for being threatened - wizard bot hates losing pieces!
            totalScore -= totalThreats * 3000;
            
            // === DEFENSE OPTION 1: SAFE RETREAT ===
            const retreatMoves = botMoves.filter(move => 
              move.from.row === r && move.from.col === c
            );
            
            let bestRetreatScore = -Infinity;
            let canRetreatSafely = false;
            
            for (const retreat of retreatMoves) {
              const afterRetreat = this.simulateMove(state, retreat);
              
              // Check if retreat position is safe from ALL player responses
              const playerMovesAfterRetreat = this.getAllValidMoves(afterRetreat, Player.PLAYER);
              const retreatThreatened = playerMovesAfterRetreat.some(capture => 
                capture.eatenPiece && 
                capture.to.row === retreat.to.row && 
                capture.to.col === retreat.to.col
              );
              
              if (!retreatThreatened) {
                canRetreatSafely = true;
                
                // Score this retreat based on strategic value
                let retreatScore = 2000; // Base retreat bonus
                
                // Bonus for retreating to a more forward position
                if (retreat.to.col > retreat.from.col) {
                  retreatScore += 500;
                }
                
                // Bonus for retreating near other friendly pieces (mutual support)
                const nearbyFriendlies = this.countNearbyFriendlies(retreat.to.row, retreat.to.col, afterRetreat.board);
                retreatScore += nearbyFriendlies * 300;
                
                bestRetreatScore = Math.max(bestRetreatScore, retreatScore);
              }
            }
            
            if (canRetreatSafely) {
              totalScore += bestRetreatScore;
            }
            
            // === DEFENSE OPTION 2: COUNTER-ATTACK ===
            const attackerPositions = immediateThreats.map(threat => ({ row: threat.from.row, col: threat.from.col }));
            const canCounterAttack = botCaptures.some(capture => 
              attackerPositions.some(attacker => 
                attacker.row === capture.to.row && attacker.col === capture.to.col
              )
            );
            
            if (canCounterAttack) {
              totalScore += 4000; // HUGE bonus for eliminating the threat directly!
            }
            
            // === DEFENSE OPTION 3: PROTECTIVE POSITIONING ===
            let canBeDefended = false;
            let bestDefenseScore = 0;
            
            for (const defenseMove of botMoves) {
              if (defenseMove.from.row === r && defenseMove.from.col === c) continue; // Skip the threatened piece itself
              
              const afterDefense = this.simulateMove(state, defenseMove);
              const playerMovesAfterDefense = this.getAllValidMoves(afterDefense, Player.PLAYER);
              
              // Check if this defensive move eliminates the threat
              const stillThreatened = playerMovesAfterDefense.some(capture => 
                capture.eatenPiece && 
                capture.to.row === r && 
                capture.to.col === c
              );
              
              if (!stillThreatened) {
                canBeDefended = true;
                
                // Score this defense based on multiple factors
                let defenseScore = 1500; // Base defense bonus
                
                // Bonus if the defending piece also advances
                if (defenseMove.to.col > defenseMove.from.col) {
                  defenseScore += 300;
                }
                
                // Bonus if the defending piece also threatens the opponent
                const afterDefensePlayerPieces = this.getAllValidMoves(afterDefense, Player.PLAYER);
                const defendingPieceThreats = this.getAllValidMoves(afterDefense, Player.BOT)
                  .filter(m => m.eatenPiece && m.from.row === defenseMove.to.row && m.from.col === defenseMove.to.col);
                defenseScore += defendingPieceThreats.length * 400;
                
                bestDefenseScore = Math.max(bestDefenseScore, defenseScore);
              }
            }
            
            if (canBeDefended) {
              totalScore += bestDefenseScore;
            }
            
            // === ULTIMATE PENALTY: NO DEFENSE AVAILABLE ===
            if (!canRetreatSafely && !canCounterAttack && !canBeDefended) {
              totalScore -= 8000; // MASSIVE penalty for helpless pieces!
            }
          }
        }
      }
    }

    // === STEP 4: PERFECT SAFE CAPTURE SYSTEM ===
    // Wizard bot only captures when it's 100% safe or strategically brilliant!
    for (const captureMove of botCaptures) {
      const afterCapture = this.simulateMove(state, captureMove);
      
      // SAFETY CHECK 1: Can player immediately counter-attack?
      const playerMovesAfterCapture = this.getAllValidMoves(afterCapture, Player.PLAYER);
      const immediateCounterAttacks = playerMovesAfterCapture.filter(m => 
        m.eatenPiece && 
        m.to.row === captureMove.to.row && 
        m.to.col === captureMove.to.col
      );
      
      if (immediateCounterAttacks.length === 0) {
        // PERFECT! Completely safe capture
        const capturedPiece = state.board[captureMove.to.row][captureMove.to.col];
        const captureValue = pieceValue[capturedPiece.type];
        totalScore += captureValue * 4; // Massive bonus for safe captures!
        
        // Extra bonus if this capture also advances our position
        if (captureMove.to.col > captureMove.from.col) {
          totalScore += 1000;
        }
        
        // Extra bonus if this capture threatens more enemy pieces
        const threatsAfterCapture = this.getAllValidMoves(afterCapture, Player.BOT)
          .filter(m => m.eatenPiece && m.from.row === captureMove.to.row && m.from.col === captureMove.to.col);
        totalScore += threatsAfterCapture.length * 600;
        
      } else {
        // DANGER! There are counter-attacks - analyze deeply
        let worstCaseScore = Infinity;
        
        for (const counterAttack of immediateCounterAttacks) {
          const afterCounterAttack = this.simulateMove(afterCapture, counterAttack);
          
          // Can we recapture immediately?
          const botRecaptureMoves = this.getAllValidMoves(afterCounterAttack, Player.BOT)
            .filter(m => m.eatenPiece && 
              m.to.row === counterAttack.to.row && 
              m.to.col === counterAttack.to.col
            );
          
          if (botRecaptureMoves.length > 0) {
            // Evaluate recapture to determine if trade is favorable
            let bestRecaptureScore = -Infinity;
            
            for (const recapture of botRecaptureMoves) {
              const afterRecapture = this.simulateMove(afterCounterAttack, recapture);
              
              // Check if our recapturing piece is safe
              const playerResponseToRecapture = this.getAllValidMoves(afterRecapture, Player.PLAYER)
                .filter(m => m.eatenPiece && 
                  m.to.row === recapture.to.row && 
                  m.to.col === recapture.to.col
                );
              
              if (playerResponseToRecapture.length === 0) {
                // Perfect! We win the trade
                bestRecaptureScore = 3000;
              } else {
                // Continues the trade - analyze piece values
                const ourPiece = state.board[captureMove.from.row][captureMove.from.col];
                const theirPiece = state.board[captureMove.to.row][captureMove.to.col];
                const recapturingPiece = state.board[recapture.from.row][recapture.from.col];
                
                const tradeValue = pieceValue[theirPiece.type] - pieceValue[ourPiece.type];
                bestRecaptureScore = tradeValue * 2;
              }
            }
            
            worstCaseScore = Math.min(worstCaseScore, bestRecaptureScore);
            
          } else {
            // BAD! We lose the piece for nothing
            const ourPiece = state.board[captureMove.from.row][captureMove.from.col];
            worstCaseScore = Math.min(worstCaseScore, -pieceValue[ourPiece.type] * 3);
          }
        }
        
        // Apply the worst-case scenario score
        totalScore += worstCaseScore;
        
        // Additional penalty for risky captures
        totalScore -= immediateCounterAttacks.length * 800;
      }
    }

    // === STEP 5: PERFECT STRATEGIC POSITIONING SYSTEM ===
    // Wizard bot dominates through superior positioning and board control!
    
    // STRATEGIC ADVANCEMENT: Push towards victory with intelligence
    for (const move of botMoves) {
      // Base advancement bonus
      if (move.to.col > move.from.col) {
        const advancementBonus = (move.to.col - move.from.col) * 400; // Higher bonus for bigger advances
        totalScore += advancementBonus;
      }
      
      // MASSIVE bonus for breakthrough pieces near victory
      if (move.to.col >= state.board[0].length - 2) {
        totalScore += 3000; // HUGE bonus for near-victory positions!
        
        // Extra bonus if this piece is a person (can win)
        const movingPiece = state.board[move.from.row][move.from.col];
        if (movingPiece.type === PieceType.PERSON) {
          totalScore += 5000; // VICTORY IS NEAR!
        }
      }
      
      // FORMATION CONTROL: Strategic positioning bonuses
      const afterMove = this.simulateMove(state, move);
      
      // Bonus for controlling key squares (center and forward positions)
      if (move.to.row >= 1 && move.to.row < state.board.length - 1 && 
          move.to.col >= state.board[0].length / 2) {
        totalScore += 800; // Control the center-forward area
      }
      
      // Bonus for supporting other pieces
      const nearbySupport = this.countNearbyFriendlies(move.to.row, move.to.col, afterMove.board);
      totalScore += nearbySupport * 400; // Teamwork is powerful!
      
      // Bonus for creating multiple threats from this position
      const threatsFromNewPosition = this.getAllValidMoves(afterMove, Player.BOT)
        .filter(m => m.eatenPiece && m.from.row === move.to.row && m.from.col === move.to.col);
      totalScore += threatsFromNewPosition.length * 600;
      
      // Penalty for moving pieces backwards unless absolutely necessary
      if (move.to.col < move.from.col) {
        totalScore -= 300; // Discourage retreats unless for defense
      }
    }
    
    // INTELLIGENT PLAYER THREAT ANALYSIS
    if (playerCaptures.length > 0) {
      // Categorize threats by danger level
      let criticalThreats = 0;
      let normalThreats = 0;
      
      for (const playerCapture of playerCaptures) {
        const threatenedPiece = state.board[playerCapture.to.row][playerCapture.to.col];
        
        if (threatenedPiece) {
          // Critical if it's a valuable piece or near our goal
          if (threatenedPiece.type === PieceType.CIRCLE || playerCapture.to.col >= state.board[0].length - 3) {
            criticalThreats++;
          } else {
            normalThreats++;
          }
          
          // Check if we can block this specific threat
          const canBlockThisThreat = botMoves.some(move => {
            const afterBlock = this.simulateMove(state, move);
            const playerMovesAfterBlock = this.getAllValidMoves(afterBlock, Player.PLAYER);
            return !playerMovesAfterBlock.some(capture => 
              capture.eatenPiece && 
              capture.to.row === playerCapture.to.row && 
              capture.to.col === playerCapture.to.col
            );
          });
          
          if (canBlockThisThreat) {
            if (threatenedPiece.type === PieceType.CIRCLE) {
              totalScore += 1500; // High bonus for blocking threats to circles
            } else {
              totalScore += 800; // Medium bonus for blocking person threats
            }
          } else {
            // Can't block - apply penalty based on threat level
            if (threatenedPiece.type === PieceType.CIRCLE) {
              totalScore -= 2000; // Heavy penalty for unstoppable circle threats
            } else {
              totalScore -= 800; // Medium penalty for unstoppable person threats
            }
          }
        }
      }
      
      // Overall threat pressure penalty
      totalScore -= criticalThreats * 1000; // Higher penalty for critical threats
      totalScore -= normalThreats * 400;    // Lower penalty for normal threats
    }

    // === STEP 6: PERFECT TRAP DETECTION SYSTEM ===
    // Wizard bot sees all traps and never falls for them!
    for (const move of botMoves) {
      const afterMove = this.simulateMove(state, move);
      const playerResponseMoves = this.getAllValidMoves(afterMove, Player.PLAYER);
      const playerCaptureMoves = playerResponseMoves.filter(m => m.eatenPiece);
      
      // ADVANCED TRAP ANALYSIS
      if (playerCaptureMoves.length > 0) {
        // Check if this move puts our piece in a crossfire
        const movingPieceThreats = playerCaptureMoves.filter(capture => 
          capture.to.row === move.to.row && capture.to.col === move.to.col
        );
        
        if (movingPieceThreats.length >= 2) {
          // DANGER! Multiple pieces can capture our piece - likely a trap
          totalScore -= 3000; // MASSIVE penalty for walking into crossfire
          
          // Even worse if it's a valuable piece
          const movingPiece = state.board[move.from.row][move.from.col];
          if (movingPiece.type === PieceType.CIRCLE) {
            totalScore -= 2000; // Extra penalty for endangering circles
          }
        } else if (movingPieceThreats.length === 1) {
          // Single threat - check if we can counter-attack or escape
          const threat = movingPieceThreats[0];
          const afterThreat = this.simulateMove(afterMove, threat);
          
          // Can we counter-attack the threatening piece?
          const counterMoves = this.getAllValidMoves(afterThreat, Player.BOT)
            .filter(m => m.eatenPiece && 
              m.to.row === threat.from.row && 
              m.to.col === threat.from.col
            );
          
          if (counterMoves.length > 0) {
            totalScore += 500; // Good! We can fight back
          } else {
            totalScore -= 1500; // Bad! We're in danger with no response
          }
        }
      }
      
      // FORMATION AND CONTROL BONUSES
      if (move.to.row > 0 && move.to.row < state.board.length - 1 && 
          move.to.col > 0 && move.to.col < state.board[0].length - 1) {
        totalScore += 300; // Bonus for central control
        
        // Extra bonus if this creates a strong formation
        const friendliesNearby = this.countNearbyFriendlies(move.to.row, move.to.col, afterMove.board);
        if (friendliesNearby >= 2) {
          totalScore += 600; // Strong formation bonus!
        }
      }
      
      // COORDINATED ATTACK BONUS
      if (move.to.col > move.from.col) {
        // Check if this forward move coordinates with other pieces
        const coordinatedMoves = botMoves.filter(otherMove => 
          otherMove !== move && 
          otherMove.to.col > otherMove.from.col && 
          Math.abs(otherMove.to.row - move.to.row) <= 2
        );
        
        totalScore += coordinatedMoves.length * 200; // Coordinated advance bonus
      }
    }

    // === STEP 7: PERFECT COORDINATION AND FORMATION SYSTEM ===
    // Wizard bot creates unbeatable formations and coordinates perfectly!
    
    // PIECE COORDINATION ANALYSIS
    let isolatedPieces = 0;
    let strongFormations = 0;
    let advancedFormations = 0;
    
    for (let r = 0; r < state.board.length; r++) {
      for (let c = 0; c < state.board[0].length; c++) {
        const piece = state.board[r][c];
        if (piece && piece.owner === Player.BOT) {
          const friendlyNeighbors = this.countNearbyFriendlies(r, c, state.board);
          
          if (friendlyNeighbors === 0) {
            isolatedPieces++;
            totalScore -= 400; // Penalty for isolated pieces
          } else if (friendlyNeighbors >= 2) {
            strongFormations++;
            totalScore += friendlyNeighbors * 300; // Strong formation bonus
            
            // Extra bonus for advanced formations (near enemy territory)
            if (c >= state.board[0].length / 2) {
              advancedFormations++;
              totalScore += 500; // Advanced formation bonus
            }
          } else {
            totalScore += friendlyNeighbors * 150; // Basic coordination bonus
          }
          
          // SPECIAL FORMATION PATTERNS
          
          // Diagonal formation bonus (pieces supporting each other diagonally)
          const diagonalSupport = this.countDiagonalFriendlies(r, c, state.board);
          if (diagonalSupport >= 2) {
            totalScore += 400; // Diagonal formation strength
          }
          
          // Forward line formation (pieces advancing together)
          if (c >= state.board[0].length / 2) {
            const sameColumnFriendlies = this.countSameColumnFriendlies(r, c, state.board);
            totalScore += sameColumnFriendlies * 300; // Column advancement bonus
          }
          
          // Protective wall formation (pieces protecting each other)
          if (piece.type === PieceType.CIRCLE) {
            const protectingPersons = this.countProtectingPersons(r, c, state.board);
            totalScore += protectingPersons * 500; // Circles protected by persons
          }
        }
      }
    }
    
    // OVERALL FORMATION ASSESSMENT
    if (isolatedPieces === 0) {
      totalScore += 1000; // Perfect! No isolated pieces
    }
    
    if (strongFormations >= 2) {
      totalScore += 800; // Multiple strong formations
    }
    
    if (advancedFormations >= 1) {
      totalScore += 1200; // Advanced position control
    }
    
    // === STEP 6: ULTRA-ADVANCED TACTICAL PATTERNS ===
    
    // MOBILITY ADVANTAGE: More moves = more control (chess concept)
    totalScore += botMoves.length * 80;
    totalScore -= playerMoves.length * 90;
    
    // FORK DETECTION: One piece threatening multiple enemy pieces
    for (const move of botCaptures) {
      const afterMove = this.simulateMove(state, move);
      const newCaptures = this.getAllValidMoves(afterMove, Player.BOT).filter(m => m.eatenPiece);
      const uniqueTargets = new Set(newCaptures.map(m => `${m.to.row},${m.to.col}`));
      if (uniqueTargets.size >= 2) {
        totalScore += 2000 * uniqueTargets.size; // MASSIVE bonus for forking multiple pieces!
      }
    }
    
    // DISCOVERED ATTACK: Moving one piece reveals attack from another
    for (const move of botMoves) {
      if (!move.eatenPiece) { // Non-capture moves
        const afterMove = this.simulateMove(state, move);
        const newCaptures = this.getAllValidMoves(afterMove, Player.BOT).filter(m => m.eatenPiece);
        const oldCaptures = botCaptures;
        
        // If we gain new captures by moving (not from the moving piece), it's a discovered attack
        const discoveredCaptures = newCaptures.filter(newCap => 
          !oldCaptures.some(oldCap => 
            oldCap.from.row === newCap.from.row && oldCap.from.col === newCap.from.col
          ) && !(newCap.from.row === move.to.row && newCap.from.col === move.to.col)
        );
        
        if (discoveredCaptures.length > 0) {
          totalScore += 1500 * discoveredCaptures.length; // Discovered attack bonus!
        }
      }
    }
    
    // SKEWER DETECTION: Threatening a piece with more valuable piece behind it
    for (let r = 0; r < state.board.length; r++) {
      for (let c = 0; c < state.board[0].length; c++) {
        const piece = state.board[r][c];
        if (piece && piece.owner === Player.PLAYER) {
          // Check horizontal lines (left-right)
          for (let dc = c + 1; dc < state.board[0].length; dc++) {
            const behindPiece = state.board[r][dc];
            if (behindPiece) {
              if (behindPiece.owner === Player.PLAYER && behindPiece.type === PieceType.PERSON) {
                // Person behind another piece - potential skewer!
                const canAttack = botCaptures.some(cap => cap.to.row === r && cap.to.col === c);
                if (canAttack) {
                  totalScore += 800; // Skewer opportunity!
                }
              }
              break;
            }
          }
          
          // Check diagonal lines
          const diagonalDirections = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
          for (const [dr, dc] of diagonalDirections) {
            let nr = r + dr;
            let nc = c + dc;
            while (nr >= 0 && nr < state.board.length && nc >= 0 && nc < state.board[0].length) {
              const diagonalPiece = state.board[nr][nc];
              if (diagonalPiece) {
                if (diagonalPiece.owner === Player.PLAYER && diagonalPiece.type === PieceType.PERSON) {
                  const canAttack = botCaptures.some(cap => cap.to.row === r && cap.to.col === c);
                  if (canAttack) {
                    totalScore += 600; // Diagonal skewer!
                  }
                }
                break;
              }
              nr += dr;
              nc += dc;
            }
          }
        }
      }
    }
    
    // === STEP 7: SUPER-SMART ENDGAME EVALUATION ===
    if (isEndgame) {
      // PERSON RACE: In endgame, advancing persons is everything!
      for (let r = 0; r < state.board.length; r++) {
        for (let c = 0; c < state.board[0].length; c++) {
          const piece = state.board[r][c];
          if (piece && piece.type === PieceType.PERSON) {
            if (piece.owner === Player.BOT) {
              // Exponential bonus for advancement
              const advancementBonus = Math.pow(c + 1, 2) * 150;
              totalScore += advancementBonus;
              
              // Critical: Person about to win
              if (c >= state.board[0].length - 2) {
                totalScore += 8000;
              }
              if (c === state.board[0].length - 1) {
                totalScore += 15000; // ONE MOVE FROM VICTORY!
              }
              
              // Path clearance bonus
              let pathClear = true;
              for (let checkCol = c + 1; checkCol < state.board[0].length; checkCol++) {
                if (state.board[r][checkCol]) {
                  pathClear = false;
                  break;
                }
              }
              if (pathClear) {
                totalScore += 3000; // Clear path to victory!
              }
              
              // Support from behind
              if (c > 0 && state.board[r][c - 1] && state.board[r][c - 1].owner === Player.BOT) {
                totalScore += 1000; // Protected advance
              }
            } else {
              // STOP ENEMY PERSONS AT ALL COSTS!
              const distanceToWin = state.board[0].length - 1 - c;
              const threatLevel = Math.pow(6 - distanceToWin, 2) * 200;
              totalScore -= threatLevel;
              
              // EMERGENCY: Enemy about to win
              if (distanceToWin <= 1) {
                totalScore -= 10000;
              }
              if (distanceToWin === 0) {
                totalScore -= 20000; // GAME OVER NEXT TURN!
              }
              
              // Check if we can block/capture this person
              const canCapture = botCaptures.some(cap => cap.to.row === r && cap.to.col === c);
              if (canCapture) {
                totalScore += 4000; // Critical defensive capture!
              }
            }
          }
        }
      }
      
      // ACTIVITY IS EVERYTHING in endgame
      totalScore += botMoves.length * 150;
      totalScore -= playerMoves.length * 200;
      
      // CIRCLE POWER in endgame (flexible movement)
      for (let r = 0; r < state.board.length; r++) {
        for (let c = 0; c < state.board[0].length; c++) {
          const piece = state.board[r][c];
          if (piece && piece.type === PieceType.CIRCLE) {
            if (piece.owner === Player.BOT) {
              // Active circles can support person advances
              totalScore += 400;
              
              // Circles ahead of persons can clear paths
              let personsBelow = 0;
              for (let checkRow = 0; checkRow < state.board.length; checkRow++) {
                if (state.board[checkRow][c] && 
                    state.board[checkRow][c].type === PieceType.PERSON &&
                    state.board[checkRow][c].owner === Player.BOT &&
                    c < state.board[0].length - 1) {
                  personsBelow++;
                }
              }
              totalScore += personsBelow * 500; // Supporting person advances
            }
          }
        }
      }
    }
    
    // === STEP 8: TEMPO AND INITIATIVE ===
    // Prefer positions where we force opponent to react
    const forcingMoves = botCaptures.length + botMoves.filter(m => {
      const afterMove = this.simulateMove(state, m);
      const playerResponses = this.getAllValidMoves(afterMove, Player.PLAYER);
      const forcedDefense = playerResponses.filter(r => {
        // Check if player is forced to defend
        return r.from.row === m.to.row && r.from.col === m.to.col;
      });
      return forcedDefense.length > 0;
    }).length;
    
    totalScore += forcingMoves * 250; // Initiative bonus

    // === STEP 9: THREAT MAP AND PIECE SAFETY ===
    const threatMaps = this.buildThreatMaps(state);
    totalScore += this.evaluateThreatSafety(state, threatMaps, pieceValue);

    // === STEP 10: RISK VS REWARD ANALYSIS ===
    totalScore += this.evaluateRiskReward(state, botMoves, playerMoves, pieceValue);

    // === STEP 11: MOBILITY BALANCE ===
    totalScore += this.evaluateMobilityBalance(botMoves, playerMoves);

    // === STEP 12: LANE CONTROL AND BLOCKADES ===
    totalScore += this.evaluateLaneControl(state);

    // === STEP 13: PROTECTION CHAINS AND FORMATIONS ===
    totalScore += this.evaluateProtectionChains(state);

    // === STEP 14: MOVE ANTICIPATION ===
    if (this.difficulty >= 4) {
      totalScore += this.evaluateMoveAnticipation(state);
    }

    // === STEP 15: CENTER AND EDGE CONTROL ===
    totalScore += this.evaluateCenterAndEdgeControl(state);

    // === STEP 16: ADVANCE PATHS AND GOAL PRESSURE ===
    totalScore += this.evaluateAdvancePaths(state);

    // === STEP 17: DEFENSIVE NETS ===
    totalScore += this.evaluateDefensiveNet(state, threatMaps);

    // === STEP 18: OFFENSIVE PRESSURE ===
    totalScore += this.evaluateOffensivePressure(state, threatMaps);
    totalScore += this.evaluateOffensivePressure(state, threatMaps) * 0.5;

    // === STEP 19: PIECE ACTIVITY ===
    totalScore += this.evaluatePieceActivity(state);

    // === STEP 20: STALEMATE AVOIDANCE ===
    totalScore += this.evaluateStalemateAvoidance(state, botMoves, playerMoves);

    // === STEP 21: CAPTURE NETS ===
    totalScore += this.evaluateCaptureNet(state, botMoves);

    // === STEP 22: BLOCKADE POTENTIAL ===
    totalScore += this.evaluateBlockadePotential(state);

    // === STEP 23: ESCAPE SQUARES ===
    totalScore += this.evaluateEscapeSquares(state, threatMaps);

    // === STEP 24: DIAGONAL CONTROL ===
    totalScore += this.evaluateDiagonalControl(state);

    // === STEP 25: COLUMN PRESSURE ===
    totalScore += this.evaluateColumnPressure(state);

    // === STEP 26: COUNTER-ATTACK POTENTIAL ===
    totalScore += this.evaluateCounterAttackPotential(state, botMoves);

    // === STEP 27: SACRIFICE VALUE (RISK VS REWARD) ===
    totalScore += this.evaluateSacrificePotential(state, botMoves, pieceValue);

    // === STEP 28: PIECE PAIRING COHESION ===
    totalScore += this.evaluatePiecePairing(state);

    // === STEP 29: SPACING DISCIPLINE ===
    totalScore += this.evaluateSpacingDiscipline(state);
    
    return totalScore;
  }
  
  // ====================================================================
  // GAME MECHANICS AND VALIDATION
  // ====================================================================

  // ====================================================================
  // ADVANCED MOVE ORDERING AND EVALUATION (WIZARD EXTENSIONS)
  // These methods add deeper strategic thinking, safer captures, and
  // stronger defensive/offensive awareness.
  // ====================================================================

  orderMovesByHeuristic(state, moves, player) {
    // Stable sort by heuristic score: captures, advancement, safety, center
    const scoredMoves = moves.map(move => {
      const isCapture = !!move.eatenPiece;
      const advance = move.to.col - move.from.col;
      const advancementScore = player === Player.BOT ? advance : -advance;
      const centerScore = -Math.abs(move.to.row - Math.floor(state.board.length / 2));
      const safe = this.isMoveImmediatelySafe(state, move, player) ? 1 : 0;
      const learnedScore = this.getLearnedMoveScore(state, move);

      const score =
        (isCapture ? 1000 : 0) +
        advancementScore * 20 +
        centerScore * 5 +
        safe * 150 +
        learnedScore;

      return { move, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves.map(s => s.move);
  }

  isMoveSafeWithCounterplay(state, move) {
    const afterMove = this.simulateMove(state, move);
    const playerMoves = this.getAllValidMoves(afterMove, Player.PLAYER);
    const playerCaptures = playerMoves.filter(m => m.eatenPiece);

    const directCaptures = playerCaptures.filter(capture =>
      capture.to.row === move.to.row && capture.to.col === move.to.col
    );

    if (directCaptures.length === 0) {
      return true;
    }

    // Allow if the bot can immediately recapture the capturing piece
    for (const capture of directCaptures) {
      const afterCapture = this.simulateMove(afterMove, capture);
      const botReplies = this.getAllValidMoves(afterCapture, Player.BOT);
      const botRecaptures = botReplies.filter(m => m.eatenPiece);
      const canRecapture = botRecaptures.some(reply =>
        reply.to.row === capture.to.row && reply.to.col === capture.to.col
      );
      if (canRecapture) {
        return true;
      }
    }

    return false;
  }

  isBlunderMove(state, move) {
    if (this.isImmediateBotWin(state, move)) {
      return false;
    }
    const afterMove = this.simulateMove(state, move);
    const playerMoves = this.getAllValidMoves(afterMove, Player.PLAYER);
    const playerCaptures = playerMoves.filter(m => m.eatenPiece);
    const directCaptures = playerCaptures.filter(capture =>
      capture.to.row === move.to.row && capture.to.col === move.to.col
    );
    if (directCaptures.length === 0) {
      return false;
    }
    return !this.isMoveSafeWithCounterplay(state, move);
  }

  isImmediateBotWin(state, move) {
    return move.to.col === state.board[0].length - 1;
  }

  getBasePieceValue(piece) {
    if (!piece) return 0;
    if (piece.type === PieceType.CIRCLE) return 180;
    return 100; // person
  }

  evaluateImmediateCaptureRisk(state, move) {
    const afterMove = this.simulateMove(state, move);
    const playerMoves = this.getAllValidMoves(afterMove, Player.PLAYER);
    const playerCaptures = playerMoves.filter(m => m.eatenPiece);
    if (playerCaptures.length === 0) return 0;

    let worstNetLoss = 0;
    for (const capture of playerCaptures) {
      const capturedPiece = afterMove.board[capture.to.row]?.[capture.to.col];
      const capturedValue = this.getBasePieceValue(capturedPiece);

      const afterCapture = this.simulateMove(afterMove, capture);
      const botReplies = this.getAllValidMoves(afterCapture, Player.BOT);
      const botRecaptures = botReplies.filter(m => m.eatenPiece);
      const canRecapture = botRecaptures.some(reply =>
        reply.to.row === capture.to.row && reply.to.col === capture.to.col
      );

      if (!canRecapture) {
        worstNetLoss = Math.max(worstNetLoss, capturedValue);
      } else {
        // If we can recapture, estimate reduced loss
        worstNetLoss = Math.max(worstNetLoss, capturedValue * 0.4);
      }
    }

    return worstNetLoss * 3; // strong penalty for immediate tactical loss
  }

  countImmediatePlayerWins(state) {
    const playerMoves = this.getAllValidMoves(state, Player.PLAYER);
    return playerMoves.filter(move => move.to.col === 0).length;
  }

  isMoveImmediatelySafe(state, move, player) {
    const afterMove = this.simulateMove(state, move);
    const opponent = player === Player.BOT ? Player.PLAYER : Player.BOT;
    const opponentMoves = this.getAllValidMoves(afterMove, opponent);
    const opponentCaptures = opponentMoves.filter(m => m.eatenPiece);
    return !opponentCaptures.some(cap => cap.to.row === move.to.row && cap.to.col === move.to.col);
  }

  buildThreatMaps(state) {
    return {
      bot: this.buildThreatMapForPlayer(state.board, Player.BOT),
      player: this.buildThreatMapForPlayer(state.board, Player.PLAYER)
    };
  }

  getLearnedMoveScore(state, move) {
    if (typeof localStorage === 'undefined') return 0;
    const piece = state.board[move.from.row]?.[move.from.col];
    if (!piece) return 0;
    const key = `${piece.type}:${move.from.row},${move.from.col}->${move.to.row},${move.to.col}`;
    const goodMoves = this.readLearnedList('botGoodMoves');
    const badMoves = this.readLearnedList('botBadMoves');

    if (badMoves.includes(key)) return -800;
    if (goodMoves.includes(key)) return 250;
    return 0;
  }

  readLearnedList(storageKey) {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  buildThreatMapForPlayer(board, player) {
    const rows = board.length;
    const cols = board[0].length;
    const map = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const piece = board[r][c];
        if (!piece || piece.owner !== player) continue;
        const attacks = this.getAttackSquares(board, r, c, piece);
        for (const pos of attacks) {
          map[pos.row][pos.col] += 1;
        }
      }
    }

    return map;
  }

  getAttackSquares(board, row, col, piece) {
    const positions = [];
    const rows = board.length;
    const cols = board[0].length;

    if (piece.type === PieceType.PERSON) {
      const diagonals = [
        { dr: -1, dc: -1 },
        { dr: -1, dc: 1 },
        { dr: 1, dc: -1 },
        { dr: 1, dc: 1 }
      ];
      for (const d of diagonals) {
        const r = row + d.dr;
        const c = col + d.dc;
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          positions.push({ row: r, col: c });
        }
      }
    } else {
      // Circle attacks all adjacent squares
      const directions = [
        { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
        { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
        { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
        { dr: 1, dc: -1 }, { dr: 1, dc: 1 }
      ];
      for (const d of directions) {
        const r = row + d.dr;
        const c = col + d.dc;
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          positions.push({ row: r, col: c });
        }
      }
    }

    return positions;
  }

  evaluateThreatSafety(state, threatMaps, pieceValue) {
    let score = 0;
    const board = state.board;

    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        const value = pieceValue[piece.type] || 100;
        const attackedByPlayer = threatMaps.player[r][c] > 0;
        const attackedByBot = threatMaps.bot[r][c] > 0;

        if (piece.owner === Player.BOT) {
          if (attackedByPlayer && !attackedByBot) {
            score -= value * 0.7; // hanging piece (bad, but allow attack)
          } else if (attackedByPlayer && attackedByBot) {
            score -= value * 0.3; // contested
          } else if (!attackedByPlayer && attackedByBot) {
            score += value * 0.1; // defended and safe
          }
        } else {
          if (attackedByBot && !attackedByPlayer) {
            score += value * 0.7; // opponent piece is hanging
          } else if (attackedByBot && attackedByPlayer) {
            score += value * 0.2;
          }
        }
      }
    }

    return score;
  }

  evaluateRiskReward(state, botMoves, playerMoves, pieceValue) {
    let score = 0;

    const botCaptures = botMoves.filter(m => m.eatenPiece);
    const playerCaptures = playerMoves.filter(m => m.eatenPiece);

    for (const move of botCaptures) {
      const afterMove = this.simulateMove(state, move);
      const opponentReplies = this.getAllValidMoves(afterMove, Player.PLAYER);
      const recaptures = opponentReplies.filter(r => r.eatenPiece);

      const capturedPiece = state.board[move.to.row][move.to.col];
      const movingPiece = state.board[move.from.row][move.from.col];

      const gain = capturedPiece ? pieceValue[capturedPiece.type] : 0;
      const risk = movingPiece ? pieceValue[movingPiece.type] : 0;

      const isRecaptured = recaptures.some(r => r.to.row === move.to.row && r.to.col === move.to.col);
      if (isRecaptured) {
        score += gain * 0.3 - risk * 1.1;
      } else {
        score += gain * 0.9;
      }
    }

    for (const move of playerCaptures) {
      const capturedPiece = state.board[move.to.row][move.to.col];
      const movingPiece = state.board[move.from.row][move.from.col];
      const loss = capturedPiece ? pieceValue[capturedPiece.type] : 0;
      const risk = movingPiece ? pieceValue[movingPiece.type] : 0;
      score -= loss * 0.6;
      score += risk * 0.1; // if their capture exposes risk, small relief
    }

    return score;
  }

  evaluateMobilityBalance(botMoves, playerMoves) {
    const botMobility = botMoves.length;
    const playerMobility = playerMoves.length;
    const mobilityEdge = botMobility - playerMobility;

    // Favor positions where the bot can maneuver more than the player
    return mobilityEdge * 20;
  }

  evaluateLaneControl(state) {
    let score = 0;
    const board = state.board;
    const cols = board[0].length;

    for (let c = 0; c < cols; c++) {
      let botCount = 0;
      let playerCount = 0;
      for (let r = 0; r < board.length; r++) {
        const piece = board[r][c];
        if (!piece) continue;
        if (piece.owner === Player.BOT) botCount++;
        if (piece.owner === Player.PLAYER) playerCount++;
      }

      // Bot wants control closer to the goal column
      const columnWeight = c + 1;
      score += (botCount - playerCount) * columnWeight * 15;
    }

    return score;
  }

  evaluateProtectionChains(state) {
    let score = 0;
    const board = state.board;

    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        const piece = board[r][c];
        if (!piece || piece.owner !== Player.BOT) continue;

        const nearby = this.countNearbyFriendlies(r, c, board);
        const diagonal = this.countDiagonalFriendlies(r, c, board);

        if (nearby >= 2) score += 120;
        if (diagonal >= 1) score += 80;
        if (nearby === 0 && diagonal === 0) score -= 120; // isolated
      }
    }

    // Extra bonus for "wall" chains (connected protection lines)
    score += this.evaluateDefensiveAttackWall(state);

    return score;
  }

  evaluateDefensiveAttackWall(state) {
    const board = state.board;
    const rows = board.length;
    const cols = board[0].length;
    let score = 0;

    // Horizontal chains
    for (let r = 0; r < rows; r++) {
      let chain = 0;
      for (let c = 0; c < cols; c++) {
        const piece = board[r][c];
        if (piece && piece.owner === Player.BOT) {
          chain++;
        } else {
          if (chain >= 2) score += chain * 90;
          chain = 0;
        }
      }
      if (chain >= 2) score += chain * 90;
    }

    // Diagonal chains
    for (let startCol = 0; startCol < cols; startCol++) {
      let r = 0;
      let c = startCol;
      let chain = 0;
      while (r < rows && c < cols) {
        const piece = board[r][c];
        if (piece && piece.owner === Player.BOT) {
          chain++;
        } else {
          if (chain >= 2) score += chain * 70;
          chain = 0;
        }
        r++;
        c++;
      }
      if (chain >= 2) score += chain * 70;
    }

    for (let startRow = 1; startRow < rows; startRow++) {
      let r = startRow;
      let c = 0;
      let chain = 0;
      while (r < rows && c < cols) {
        const piece = board[r][c];
        if (piece && piece.owner === Player.BOT) {
          chain++;
        } else {
          if (chain >= 2) score += chain * 70;
          chain = 0;
        }
        r++;
        c++;
      }
      if (chain >= 2) score += chain * 70;
    }

    return score;
  }

  evaluateMoveAnticipation(state) {
    let score = 0;
    const botMoves = this.getAllValidMoves(state, Player.BOT);
    const sampleSize = Math.min(botMoves.length, 8);

    for (let i = 0; i < sampleSize; i++) {
      const move = botMoves[i];
      const afterMove = this.simulateMove(state, move);
      const playerMoves = this.getAllValidMoves(afterMove, Player.PLAYER);
      const playerCaptures = playerMoves.filter(m => m.eatenPiece);

      // If player has strong capture response, penalize this move
      if (playerCaptures.length >= 2) {
        score -= 80;
      } else if (playerCaptures.length === 0) {
        score += 40; // quiet move that limits reply
      }
    }

    return score;
  }

  evaluateCenterAndEdgeControl(state) {
    let score = 0;
    const board = state.board;
    const centerRow = Math.floor(board.length / 2);

    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        const centerDistance = Math.abs(r - centerRow);
        const centerBonus = Math.max(0, 3 - centerDistance) * 20;
        const edgePenalty = (r === 0 || r === board.length - 1) ? 15 : 0;

        if (piece.owner === Player.BOT) {
          score += centerBonus;
          score -= edgePenalty;
        } else {
          score -= centerBonus * 0.8;
          score += edgePenalty * 0.6;
        }
      }
    }

    return score;
  }

  evaluateAdvancePaths(state) {
    let score = 0;
    const board = state.board;
    const lastCol = board[0].length - 1;

    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        const piece = board[r][c];
        if (!piece || piece.type !== PieceType.PERSON) continue;

        if (piece.owner === Player.BOT) {
          const forwardTargets = this.getForwardDiagonalTargets(board, r, c, true);
          const pathBonus = forwardTargets.filter(t => !board[t.row][t.col]).length * 120;
          const goalPressure = (lastCol - c) <= 1 ? 1200 : (lastCol - c) <= 2 ? 500 : 0;
          score += pathBonus + goalPressure;
        } else {
          const forwardTargets = this.getForwardDiagonalTargets(board, r, c, false);
          const pathBonus = forwardTargets.filter(t => !board[t.row][t.col]).length * 70;
          const goalPressure = c <= 1 ? 450 : 0;
          score -= pathBonus + goalPressure;
        }
      }
    }

    return score;
  }

  getForwardDiagonalTargets(board, row, col, isBot) {
    const targets = [];
    const rows = board.length;
    const direction = isBot ? 1 : -1;
    const deltas = [
      { dr: -1, dc: direction },
      { dr: 1, dc: direction }
    ];

    for (const d of deltas) {
      const r = row + d.dr;
      const c = col + d.dc;
      if (r >= 0 && r < rows && c >= 0 && c < board[0].length) {
        targets.push({ row: r, col: c });
      }
    }

    return targets;
  }

  evaluateDefensiveNet(state, threatMaps) {
    let score = 0;
    const board = state.board;

    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        const piece = board[r][c];
        if (!piece || piece.owner !== Player.BOT) continue;

        const adjacent = this.getAdjacentSquares(board, r, c);
        let defendedSquares = 0;
        let threatenedSquares = 0;

        for (const pos of adjacent) {
          if (threatMaps.bot[pos.row][pos.col] > 0) defendedSquares++;
          if (threatMaps.player[pos.row][pos.col] > 0) threatenedSquares++;
        }

        score += defendedSquares * 18;
        score -= threatenedSquares * 10;
      }
    }

    return score;
  }

  evaluateOffensivePressure(state, threatMaps) {
    let score = 0;
    const board = state.board;

    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        const piece = board[r][c];
        if (!piece || piece.owner !== Player.PLAYER) continue;

        const attacked = threatMaps.bot[r][c] > 0;
        const defended = threatMaps.player[r][c] > 0;

        if (attacked && !defended) {
          score += 260;
        } else if (attacked && defended) {
          score += 120;
        }
      }
    }

    return score;
  }

  evaluatePieceActivity(state) {
    let score = 0;
    const board = state.board;

    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        const activity = this.countPieceMoves(state, r, c, piece);
        if (piece.owner === Player.BOT) {
          score += activity * 25;
        } else {
          score -= activity * 20;
        }
      }
    }

    return score;
  }

  countPieceMoves(state, row, col, piece) {
    const moves = [];
    if (piece.type === PieceType.PERSON) {
      this.getPersonMoves(state, row, col, moves);
    } else if (piece.type === PieceType.CIRCLE) {
      this.getCircleMoves(state, row, col, moves);
    }
    return moves.length;
  }

  evaluateStalemateAvoidance(state, botMoves, playerMoves) {
    let score = 0;

    if (botMoves.length <= 1) {
      score -= 300; // near-stuck
    }

    if (playerMoves.length <= 1) {
      score += 220; // we can limit their movement
    }

    return score;
  }

  getAdjacentSquares(board, row, col) {
    const positions = [];
    const rows = board.length;
    const cols = board[0].length;

    const directions = [
      { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
      { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
      { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
      { dr: 1, dc: -1 }, { dr: 1, dc: 1 }
    ];

    for (const d of directions) {
      const r = row + d.dr;
      const c = col + d.dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        positions.push({ row: r, col: c });
      }
    }

    return positions;
  }

  evaluateCaptureNet(state, botMoves) {
    let score = 0;
    const captures = botMoves.filter(m => m.eatenPiece);

    // Reward positions where the bot can capture multiple different targets
    const targets = new Set(captures.map(m => `${m.to.row},${m.to.col}`));
    if (targets.size >= 2) {
      score += targets.size * 120;
    }

    // Encourage capture options that create follow-up capture chains
    for (const move of captures) {
      const afterMove = this.simulateMove(state, move);
      const followUps = this.getAllValidMoves(afterMove, Player.BOT).filter(m => m.eatenPiece);
      if (followUps.length >= 2) {
        score += 180;
      }
    }

    return score;
  }

  evaluateBlockadePotential(state) {
    let score = 0;
    const board = state.board;
    const rows = board.length;
    const cols = board[0].length;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const piece = board[r][c];
        if (!piece || piece.owner !== Player.BOT) continue;

        // Check if this piece blocks a player path in the same column
        let playerBehind = false;
        for (let br = 0; br < rows; br++) {
          const behindPiece = board[br][c];
          if (behindPiece && behindPiece.owner === Player.PLAYER) {
            playerBehind = true;
            break;
          }
        }

        if (playerBehind) {
          score += 70;
        }
      }
    }

    return score;
  }

  evaluateEscapeSquares(state, threatMaps) {
    let score = 0;
    const board = state.board;

    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        const piece = board[r][c];
        if (!piece || piece.owner !== Player.BOT) continue;

        const adjacent = this.getAdjacentSquares(board, r, c);
        const safeSquares = adjacent.filter(pos => this.isSquareSafe(threatMaps, pos.row, pos.col, Player.BOT));
        score += safeSquares.length * 20;
      }
    }

    return score;
  }

  isSquareSafe(threatMaps, row, col, player) {
    if (player === Player.BOT) {
      return threatMaps.player[row][col] === 0;
    }
    return threatMaps.bot[row][col] === 0;
  }

  evaluateDiagonalControl(state) {
    let score = 0;
    const board = state.board;
    const rows = board.length;
    const cols = board[0].length;

    // Count bot vs player pieces along main diagonals to estimate control
    for (let startCol = 0; startCol < cols; startCol++) {
      let botCount = 0;
      let playerCount = 0;
      let r = 0;
      let c = startCol;
      while (r < rows && c < cols) {
        const piece = board[r][c];
        if (piece) {
          if (piece.owner === Player.BOT) botCount++;
          if (piece.owner === Player.PLAYER) playerCount++;
        }
        r++;
        c++;
      }
      score += (botCount - playerCount) * 25;
    }

    for (let startRow = 1; startRow < rows; startRow++) {
      let botCount = 0;
      let playerCount = 0;
      let r = startRow;
      let c = 0;
      while (r < rows && c < cols) {
        const piece = board[r][c];
        if (piece) {
          if (piece.owner === Player.BOT) botCount++;
          if (piece.owner === Player.PLAYER) playerCount++;
        }
        r++;
        c++;
      }
      score += (botCount - playerCount) * 20;
    }

    return score;
  }

  evaluateColumnPressure(state) {
    let score = 0;
    const board = state.board;
    const cols = board[0].length;

    for (let c = 0; c < cols; c++) {
      let botAdvance = 0;
      let playerAdvance = 0;
      for (let r = 0; r < board.length; r++) {
        const piece = board[r][c];
        if (!piece) continue;
        if (piece.owner === Player.BOT) {
          botAdvance += c;
        } else {
          playerAdvance += (cols - 1 - c);
        }
      }
      score += (botAdvance - playerAdvance) * 6;
    }

    return score;
  }

  evaluateCounterAttackPotential(state, botMoves) {
    let score = 0;
    const sampleSize = Math.min(botMoves.length, 10);

    for (let i = 0; i < sampleSize; i++) {
      const move = botMoves[i];
      const afterMove = this.simulateMove(state, move);
      const playerMoves = this.getAllValidMoves(afterMove, Player.PLAYER);
      const playerCaptures = playerMoves.filter(m => m.eatenPiece);

      // If player captures, see if bot has immediate recapture
      for (const cap of playerCaptures) {
        const afterCapture = this.simulateMove(afterMove, cap);
        const botRecaptures = this.getAllValidMoves(afterCapture, Player.BOT).filter(m => m.eatenPiece);
        if (botRecaptures.length > 0) {
          score += 40;
        }
      }
    }

    return score;
  }

  evaluateSacrificePotential(state, botMoves, pieceValue) {
    let score = 0;
    const captures = botMoves.filter(m => m.eatenPiece);

    for (const move of captures) {
      const captured = state.board[move.to.row][move.to.col];
      const mover = state.board[move.from.row][move.from.col];
      if (!captured || !mover) continue;

      const gain = pieceValue[captured.type] || 100;
      const cost = pieceValue[mover.type] || 100;

      // Favor trades that win material even if recaptured
      if (gain > cost) {
        score += (gain - cost) * 0.6;
      }
    }

    return score;
  }

  evaluatePiecePairing(state) {
    let score = 0;
    const board = state.board;

    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        const neighbors = this.getAdjacentSquares(board, r, c);
        let sameTypeAllies = 0;
        let mixedAllies = 0;

        for (const pos of neighbors) {
          const other = board[pos.row][pos.col];
          if (!other || other.owner !== piece.owner) continue;
          if (other.type === piece.type) {
            sameTypeAllies++;
          } else {
            mixedAllies++;
          }
        }

        if (piece.owner === Player.BOT) {
          score += sameTypeAllies * 18;
          score += mixedAllies * 10;
        } else {
          score -= sameTypeAllies * 14;
          score -= mixedAllies * 8;
        }
      }
    }

    return score;
  }

  evaluateSpacingDiscipline(state) {
    let score = 0;
    const board = state.board;

    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        const neighbors = this.getAdjacentSquares(board, r, c);
        const friendlyNeighbors = neighbors.filter(pos => {
          const other = board[pos.row][pos.col];
          return other && other.owner === piece.owner;
        });

        if (piece.owner === Player.BOT) {
          if (friendlyNeighbors.length >= 4) score -= 60; // too clumped
          if (friendlyNeighbors.length === 1) score += 25; // balanced spacing
        } else {
          if (friendlyNeighbors.length >= 4) score += 40;
          if (friendlyNeighbors.length === 1) score -= 20;
        }
      }
    }

    return score;
  }

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
        const targetPiece = board[newRow][newCol];
        if (!targetPiece) {
          moves.push({ from: { row, col }, to: { row: newRow, col: newCol } });
        } else if (targetPiece?.owner === opponent && (piece.eatenCount || 0) < 2) {
          moves.push({ from: { row, col }, to: { row: newRow, col: newCol }, eatenPiece: { row: newRow, col: newCol } });
        }
      }
    }
  }

  /**
   * Simulates a move on a new board instance to prevent changing the original game state.
   * This is crucial for the recursive AI functions.
   * Uses efficient shallow copy for pieces since they're small objects.
   */
  simulateMove(state, move) {
    // Validate move object
    if (!move || !move.from || !move.to || 
        typeof move.from.row !== 'number' || typeof move.from.col !== 'number' ||
        typeof move.to.row !== 'number' || typeof move.to.col !== 'number') {
      console.warn('Invalid move object provided to simulateMove');
      return state;
    }
    
    // Efficient deep copy: map creates new arrays, spread operator copies piece objects
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
    // Validate that inputs are numbers and within bounds
    return (
      typeof row === 'number' && typeof col === 'number' &&
      typeof boardRows === 'number' && typeof boardCols === 'number' &&
      row >= 0 && row < boardRows && col >= 0 && col < boardCols
    );
  }

  isGameOver(state) {
    // Check if either player has no pieces left
    if (this.countPieces(state, Player.BOT) === 0 || this.countPieces(state, Player.PLAYER) === 0) {
      return true;
    }
    
    // Check if any person piece has reached the opposite side
    for (let r = 0; r < state.board.length; r++) {
      // Player wins if their person reaches left side (column 0)
      if (state.board[r][0]?.owner === Player.PLAYER && state.board[r][0]?.type === PieceType.PERSON) {
        return true;
      }
      // Bot wins if their person reaches right side (last column)
      if (state.board[r][state.board[0].length - 1]?.owner === Player.BOT && state.board[r][state.board[0].length - 1]?.type === PieceType.PERSON) {
        return true;
      }
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

  // ====================================================================
  // UTILITY AND HELPER FUNCTIONS
  // ====================================================================

  // Helper function to count friendly pieces near a position
  countNearbyFriendlies(row, col, board) {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (this.isValidPosition(nr, nc, board.length, board[0].length)) {
          const neighbor = board[nr][nc];
          if (neighbor && neighbor.owner === Player.BOT) {
            count++;
          }
        }
      }
    }
    return count;
  }

  // Helper function to count nearby enemy pieces (for threat detection)
  countNearbyEnemies(row, col, board, owner) {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (this.isValidPosition(nr, nc, board.length, board[0].length)) {
          const neighbor = board[nr][nc];
          if (neighbor && neighbor.owner !== owner) {
            count++;
          }
        }
      }
    }
    return count;
  }

  // Helper function to count diagonal friendly pieces (for advanced formations)
  countDiagonalFriendlies(row, col, board) {
    let count = 0;
    const diagonals = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [dr, dc] of diagonals) {
      const nr = row + dr;
      const nc = col + dc;
      if (this.isValidPosition(nr, nc, board.length, board[0].length)) {
        const neighbor = board[nr][nc];
        if (neighbor && neighbor.owner === Player.BOT) {
          count++;
        }
      }
    }
    return count;
  }

  // Helper function to count friendly pieces in the same column
  countSameColumnFriendlies(row, col, board) {
    let count = 0;
    for (let r = 0; r < board.length; r++) {
      if (r !== row && board[r][col] && board[r][col].owner === Player.BOT) {
        count++;
      }
    }
    return count;
  }

  // Helper function to count person pieces protecting a circle
  countProtectingPersons(row, col, board) {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (this.isValidPosition(nr, nc, board.length, board[0].length)) {
          const neighbor = board[nr][nc];
          if (neighbor && neighbor.owner === Player.BOT && neighbor.type === PieceType.PERSON) {
            count++;
          }
        }
      }
    }
    return count;
  }
}

// ====================================================================
// EXTERNAL INTEGRATION HELPERS
// ====================================================================

/**
 * Helper function to convert your game's board format to the GameBot's format
 * Note: The new bot uses column-based win conditions (bot wins at right column, player at left column)
 * 
 * @param {Array<Array>} board - Your game's board representation
 * @returns {Array<Array>} - Board format compatible with GameBot
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
 * 
 * @param {Move} move - Move object from GameBot
 * @returns {Object} - Move format compatible with your game
 */
export function convertMoveFromBot(move) {
  const convertedMove = {
    from: [move.from.row, move.from.col],
    to: [move.to.row, move.to.col]
  };
  
  // CRITICAL: Include capture information if this is a capture move
  if (move.eatenPiece) {
    convertedMove.eatenPiece = {
      row: move.eatenPiece.row,
      col: move.eatenPiece.col
    };
  }
  
  return convertedMove;
}
