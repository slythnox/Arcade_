import { rotateMatrixCW, rotateMatrixCCW } from "../../core/math/matrix";

export type TetrominoType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";

export interface TetrominoShape {
  type: TetrominoType;
  matrix: number[][];
  color: string;
  glowColor: string;
  shadowColor: string;
}

export const TETROMINO_SHAPES: Record<TetrominoType, { matrix: number[][]; color: string; glowColor: string; shadowColor: string }> = {
  I: {
    matrix: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: "#00F0FF", // Cyan
    glowColor: "#E0F2FE",
    shadowColor: "#0284C7",
  },
  J: {
    matrix: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#3B82F6", // Blue
    glowColor: "#DBEAFE",
    shadowColor: "#1D4ED8",
  },
  L: {
    matrix: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#F97316", // Orange
    glowColor: "#FFEDD5",
    shadowColor: "#C2410C",
  },
  O: {
    matrix: [
      [1, 1],
      [1, 1],
    ],
    color: "#EAB308", // Yellow
    glowColor: "#FEF9C3",
    shadowColor: "#A16207",
  },
  S: {
    matrix: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: "#00FF66", // Neon Green
    glowColor: "#DCFCE7",
    shadowColor: "#15803D",
  },
  T: {
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#A855F7", // Purple
    glowColor: "#F3E8FF",
    shadowColor: "#7E22CE",
  },
  Z: {
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: "#FF3366", // Red / Coral
    glowColor: "#FFE4E6",
    shadowColor: "#BE123C",
  },
};

export class TetrisPiece {
  public type: TetrominoType;
  public matrix: number[][];
  public x: number;
  public y: number;
  public rotationIndex: number = 0; // 0, 1, 2, 3

  constructor(type: TetrominoType, x: number = 3, y: number = 0) {
    this.type = type;
    this.matrix = TETROMINO_SHAPES[type].matrix.map((row) => [...row]);
    this.x = x;
    this.y = y;
  }

  public clone(): TetrisPiece {
    const p = new TetrisPiece(this.type, this.x, this.y);
    p.matrix = this.matrix.map((row) => [...row]);
    p.rotationIndex = this.rotationIndex;
    return p;
  }

  public rotateCW(): void {
    if (this.type === "O") return;
    this.matrix = rotateMatrixCW(this.matrix);
    this.rotationIndex = (this.rotationIndex + 1) % 4;
  }

  public rotateCCW(): void {
    if (this.type === "O") return;
    this.matrix = rotateMatrixCCW(this.matrix);
    this.rotationIndex = (this.rotationIndex + 3) % 4;
  }

  public getWidth(): number {
    return this.matrix[0].length;
  }

  public getHeight(): number {
    return this.matrix.length;
  }
}
