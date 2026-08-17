import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

const MAZES = [
  [
    "#######################",
    "#..........#..........#",
    "#.###.####.#.####.###.#",
    "#O###.####.#.####.###O#",
    "#.###.####.#.####.###.#",
    "#.....................#",
    "#.###.#.#######.#.###.#",
    "#.###.#.#######.#.###.#",
    "#.....#....#....#.....#",
    "#####.#### # ####.#####",
    "    #.#         #.#    ",
    "#####.# ### ### #.#####",
    "      . #  G  # .      ",
    "#####.# ####### #.#####",
    "    #.#         #.#    ",
    "#####.# ####### #.#####",
    "#..........#..........#",
    "#.###.####.#.####.###.#",
    "#O..#......P......#..O#",
    "###.#.#.#######.#.#.###",
    "###.#.#.#######.#.#.###",
    "#.....#....#....#.....#",
    "#######################",
  ]
];

export class MazeChaserGame implements GameInstance {
  private ctx!: GameContext;
  
  // Game state
  private maze: string[] = [];
  private score: number = 0;
  private level: number = 1;
  private lives: number = 3;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  
  private player = { x: 0, y: 0, dx: 0, dy: 0, nextDx: 0, nextDy: 0 };
  private ghosts: { x: number, y: number, type: number, state: 'chase' | 'scatter' | 'frightened', timer: number, dx: number, dy: number, startX: number, startY: number }[] = [];
  
  private pellets: {x: number, y: number, power: boolean}[] = [];
  
  private moveTimer: number = 0;
  private ghostTimer: number = 0;
  private frightenedTimer: number = 0;
  
  private mouthAngle = 0.25;
  private mouthClosing = true;
  private popups: {x:number, y:number, text:string, life:number}[] = [];
  
  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.gameOver = false;
    this.isPaused = false;
    this.loadLevel();
  }
  
  private loadLevel(): void {
    const mazeIndex = Math.min(this.level - 1, MAZES.length - 1);
    this.maze = MAZES[mazeIndex];
    this.pellets = [];
    this.ghosts = [];
    this.popups = [];
    
    const ghostTypes = 0;
    
    for (let y = 0; y < 23; y++) {
      for (let x = 0; x < 23; x++) {
        const cell = this.maze[y]?.[x];
        if (cell === '.') {
          this.pellets.push({x, y, power: false});
        } else if (cell === 'O') {
          this.pellets.push({x, y, power: true});
        } else if (cell === 'P') {
          this.player.x = x;
          this.player.y = y;
          this.player.dx = 0;
          this.player.dy = 0;
          this.player.nextDx = 0;
          this.player.nextDy = 0;
        }
      }
    }

    // Spawn 6 hunting monsters (Blinky, Pinky, Inky, Clyde, Shadow, Specter)
    const ghostConfigs = [
      { x: 11, y: 12, type: 0 },
      { x: 10, y: 12, type: 1 },
      { x: 12, y: 12, type: 2 },
      { x: 11, y: 10, type: 3 },
      { x: 9, y: 10, type: 4 },
      { x: 13, y: 10, type: 5 },
    ];
    for (const gc of ghostConfigs) {
      this.ghosts.push({
        x: gc.x,
        y: gc.y,
        startX: gc.x,
        startY: gc.y,
        type: gc.type,
        state: 'scatter',
        timer: 0,
        dx: (gc.type % 2 === 0) ? 1 : -1,
        dy: 0,
      });
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    this.moveTimer += dt;
    this.ghostTimer += dt;
    
    this.popups.forEach(p => p.life -= dt);
    this.popups = this.popups.filter(p => p.life > 0);

    if (this.player.dx !== 0 || this.player.dy !== 0) {
      if (this.mouthClosing) {
        this.mouthAngle -= dt * 4;
        if (this.mouthAngle <= 0.02) this.mouthClosing = false;
      } else {
        this.mouthAngle += dt * 4;
        if (this.mouthAngle >= 0.25) this.mouthClosing = true;
      }
    }

    if (this.frightenedTimer > 0) {
      this.frightenedTimer -= dt;
      if (this.frightenedTimer <= 0) {
        this.ghosts.forEach(g => {
          if (g.state === 'frightened') g.state = 'chase';
        });
      }
    }

    if (this.moveTimer >= 0.15) {
      this.moveTimer = 0;
      this.updatePlayer();
    }
    
    if (this.ghostTimer >= 0.2) {
      this.ghostTimer = 0;
      this.updateGhosts();
    }
  }
  
  private isWall(x: number, y: number): boolean {
    if (y < 0 || y >= 23 || x < 0 || x >= 23) return true;
    return this.maze[y][x] === '#';
  }

  private updatePlayer(): void {
    if (this.player.nextDx !== 0 || this.player.nextDy !== 0) {
      if (!this.isWall(this.player.x + this.player.nextDx, this.player.y + this.player.nextDy)) {
        this.player.dx = this.player.nextDx;
        this.player.dy = this.player.nextDy;
      }
    }
    
    if (this.player.dx !== 0 || this.player.dy !== 0) {
      const nx = this.player.x + this.player.dx;
      const ny = this.player.y + this.player.dy;
      if (!this.isWall(nx, ny)) {
        this.player.x = nx;
        this.player.y = ny;
        this.checkCollisions();
      }
    }
  }
  
  private updateGhosts(): void {
    for (const g of this.ghosts) {
      let bestDir = { dx: g.dx, dy: g.dy };
      
      const dirs = [
        {dx: 0, dy: -1}, {dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: -1, dy: 0}
      ];
      
      let minScore = Infinity;
      
      for (const d of dirs) {
        if (d.dx === -g.dx && d.dy === -g.dy) continue; // No reverse
        
        const nx = g.x + d.dx;
        const ny = g.y + d.dy;
        
        if (!this.isWall(nx, ny)) {
          if (g.state === 'frightened') {
            if (Math.random() < 0.5 || minScore === Infinity) {
              bestDir = d;
              minScore = 0;
            }
          } else {
            let tx = this.player.x;
            let ty = this.player.y;
            
            if (g.type === 1) { // Pinky
              tx += this.player.dx * 4; ty += this.player.dy * 4;
            } else if (g.type === 2) { // Inky
              const blinky = this.ghosts.find(gh => gh.type === 0) || this.ghosts[0];
              const px = this.player.x + this.player.dx * 2;
              const py = this.player.y + this.player.dy * 2;
              tx = Math.floor((blinky.x + px) / 2);
              ty = Math.floor((blinky.y + py) / 2);
            } else if (g.type === 3) { // Clyde
              const distToP = Math.abs(nx - tx) + Math.abs(ny - ty);
              if (distToP > 8) {
                // Chase
              } else {
                tx = 0; ty = 23; // Bottom left
              }
            }
            
            const dist = Math.abs(nx - tx) + Math.abs(ny - ty);
            if (dist < minScore) {
              minScore = dist;
              bestDir = d;
            }
          }
        }
      }
      
      if (minScore !== Infinity) {
        g.dx = bestDir.dx;
        g.dy = bestDir.dy;
        g.x += g.dx;
        g.y += g.dy;
      }
    }
    this.checkCollisions();
  }
  
  private checkCollisions(): void {
    const pIdx = this.pellets.findIndex(p => p.x === this.player.x && p.y === this.player.y);
    if (pIdx >= 0) {
      const p = this.pellets[pIdx];
      this.pellets.splice(pIdx, 1);
      
      if (p.power) {
        this.score += 50;
        this.frightenedTimer = 7.0;
        this.ghosts.forEach(g => g.state = 'frightened');
        this.ctx.audio.playPowerUp();
      } else {
        this.score += 10;
        this.ctx.audio.playCoin();
      }
      
      if (this.pellets.length === 0) {
        this.level++;
        this.loadLevel();
      }
    }
    
    for (const g of this.ghosts) {
      if (g.x === this.player.x && g.y === this.player.y) {
        if (g.state === 'frightened') {
          this.score += 200;
          this.popups.push({x: g.x, y: g.y, text: "200", life: 1.0});
          g.x = g.startX;
          g.y = g.startY;
          g.state = 'chase';
          this.ctx.audio.playHit();
        } else {
          this.die();
        }
      }
    }
  }
  
  private die(): void {
    this.lives--;
    this.ctx.audio.playExplosion();
    if (this.lives <= 0) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
      this.ctx.audio.playGameOver();
    } else {
      this.player.dx = 0;
      this.player.dy = 0;
      this.player.nextDx = 0;
      this.player.nextDy = 0;
      
      for (let y = 0; y < 23; y++) {
        for (let x = 0; x < 23; x++) {
          if (this.maze[y]?.[x] === 'P') {
            this.player.x = x;
            this.player.y = y;
          }
        }
      }
      
      for (const g of this.ghosts) {
        g.x = g.startX;
        g.y = g.startY;
      }
    }
  }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const rawCtx = pr.getContext();
    renderer.clear("#000000");
    const cellSize = 22;
    const offsetX = (renderer.getWidth() - 23 * cellSize) / 2;
    const offsetY = (renderer.getHeight() - 23 * cellSize) / 2 + 16;
    
    // Walls
    for (let y = 0; y < 23; y++) {
      for (let x = 0; x < 23; x++) {
        if (this.isWall(x, y)) {
          const wx = offsetX + x * cellSize;
          const wy = offsetY + y * cellSize;
          renderer.drawRect(wx + 2, wy + 2, cellSize - 4, cellSize - 4, "#2222ff", true);
          renderer.drawRect(wx + 5, wy + 5, cellSize - 10, cellSize - 10, "#000044", true);
        }
      }
    }
    
    // Pellets
    const flash = Math.floor(Date.now() / 250) % 2 === 0;
    for (const p of this.pellets) {
      const px = offsetX + p.x * cellSize + cellSize / 2;
      const py = offsetY + p.y * cellSize + cellSize / 2;
      if (p.power) {
        if (flash) {
          renderer.drawCircle(px, py, 7, "#ffb8ae", true);
        }
      } else {
        renderer.drawRect(px - 2, py - 2, 4, 4, "#ffb8ae", true);
      }
    }
    
    // Pac-Man
    const pacX = offsetX + this.player.x * cellSize + cellSize / 2;
    const pacY = offsetY + this.player.y * cellSize + cellSize / 2;
    
    let rotation = 0;
    if (this.player.dx === 1) rotation = 0;
    else if (this.player.dx === -1) rotation = Math.PI;
    else if (this.player.dy === 1) rotation = Math.PI / 2;
    else if (this.player.dy === -1) rotation = -Math.PI / 2;

    rawCtx.save();
    rawCtx.translate(pacX, pacY);
    rawCtx.rotate(rotation);
    rawCtx.beginPath();
    rawCtx.moveTo(0, 0);
    rawCtx.arc(0, 0, cellSize / 2 - 2, this.mouthAngle, Math.PI * 2 - this.mouthAngle);
    rawCtx.closePath();
    rawCtx.fillStyle = '#FFD700';
    rawCtx.fill();
    rawCtx.restore();
    
    // Ghosts (6 distinct colors)
    const ghostColors = ["#FF0000", "#FFB8FF", "#00FFFF", "#FFB852", "#A855F7", "#FACC15"];
    const drawGhost = (ctx2d: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string, scared: boolean) => {
      const s = size / 2;
      ctx2d.beginPath();
      ctx2d.arc(cx, cy - s * 0.2, s, Math.PI, 0, false);
      ctx2d.lineTo(cx + s, cy + s);
      const bumps = 3; const bumpW = (2 * s) / bumps;
      for (let i = 0; i < bumps; i++) {
        ctx2d.quadraticCurveTo(cx + s - bumpW * i - bumpW * 0.5, cy + s + s * 0.4, cx + s - bumpW * (i + 1), cy + s);
      }
      ctx2d.closePath();
      ctx2d.fillStyle = scared ? (flash ? '#ffffff' : '#2121de') : color;
      ctx2d.fill();
      
      if (!scared) {
        ctx2d.fillStyle = 'white';
        ctx2d.beginPath(); ctx2d.arc(cx - s * 0.3, cy - s * 0.1, s * 0.25, 0, Math.PI * 2); ctx2d.fill();
        ctx2d.beginPath(); ctx2d.arc(cx + s * 0.3, cy - s * 0.1, s * 0.25, 0, Math.PI * 2); ctx2d.fill();
        ctx2d.fillStyle = '#000080';
        // Eye direction offset
        const dx = (this.player.x - Math.floor((cx-offsetX)/cellSize)) > 0 ? 1 : -1;
        const dy = (this.player.y - Math.floor((cy-offsetY)/cellSize)) > 0 ? 1 : -1;
        ctx2d.beginPath(); ctx2d.arc(cx - s * 0.3 + dx, cy - s * 0.1 + dy, s * 0.12, 0, Math.PI * 2); ctx2d.fill();
        ctx2d.beginPath(); ctx2d.arc(cx + s * 0.3 + dx, cy - s * 0.1 + dy, s * 0.12, 0, Math.PI * 2); ctx2d.fill();
      } else {
        ctx2d.fillStyle = flash ? '#ff0000' : '#ffb8ae';
        ctx2d.fillRect(cx - s * 0.4, cy - s * 0.15, s * 0.2, s * 0.2);
        ctx2d.fillRect(cx + s * 0.2, cy - s * 0.15, s * 0.2, s * 0.2);
        ctx2d.fillRect(cx - s * 0.4, cy + s * 0.2, s * 0.8, s * 0.1);
      }
    };

    for (const g of this.ghosts) {
      const gx = offsetX + g.x * cellSize + cellSize/2;
      const gy = offsetY + g.y * cellSize + cellSize/2;
      const isScared = g.state === 'frightened';
      drawGhost(rawCtx, gx, gy, cellSize - 2, ghostColors[g.type], isScared);
    }
    
    // Popups
    for (const p of this.popups) {
      renderer.drawText(p.text, offsetX + p.x * cellSize + cellSize/2, offsetY + p.y * cellSize - 5, { color: "#00ffff", size: 12, align: "center" });
    }
    
    renderer.drawText(`1UP`, 40, 30, { color: "#ff0000", size: 18 });
    renderer.drawText(`${String(this.score).padStart(5, '0')}`, 40, 50, { color: "#ffffff", size: 18 });

    renderer.drawText(`HIGH SCORE`, renderer.getWidth() / 2, 30, { color: "#ff0000", size: 18, align: "center" });
    renderer.drawText(`10000`, renderer.getWidth() / 2, 50, { color: "#ffffff", size: 18, align: "center" });

    for (let l = 0; l < this.lives; l++) {
      const lx = 30 + l * 24;
      const ly = renderer.getHeight() - 20;
      rawCtx.beginPath();
      rawCtx.moveTo(lx, ly);
      rawCtx.arc(lx, ly, 10, 0.2, Math.PI * 2 - 0.2);
      rawCtx.closePath();
      rawCtx.fillStyle = '#FFD700';
      rawCtx.fill();
    }
    
    if (this.gameOver) {
      renderer.drawText("GAME  OVER", renderer.getWidth() / 2, renderer.getHeight() / 2 + 10, { color: "#ff0000", size: 36, align: "center" });
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.gameOver || this.isPaused) return;

    switch (action) {
      case "MOVE_UP":
        this.player.nextDx = 0; this.player.nextDy = -1;
        break;
      case "MOVE_DOWN":
        this.player.nextDx = 0; this.player.nextDy = 1;
        break;
      case "MOVE_LEFT":
        this.player.nextDx = -1; this.player.nextDy = 0;
        break;
      case "MOVE_RIGHT":
        this.player.nextDx = 1; this.player.nextDy = 0;
        break;
      case "RESTART":
        if (this.gameOver) this.reset();
        break;
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }
  public getLives(): number { return this.lives; }
}
