import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";

interface DroppingDisc {
  col: number;
  fromY: number;
  toY: number;
  currentY: number;
  velocity: number;
  player: number;
  bounces: number;
}

export class ConnectFourGame implements GameInstance {
  private ctx!: GameContext;
  private readonly cols: number = 7;
  private readonly rows: number = 6;
  private grid: number[][] = []; // 0: empty, 1: Player (Ruby), 2: AI (Gold)
  private hoverCol: number = 3;
  private turn: "player" | "ai" = "player";
  private winner: number | "draw" | null = null;
  private winCells: { r: number; c: number }[] = [];

  private p1Wins: number = 0;
  private aiWins: number = 0;
  private score: number = 0;
  private isPaused: boolean = false;
  private animTime: number = 0;

  private dropping: DroppingDisc | null = null;
  private boundPointerDown?: (e: MouseEvent | PointerEvent) => void;
  private boundPointerMove?: (e: MouseEvent | PointerEvent) => void;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
    this.attachPointerControls();
  }

  private attachPointerControls(): void {
    const getBoardCoords = (e: MouseEvent | PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === "CANVAS") {
        const rect = target.getBoundingClientRect();
        const scaleX = 600 / rect.width;
        const scaleY = 700 / rect.height;
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;

        const cellSize = 76;
        const boardWidth = this.cols * cellSize;
        const offX = Math.floor((600 - boardWidth) / 2);
        const offY = 145;

        if (clickX >= offX && clickX <= offX + boardWidth) {
          const col = Math.floor((clickX - offX) / cellSize);
          return { col: Math.max(0, Math.min(this.cols - 1, col)), clickY };
        }
      }
      return null;
    };

    this.boundPointerMove = (e: MouseEvent | PointerEvent) => {
      if (this.winner !== null || this.turn !== "player" || this.dropping !== null) return;
      const coords = getBoardCoords(e);
      if (coords !== null) {
        this.hoverCol = coords.col;
      }
    };

    this.boundPointerDown = (e: MouseEvent | PointerEvent) => {
      if (this.winner !== null) {
        this.reset();
        return;
      }
      if (this.turn !== "player" || this.dropping !== null) return;

      const coords = getBoardCoords(e);
      if (coords !== null) {
        this.hoverCol = coords.col;
        this.dropPlayerPiece(coords.col);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("pointerdown", this.boundPointerDown);
      window.addEventListener("pointermove", this.boundPointerMove);
    }
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    this.hoverCol = 3;
    this.turn = "player";
    this.winner = null;
    this.winCells = [];
    this.dropping = null;
    this.isPaused = false;
    this.animTime = 0;
  }

  private getLowestEmptyRow(col: number): number {
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.grid[r][col] === 0) return r;
    }
    return -1;
  }

  private dropPlayerPiece(col: number): void {
    const toRow = this.getLowestEmptyRow(col);
    if (toRow === -1) {
      this.ctx.audio?.playLaser?.();
      return;
    }

    const cellSize = 76;
    const offY = 145;
    const startY = offY - 45;
    const targetY = offY + toRow * cellSize + cellSize / 2;

    this.dropping = {
      col,
      fromY: startY,
      toY: targetY,
      currentY: startY,
      velocity: 0,
      player: 1,
      bounces: 0,
    };

    this.ctx.audio?.playMove?.();
  }

  private checkWinFull(p: number, testGrid = this.grid): { r: number; c: number }[] | null {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (testGrid[r][c] !== p) continue;
        // Horizontal
        if (c <= this.cols - 4 && testGrid[r][c + 1] === p && testGrid[r][c + 2] === p && testGrid[r][c + 3] === p) {
          return [{ r, c }, { r, c: c + 1 }, { r, c: c + 2 }, { r, c: c + 3 }];
        }
        // Vertical
        if (r <= this.rows - 4 && testGrid[r + 1][c] === p && testGrid[r + 2][c] === p && testGrid[r + 3][c] === p) {
          return [{ r, c }, { r: r + 1, c }, { r: r + 2, c }, { r: r + 3, c }];
        }
        // Diagonal Down-Right
        if (r <= this.rows - 4 && c <= this.cols - 4 && testGrid[r + 1][c + 1] === p && testGrid[r + 2][c + 2] === p && testGrid[r + 3][c + 3] === p) {
          return [{ r, c }, { r: r + 1, c: c + 1 }, { r: r + 2, c: c + 2 }, { r: r + 3, c: c + 3 }];
        }
        // Diagonal Down-Left
        if (r <= this.rows - 4 && c >= 3 && testGrid[r + 1][c - 1] === p && testGrid[r + 2][c - 2] === p && testGrid[r + 3][c - 3] === p) {
          return [{ r, c }, { r: r + 1, c: c - 1 }, { r: r + 2, c: c - 2 }, { r: r + 3, c: c - 3 }];
        }
      }
    }
    return null;
  }

  private evaluateBoard(player: number): number {
    let score = 0;
    const opp = player === 1 ? 2 : 1;

    let centerCount = 0;
    for (let r = 0; r < this.rows; r++) {
      if (this.grid[r][3] === player) centerCount++;
    }
    score += centerCount * 6;

    const evalWindow = (window: number[]) => {
      let s = 0;
      const pCount = window.filter((c) => c === player).length;
      const emptyCount = window.filter((c) => c === 0).length;
      const oppCount = window.filter((c) => c === opp).length;

      if (pCount === 4) s += 1000000;
      else if (pCount === 3 && emptyCount === 1) s += 120;
      else if (pCount === 2 && emptyCount === 2) s += 12;

      if (oppCount === 3 && emptyCount === 1) s -= 1200;
      return s;
    };

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols - 3; c++) {
        score += evalWindow([this.grid[r][c], this.grid[r][c + 1], this.grid[r][c + 2], this.grid[r][c + 3]]);
      }
    }
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows - 3; r++) {
        score += evalWindow([this.grid[r][c], this.grid[r + 1][c], this.grid[r + 2][c], this.grid[r + 3][c]]);
      }
    }
    for (let r = 0; r < this.rows - 3; r++) {
      for (let c = 0; c < this.cols - 3; c++) {
        score += evalWindow([this.grid[r][c], this.grid[r + 1][c + 1], this.grid[r + 2][c + 2], this.grid[r + 3][c + 3]]);
      }
    }
    for (let r = 0; r < this.rows - 3; r++) {
      for (let c = 0; c < this.cols - 3; c++) {
        score += evalWindow([this.grid[r + 3][c], this.grid[r + 2][c + 1], this.grid[r + 1][c + 2], this.grid[r][c + 3]]);
      }
    }

    return score;
  }

  private triggerAIMove(): void {
    let bestScore = -Infinity;
    let bestCol = -1;

    for (let c = 0; c < this.cols; c++) {
      const r = this.getLowestEmptyRow(c);
      if (r !== -1) {
        this.grid[r][c] = 2;
        if (this.checkWinFull(2)) {
          bestCol = c;
          this.grid[r][c] = 0;
          break;
        }
        const s = this.minimax(3, false, -Infinity, Infinity);
        this.grid[r][c] = 0;

        if (s > bestScore) {
          bestScore = s;
          bestCol = c;
        } else if (s === bestScore && Math.random() < 0.5) {
          bestCol = c;
        }
      }
    }

    if (bestCol === -1) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[0][c] === 0) {
          bestCol = c;
          break;
        }
      }
    }

    if (bestCol !== -1) {
      const toRow = this.getLowestEmptyRow(bestCol);
      const cellSize = 76;
      const offY = 145;
      const startY = offY - 45;
      const targetY = offY + toRow * cellSize + cellSize / 2;

      this.dropping = {
        col: bestCol,
        fromY: startY,
        toY: targetY,
        currentY: startY,
        velocity: 0,
        player: 2,
        bounces: 0,
      };

      this.ctx.audio?.playMove?.();
    }
  }

  private minimax(depth: number, isMaximizing: boolean, alpha: number, beta: number): number {
    if (this.checkWinFull(2)) return 1000000;
    if (this.checkWinFull(1)) return -1000000;

    let isFull = true;
    for (let c = 0; c < this.cols; c++) {
      if (this.grid[0][c] === 0) isFull = false;
    }
    if (isFull) return 0;
    if (depth === 0) return this.evaluateBoard(2);

    if (isMaximizing) {
      let value = -Infinity;
      for (let c = 0; c < this.cols; c++) {
        const r = this.getLowestEmptyRow(c);
        if (r !== -1) {
          this.grid[r][c] = 2;
          value = Math.max(value, this.minimax(depth - 1, false, alpha, beta));
          this.grid[r][c] = 0;
          alpha = Math.max(alpha, value);
          if (alpha >= beta) break;
        }
      }
      return value;
    } else {
      let value = Infinity;
      for (let c = 0; c < this.cols; c++) {
        const r = this.getLowestEmptyRow(c);
        if (r !== -1) {
          this.grid[r][c] = 1;
          value = Math.min(value, this.minimax(depth - 1, true, alpha, beta));
          this.grid[r][c] = 0;
          beta = Math.min(beta, value);
          if (alpha >= beta) break;
        }
      }
      return value;
    }
  }

  public update(dt: number): void {
    if (this.isPaused) return;
    globalParticles.update(dt);
    this.animTime += dt;

    if (this.dropping) {
      this.dropping.velocity += 1900 * dt;
      this.dropping.currentY += this.dropping.velocity * dt;

      if (this.dropping.currentY >= this.dropping.toY) {
        this.dropping.currentY = this.dropping.toY;

        if (this.dropping.bounces < 2 && Math.abs(this.dropping.velocity) > 150) {
          this.dropping.velocity = -this.dropping.velocity * 0.35;
          this.dropping.bounces++;
          this.ctx.audio?.playHit?.();
        } else {
          // Finalize placement
          const targetRow = this.getLowestEmptyRow(this.dropping.col);
          if (targetRow !== -1) {
            this.grid[targetRow][this.dropping.col] = this.dropping.player;
          }
          this.ctx.audio?.playCoin?.();

          const cellSize = 76;
          const offX = Math.floor((600 - this.cols * cellSize) / 2);
          const offY = 145;
          const dropPx = offX + this.dropping.col * cellSize + cellSize / 2;
          const dropPy = this.dropping.toY;
          globalParticles.emitBurst(dropPx, dropPy, 12, [this.dropping.player === 1 ? "#F43F5E" : "#FBBF24", "#FFFFFF"], 40, 140);

          const win = this.checkWinFull(this.dropping.player);
          if (win) {
            this.winner = this.dropping.player;
            this.winCells = win;
            if (this.winner === 1) {
              this.score += 2500;
              this.p1Wins++;
              this.ctx.audio?.playVictory?.();
              globalParticles.emitBurst(300, 350, 50, ["#F43F5E", "#38BDF8", "#FFFFFF"], 90, 280);
              globalParticles.emitText("CONNECT 4! PLAYER WINS!", 300, 110, "#F43F5E", 22);
            } else {
              this.aiWins++;
              this.ctx.audio?.playExplosion?.();
              globalParticles.emitBurst(300, 350, 50, ["#FBBF24", "#EF4444", "#FFFFFF"], 90, 280);
              globalParticles.emitText("AI WINS!", 300, 110, "#FBBF24", 22);
            }
            this.ctx.session.setStatus("ready");
          } else {
            let full = true;
            for (let c = 0; c < this.cols; c++) {
              if (this.grid[0][c] === 0) full = false;
            }
            if (full) {
              this.winner = "draw";
              this.ctx.session.setStatus("ready");
            } else if (this.dropping.player === 1) {
              this.turn = "ai";
              setTimeout(() => this.triggerAIMove(), 280);
            } else {
              this.turn = "player";
            }
          }
          this.dropping = null;
        }
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "RESTART" && this.winner !== null) {
      this.reset();
      return;
    }

    if (this.winner !== null || this.dropping !== null || this.turn !== "player") return;

    if (action === "MOVE_LEFT") {
      this.hoverCol = Math.max(0, this.hoverCol - 1);
      this.ctx.audio?.playMove?.();
    } else if (action === "MOVE_RIGHT") {
      this.hoverCol = Math.min(this.cols - 1, this.hoverCol + 1);
      this.ctx.audio?.playMove?.();
    } else if (action === "ACTION_PRIMARY" || action === "MOVE_DOWN" || action === "CONFIRM") {
      this.dropPlayerPiece(this.hoverCol);
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {
    if (typeof window !== "undefined") {
      if (this.boundPointerDown) window.removeEventListener("pointerdown", this.boundPointerDown);
      if (this.boundPointerMove) window.removeEventListener("pointermove", this.boundPointerMove);
    }
  }

  public getScore(): number { return this.score; }
  public getLevel(): number { return this.p1Wins + 1; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const ctx2d = (pr as any).getContext?.() as CanvasRenderingContext2D | undefined;
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Modern Midnight Indigo Background
    if (ctx2d) {
      const bgGrad = ctx2d.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, "#080E1C");
      bgGrad.addColorStop(0.5, "#0E182F");
      bgGrad.addColorStop(1, "#050912");
      ctx2d.fillStyle = bgGrad;
      ctx2d.fillRect(0, 0, w, h);
    } else {
      pr.clear("#080E1C");
    }

    // 2. Header & Match Score Cards
    pr.drawText("CONNECT FOUR", 28, 38, {
      size: 26,
      color: "#38BDF8",
      font: "system-ui, -apple-system, sans-serif",
    });

    if (ctx2d) {
      // Player 1 Card (Ruby)
      ctx2d.save();
      ctx2d.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx2d.strokeStyle = "#F43F5E";
      ctx2d.lineWidth = 2;
      ctx2d.shadowColor = "rgba(244, 63, 94, 0.4)";
      ctx2d.shadowBlur = 10;
      ctx2d.beginPath();
      ctx2d.roundRect(w - 250, 14, 110, 48, 8);
      ctx2d.fill();
      ctx2d.stroke();
      ctx2d.restore();

      pr.drawText("PLAYER (YOU)", w - 195, 30, { size: 9.5, color: "#FDA4AF", align: "center", font: "monospace" });
      pr.drawText(`${this.p1Wins} WINS`, w - 195, 50, { size: 15, color: "#F43F5E", align: "center", font: "bold monospace" });

      // AI Card (Gold)
      ctx2d.save();
      ctx2d.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx2d.strokeStyle = "#FBBF24";
      ctx2d.lineWidth = 2;
      ctx2d.shadowColor = "rgba(251, 191, 36, 0.4)";
      ctx2d.shadowBlur = 10;
      ctx2d.beginPath();
      ctx2d.roundRect(w - 128, 14, 110, 48, 8);
      ctx2d.fill();
      ctx2d.stroke();
      ctx2d.restore();

      pr.drawText("AI OPPONENT", w - 73, 30, { size: 9.5, color: "#FDE68A", align: "center", font: "monospace" });
      pr.drawText(`${this.aiWins} WINS`, w - 73, 50, { size: 15, color: "#FBBF24", align: "center", font: "bold monospace" });
    }

    // Board Geometry
    const cellSize = 76;
    const boardWidth = this.cols * cellSize;
    const boardHeight = this.rows * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = 145;

    // 3. Hover Target Pointer & Floating Preview Disc
    if (this.winner === null && this.turn === "player" && !this.dropping) {
      const hoverPx = offX + this.hoverCol * cellSize + cellSize / 2;
      const hoverPy = offY - 42;

      // Glow Disc Preview
      if (ctx2d) {
        ctx2d.save();
        ctx2d.shadowColor = "rgba(244, 63, 94, 0.8)";
        ctx2d.shadowBlur = 18;

        const discGrad = ctx2d.createRadialGradient(hoverPx - 6, hoverPy - 6, 4, hoverPx, hoverPy, 30);
        discGrad.addColorStop(0, "#FFA4B6");
        discGrad.addColorStop(0.6, "#F43F5E");
        discGrad.addColorStop(1, "#BE123C");
        ctx2d.fillStyle = discGrad;
        ctx2d.beginPath();
        ctx2d.arc(hoverPx, hoverPy, 30, 0, Math.PI * 2);
        ctx2d.fill();

        ctx2d.strokeStyle = "#FFFFFF";
        ctx2d.lineWidth = 2.5;
        ctx2d.stroke();
        ctx2d.restore();
      }

      // Column Indicator Arrow
      const arrowY = offY - 12;
      pr.drawLine(hoverPx, arrowY, hoverPx, arrowY - 8, "#38BDF8", 3);
      pr.drawLine(hoverPx, arrowY, hoverPx - 6, arrowY - 6, "#38BDF8", 3);
      pr.drawLine(hoverPx, arrowY, hoverPx + 6, arrowY - 6, "#38BDF8", 3);
    }

    // 4. Heavy 3D Cobalt Arcade Matrix Housing
    if (ctx2d) {
      ctx2d.save();
      ctx2d.fillStyle = "#1E3A8A"; // Deep Cobalt Blue
      ctx2d.strokeStyle = "#38BDF8";
      ctx2d.lineWidth = 3;
      ctx2d.shadowColor = "rgba(56, 189, 248, 0.35)";
      ctx2d.shadowBlur = 24;
      ctx2d.beginPath();
      ctx2d.roundRect(offX - 12, offY - 12, boardWidth + 24, boardHeight + 24, 18);
      ctx2d.fill();
      ctx2d.stroke();
      ctx2d.restore();

      // Top Bevel Highlight
      ctx2d.save();
      ctx2d.fillStyle = "rgba(255, 255, 255, 0.12)";
      ctx2d.beginPath();
      ctx2d.roundRect(offX - 8, offY - 8, boardWidth + 16, (boardHeight + 16) / 2.5, 14);
      ctx2d.fill();
      ctx2d.restore();
    }

    // 5. Draw Board Cells & Discs
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const val = this.grid[r][c];
        const cx = offX + c * cellSize + cellSize / 2;
        const cy = offY + r * cellSize + cellSize / 2;

        if (ctx2d) {
          if (val === 0) {
            // Recessed Dark Glass Socket
            ctx2d.save();
            ctx2d.fillStyle = "#090E1A";
            ctx2d.beginPath();
            ctx2d.arc(cx, cy, 31, 0, Math.PI * 2);
            ctx2d.fill();

            // Inner Shadow
            ctx2d.strokeStyle = "rgba(0, 0, 0, 0.6)";
            ctx2d.lineWidth = 3;
            ctx2d.stroke();
            ctx2d.restore();
          } else {
            const isP1 = val === 1;
            const isWinningCell = this.winCells.some((wc) => wc.r === r && wc.c === c);

            ctx2d.save();

            if (isWinningCell) {
              ctx2d.shadowColor = isP1 ? "#F43F5E" : "#FBBF24";
              ctx2d.shadowBlur = 24 + Math.sin(this.animTime * 10) * 8;
            } else {
              ctx2d.shadowColor = "rgba(0, 0, 0, 0.35)";
              ctx2d.shadowBlur = 8;
            }

            // Tactile Metallic Radial Gradient
            const discGrad = ctx2d.createRadialGradient(cx - 7, cy - 7, 5, cx, cy, 32);
            if (isP1) {
              discGrad.addColorStop(0, "#FDA4AF");
              discGrad.addColorStop(0.6, "#F43F5E");
              discGrad.addColorStop(1, "#9F1239");
            } else {
              discGrad.addColorStop(0, "#FEF08A");
              discGrad.addColorStop(0.6, "#FBBF24");
              discGrad.addColorStop(1, "#B45309");
            }
            ctx2d.fillStyle = discGrad;
            ctx2d.beginPath();
            ctx2d.arc(cx, cy, 31, 0, Math.PI * 2);
            ctx2d.fill();

            // Concentric Ring Bevel
            ctx2d.strokeStyle = isP1 ? "#FECDD3" : "#FEF08A";
            ctx2d.lineWidth = 2;
            ctx2d.stroke();

            // Inner Core Ring
            ctx2d.strokeStyle = "rgba(255, 255, 255, 0.35)";
            ctx2d.lineWidth = 2;
            ctx2d.beginPath();
            ctx2d.arc(cx, cy, 18, 0, Math.PI * 2);
            ctx2d.stroke();

            if (isWinningCell) {
              // Bright Star in center
              ctx2d.fillStyle = "#FFFFFF";
              ctx2d.beginPath();
              ctx2d.arc(cx, cy, 7, 0, Math.PI * 2);
              ctx2d.fill();
            }

            ctx2d.restore();
          }
        }
      }
    }

    // 6. Draw Animated Dropping Disc
    if (this.dropping && ctx2d) {
      const dropX = offX + this.dropping.col * cellSize + cellSize / 2;
      const dropY = this.dropping.currentY;
      const isP1 = this.dropping.player === 1;

      ctx2d.save();
      ctx2d.shadowColor = isP1 ? "rgba(244, 63, 94, 0.9)" : "rgba(251, 191, 36, 0.9)";
      ctx2d.shadowBlur = 18;

      const discGrad = ctx2d.createRadialGradient(dropX - 7, dropY - 7, 5, dropX, dropY, 32);
      if (isP1) {
        discGrad.addColorStop(0, "#FDA4AF");
        discGrad.addColorStop(0.6, "#F43F5E");
        discGrad.addColorStop(1, "#9F1239");
      } else {
        discGrad.addColorStop(0, "#FEF08A");
        discGrad.addColorStop(0.6, "#FBBF24");
        discGrad.addColorStop(1, "#B45309");
      }
      ctx2d.fillStyle = discGrad;
      ctx2d.beginPath();
      ctx2d.arc(dropX, dropY, 31, 0, Math.PI * 2);
      ctx2d.fill();

      ctx2d.strokeStyle = "#FFFFFF";
      ctx2d.lineWidth = 2.5;
      ctx2d.stroke();
      ctx2d.restore();
    }

    // 7. Draw Connective Laser Beam through Winning 4 Discs
    if (this.winCells.length === 4 && ctx2d) {
      const startCell = this.winCells[0];
      const endCell = this.winCells[3];
      const sx = offX + startCell.c * cellSize + cellSize / 2;
      const sy = offY + startCell.r * cellSize + cellSize / 2;
      const ex = offX + endCell.c * cellSize + cellSize / 2;
      const ey = offY + endCell.r * cellSize + cellSize / 2;

      ctx2d.save();
      ctx2d.strokeStyle = "#FFFFFF";
      ctx2d.lineWidth = 5;
      ctx2d.shadowColor = "#38BDF8";
      ctx2d.shadowBlur = 20;
      ctx2d.beginPath();
      ctx2d.moveTo(sx, sy);
      ctx2d.lineTo(ex, ey);
      ctx2d.stroke();
      ctx2d.restore();
    }

    // 8. Particle Sparks
    globalParticles.render(pr);

    // 9. Sub-Board Turn Indicator & Controls HUD
    const statusColor = this.turn === "player" ? "#F43F5E" : "#FBBF24";
    const statusText =
      this.winner !== null
        ? "MATCH OVER"
        : this.turn === "player"
        ? "YOUR TURN (DROP PIECE)"
        : "AI CALCULATING MOVE...";

    pr.drawRect(16, h - 54, w - 32, 42, "rgba(15, 23, 42, 0.94)", true);
    pr.drawRect(16, h - 54, w - 32, 42, statusColor, false);

    pr.drawText(statusText, 32, h - 28, {
      size: 13,
      color: statusColor,
      font: "bold system-ui, sans-serif",
    });

    pr.drawText("[CLICK ANY COLUMN  •  OR USE ARROW KEYS + SPACE]", w - 32, h - 28, {
      size: 10.5,
      color: "#94A3B8",
      align: "right",
      font: "monospace",
    });

    // 10. Victory / Draw Overlay
    if (this.winner !== null) {
      const isP1Won = this.winner === 1;
      const bannerColor = isP1Won ? "#F43F5E" : this.winner === "draw" ? "#94A3B8" : "#FBBF24";

      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(8, 14, 28, 0.96)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, bannerColor, false);

      const winTitle = isP1Won ? "VICTORY! CONNECT 4!" : this.winner === "draw" ? "STALEMATE DRAW!" : "AI WINS THIS ROUND!";
      pr.drawText(winTitle, w / 2, h / 2 - 12, {
        size: 24,
        color: bannerColor,
        align: "center",
        font: "system-ui, -apple-system, sans-serif",
      });

      pr.drawText("CLICK ANYWHERE OR PRESS [SPACE / R] TO PLAY NEXT ROUND", w / 2, h / 2 + 18, {
        size: 12.5,
        color: "#FFFFFF",
        align: "center",
        font: "monospace",
      });
    }
  }
}
