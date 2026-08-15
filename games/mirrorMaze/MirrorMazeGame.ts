import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { GameAction } from "../../core/types/game";

const W = 12;
const H = 10;
const EMPTY = 0;
const SLASH = 1; // /
const BACKSLASH = 2; // \
const WALL = 3;
const SOURCE = 4;
const TARGET = 5;

interface Point { x: number; y: number; }

export class MirrorMazeGame implements GameInstance {
  private ctx!: GameContext;
  private grid: number[][] = [];
  private cursor: Point = { x: 0, y: 0 };
  private level: number = 1;
  private maxLevel: number = 15;
  private score: number = 0;
  private winDelay: number = 0;
  
  private slashInv: number = 3;
  private backslashInv: number = 3;

  private beamPath: Point[] = [];
  private hitTarget: boolean = false;

  init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  reset(): void {
    this.level = 1;
    this.score = 0;
    this.loadLevel();
  }

  private loadLevel() {
    this.grid = Array(H).fill(0).map(() => Array(W).fill(EMPTY));
    this.hitTarget = false;
    this.winDelay = 0;
    
    // Setup 15 distinct laser mirror reflection puzzle levels
    switch (this.level) {
      case 1:
        this.grid[2][2] = SOURCE;
        this.grid[8][8] = TARGET;
        this.slashInv = 2;
        this.backslashInv = 2;
        break;
      case 2:
        this.grid[1][1] = SOURCE;
        this.grid[H - 2][W - 2] = TARGET;
        this.grid[5][5] = WALL;
        this.slashInv = 3;
        this.backslashInv = 3;
        break;
      case 3:
        this.grid[1][2] = SOURCE;
        this.grid[7][2] = TARGET;
        this.grid[4][2] = WALL;
        this.grid[4][3] = WALL;
        this.slashInv = 3;
        this.backslashInv = 3;
        break;
      case 4:
        this.grid[2][1] = SOURCE;
        this.grid[2][10] = TARGET;
        for (let y = 1; y < 8; y++) this.grid[y][5] = WALL;
        this.grid[4][5] = EMPTY;
        this.slashInv = 4;
        this.backslashInv = 4;
        break;
      case 5:
        this.grid[8][1] = SOURCE;
        this.grid[1][10] = TARGET;
        this.grid[4][4] = WALL;
        this.grid[5][7] = WALL;
        this.slashInv = 3;
        this.backslashInv = 3;
        break;
      case 6:
        this.grid[1][1] = SOURCE;
        this.grid[1][10] = TARGET;
        this.grid[1][5] = WALL;
        this.grid[2][5] = WALL;
        this.slashInv = 4;
        this.backslashInv = 4;
        break;
      case 7:
        this.grid[5][1] = SOURCE;
        this.grid[5][10] = TARGET;
        for (let x = 3; x <= 8; x++) this.grid[5][x] = WALL;
        this.slashInv = 4;
        this.backslashInv = 4;
        break;
      case 8:
        this.grid[2][2] = SOURCE;
        this.grid[7][7] = TARGET;
        this.grid[2][6] = WALL;
        this.grid[7][3] = WALL;
        this.slashInv = 4;
        this.backslashInv = 4;
        break;
      case 9:
        this.grid[1][1] = SOURCE;
        this.grid[8][1] = TARGET;
        for (let y = 2; y <= 7; y++) this.grid[y][1] = WALL;
        this.slashInv = 4;
        this.backslashInv = 4;
        break;
      case 10:
        this.grid[0][0] = SOURCE;
        this.grid[9][11] = TARGET;
        this.grid[3][3] = WALL;
        this.grid[6][8] = WALL;
        this.slashInv = 5;
        this.backslashInv = 5;
        break;
      case 11:
        this.grid[3][1] = SOURCE;
        this.grid[6][10] = TARGET;
        this.grid[4][4] = WALL;
        this.grid[4][7] = WALL;
        this.grid[5][4] = WALL;
        this.grid[5][7] = WALL;
        this.slashInv = 5;
        this.backslashInv = 5;
        break;
      case 12:
        this.grid[1][3] = SOURCE;
        this.grid[8][8] = TARGET;
        for (let x = 2; x <= 9; x++) this.grid[4][x] = WALL;
        this.grid[4][6] = EMPTY;
        this.slashInv = 5;
        this.backslashInv = 5;
        break;
      case 13:
        this.grid[8][2] = SOURCE;
        this.grid[2][9] = TARGET;
        this.grid[5][2] = WALL;
        this.grid[5][9] = WALL;
        this.slashInv = 5;
        this.backslashInv = 5;
        break;
      case 14:
        this.grid[1][1] = SOURCE;
        this.grid[5][6] = TARGET;
        for (let y = 1; y < 9; y++) {
          if (y !== 4 && y !== 6) this.grid[y][4] = WALL;
        }
        this.slashInv = 6;
        this.backslashInv = 6;
        break;
      case 15:
      default:
        this.grid[0][1] = SOURCE;
        this.grid[9][10] = TARGET;
        this.grid[3][4] = WALL;
        this.grid[6][4] = WALL;
        this.grid[3][8] = WALL;
        this.grid[6][8] = WALL;
        this.slashInv = 6;
        this.backslashInv = 6;
        break;
    }
    
    this.cursor = { x: 0, y: 0 };
    this.simulateBeam();
  }

  private simulateBeam() {
    this.beamPath = [];
    this.hitTarget = false;
    
    let sx = 0, sy = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (this.grid[y][x] === SOURCE) { sx = x; sy = y; break; }
      }
    }
    
    let x = sx, y = sy;
    let dx = 1, dy = 0;
    let steps = 0;
    
    this.beamPath.push({x, y});
    
    while (steps < 200) {
      x += dx;
      y += dy;
      steps++;
      
      if (x < 0 || x >= W || y < 0 || y >= H) break;
      
      this.beamPath.push({x, y});
      let cell = this.grid[y][x];
      
      if (cell === WALL) break;
      if (cell === TARGET) {
        this.hitTarget = true;
        break;
      }
      if (cell === SLASH) { // /
        let ndx = -dy, ndy = -dx;
        dx = ndx; dy = ndy;
      } else if (cell === BACKSLASH) { // \
        let ndx = dy, ndy = dx;
        dx = ndx; dy = ndy;
      }
    }
  }

  update(deltaTime: number): void {
    if (this.hitTarget) {
      this.winDelay += deltaTime;
      if (this.winDelay > 1.5) {
        this.score += 100 * this.level;
        this.level++;
        if (this.level > this.maxLevel) this.level = 1;
        this.loadLevel();
      }
    }
  }

  handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.hitTarget) return;
    
    switch (action) {
      case "MOVE_UP":
        if (this.cursor.y > 0) this.cursor.y--;
        break;
      case "MOVE_DOWN":
        if (this.cursor.y < H - 1) this.cursor.y++;
        break;
      case "MOVE_LEFT":
        if (this.cursor.x > 0) this.cursor.x--;
        break;
      case "MOVE_RIGHT":
        if (this.cursor.x < W - 1) this.cursor.x++;
        break;
      case "ACTION_PRIMARY": // Place SLASH
        this.placeMirror(SLASH);
        break;
      case "ACTION_SECONDARY": // Place BACKSLASH
        this.placeMirror(BACKSLASH);
        break;
      case "RESTART":
        this.loadLevel();
        break;
    }
  }

  private placeMirror(type: number) {
    let curr = this.grid[this.cursor.y][this.cursor.x];
    if (curr === SOURCE || curr === TARGET || curr === WALL) return;
    
    if (curr === type) {
      this.grid[this.cursor.y][this.cursor.x] = EMPTY;
      if (type === SLASH) this.slashInv++;
      else this.backslashInv++;
    } else {
      if (type === SLASH && this.slashInv <= 0) return;
      if (type === BACKSLASH && this.backslashInv <= 0) return;
      
      if (curr === SLASH) this.slashInv++;
      if (curr === BACKSLASH) this.backslashInv++;
      
      this.grid[this.cursor.y][this.cursor.x] = type;
      if (type === SLASH) this.slashInv--;
      else this.backslashInv--;
    }
    
    this.simulateBeam();
  }

  render(renderer: Renderer): void {
    renderer.clear("#1a1a2e");
    const cellW = renderer.getWidth() / W;
    const cellH = renderer.getHeight() / H;

    // Draw grid & elements
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let px = x * cellW, py = y * cellH;
        renderer.drawRect(px, py, cellW, cellH, "#16213e", false);
        
        let cell = this.grid[y][x];
        if (cell === WALL) {
          renderer.drawRect(px, py, cellW, cellH, "#0f3460", true);
        } else if (cell === SOURCE) {
          renderer.drawRect(px + 4, py + 4, cellW - 8, cellH - 8, "#e94560", true);
        } else if (cell === TARGET) {
          renderer.drawCircle(px + cellW/2, py + cellH/2, cellW/3, "#00ff00", true);
        } else if (cell === SLASH) {
          renderer.drawLine(px, py + cellH, px + cellW, py, "#fff", 3);
        } else if (cell === BACKSLASH) {
          renderer.drawLine(px, py, px + cellW, py + cellH, "#fff", 3);
        }
      }
    }

    // Draw Beam
    if (this.beamPath.length > 0) {
      for (let i = 0; i < this.beamPath.length - 1; i++) {
        let p1 = this.beamPath[i];
        let p2 = this.beamPath[i+1];
        renderer.drawLine(
          p1.x * cellW + cellW/2, p1.y * cellH + cellH/2,
          p2.x * cellW + cellW/2, p2.y * cellH + cellH/2,
          "#ff0055", 2
        );
      }
    }

    // Cursor
    renderer.drawRect(this.cursor.x * cellW, this.cursor.y * cellH, cellW, cellH, "#e94560", false);
    
    // UI
    renderer.drawText(`Level: ${this.level}  Score: ${this.score}`, 10, 20, { color: "#fff", size: 16 });
    renderer.drawText(`/ (Z): ${this.slashInv}   \\ (X): ${this.backslashInv}`, 10, 40, { color: "#fff", size: 16 });
    
    if (this.hitTarget) {
      renderer.drawText("LEVEL COMPLETE!", renderer.getWidth()/2, renderer.getHeight()/2, { color: "#0f0", size: 30, align: "center" });
    }
  }

  pause(): void {}
  resume(): void {}
  destroy(): void {}
  getScore(): number { return this.score; }
  getLevel(): number { return this.level; }
}
