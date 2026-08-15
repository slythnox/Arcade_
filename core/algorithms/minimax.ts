/**
 * Result of a minimax search.
 */
export interface MinimaxResult {
  score: number;
  move: number; // index of best move
}

/**
 * Generic minimax with alpha-beta pruning.
 *
 * The algorithm explores a game tree to depth `maxDepth`, pruning branches
 * that cannot improve on the current known best (alpha-beta cutoff).
 *
 * Time complexity: O(b^(d/2)) with good move ordering (vs O(b^d) naive).
 * where b = branching factor, d = search depth.
 *
 * @param moves - Array of move indices to evaluate
 * @param evaluate - Returns heuristic score for the current board state
 * @param applyMove - Applies a move, modifying state
 * @param undoMove - Reverts a move
 * @param isTerminal - Returns true if game is over
 * @param depth - Current depth (start at maxDepth)
 * @param isMaximizing - True for MAX player's turn
 * @param alpha - Best score MAX can guarantee (initially -Infinity)
 * @param beta - Best score MIN can guarantee (initially +Infinity)
 */
export function minimax(
  moves: number[],
  evaluate: () => number,
  applyMove: (move: number) => void,
  undoMove: (move: number) => void,
  isTerminal: () => boolean,
  getMoves: () => number[],
  depth: number,
  isMaximizing: boolean,
  alpha: number = -Infinity,
  beta: number = Infinity
): MinimaxResult {
  if (depth === 0 || isTerminal()) {
    return { score: evaluate(), move: -1 };
  }

  const availableMoves = getMoves();
  if (availableMoves.length === 0) {
    return { score: evaluate(), move: -1 };
  }

  let bestMove = availableMoves[0];

  if (isMaximizing) {
    let best = -Infinity;
    for (const move of availableMoves) {
      applyMove(move);
      const result = minimax([], evaluate, applyMove, undoMove, isTerminal, getMoves, depth - 1, false, alpha, beta);
      undoMove(move);
      if (result.score > best) {
        best = result.score;
        bestMove = move;
      }
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break; // Beta cutoff
    }
    return { score: best, move: bestMove };
  } else {
    let best = Infinity;
    for (const move of availableMoves) {
      applyMove(move);
      const result = minimax([], evaluate, applyMove, undoMove, isTerminal, getMoves, depth - 1, true, alpha, beta);
      undoMove(move);
      if (result.score < best) {
        best = result.score;
        bestMove = move;
      }
      beta = Math.min(beta, best);
      if (beta <= alpha) break; // Alpha cutoff
    }
    return { score: best, move: bestMove };
  }
}
