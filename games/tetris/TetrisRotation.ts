import type { TetrisPiece } from "./TetrisPiece";
import type { TetrisBoard } from "./TetrisBoard";

// Standard SRS Wall Kick Offsets for J, L, S, T, Z pieces
const JLSTZ_WALL_KICK_DATA: Record<string, [number, number][]> = {
  "0->1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "1->0": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "1->2": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "2->1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "2->3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "3->2": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "3->0": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "0->3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};

// Standard SRS Wall Kick Offsets for I piece
const I_WALL_KICK_DATA: Record<string, [number, number][]> = {
  "0->1": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "1->0": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "1->2": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  "2->1": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "2->3": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "3->2": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "3->0": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "0->3": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};

/**
 * Attempts to rotate a TetrisPiece with standard Super Rotation System (SRS) wall kicks.
 * Returns true if rotation succeeded, false if blocked.
 */
export function tryRotateSRS(
  piece: TetrisPiece,
  board: TetrisBoard,
  clockwise: boolean = true
): boolean {
  if (piece.type === "O") return true;

  const prevRotation = piece.rotationIndex;
  const nextRotation = clockwise
    ? (prevRotation + 1) % 4
    : (prevRotation + 3) % 4;

  const kickKey = `${prevRotation}->${nextRotation}`;
  const kickOffsets =
    piece.type === "I"
      ? I_WALL_KICK_DATA[kickKey] || [[0, 0]]
      : JLSTZ_WALL_KICK_DATA[kickKey] || [[0, 0]];

  // Rotate piece matrix
  const testPiece = piece.clone();
  if (clockwise) {
    testPiece.rotateCW();
  } else {
    testPiece.rotateCCW();
  }

  // Try each kick offset [dx, dy]
  for (const [dx, dy] of kickOffsets) {
    testPiece.x = piece.x + dx;
    testPiece.y = piece.y - dy; // In SRS kick tables, +Y is upward, so we subtract for screen coords

    if (board.isValidPosition(testPiece)) {
      // Rotation and kick succeeded!
      if (clockwise) {
        piece.rotateCW();
      } else {
        piece.rotateCCW();
      }
      piece.x = testPiece.x;
      piece.y = testPiece.y;
      return true;
    }
  }

  return false;
}
