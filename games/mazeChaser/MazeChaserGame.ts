import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
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
    
    let ghostTypes = 0;
    
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
        } else if (cell === 'G') {
          this.ghosts.push({
            x, y, startX: x, startY: y,
            type: ghostTypes++ % 4,
            state: 'scatter',
            timer: 0,
            dx: 1, dy: 0
          });
        }
      }
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    this.moveTimer += dt;
    this.ghostTimer += dt;
    
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
      // Simplified ghost movement (random valid direction if frightened, else seek player)
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
            // Diff behavior by type
            if (g.type === 1) { tx += this.player.dx * 4; ty += this.player.dy * 4; }
            
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
    // Pellets
    const pIdx = this.pellets.findIndex(p => p.x === this.player.x && p.y === this.player.y);
    if (pIdx >= 0) {
      const p = this.pellets[pIdx];
      this.pellets.splice(pIdx, 1);
      
      if (p.power) {
        this.score += 50;
        this.frightenedTimer = 7.0;
        this.ghosts.forEach(g => g.state = 'frightened');
      } else {
        this.score += 10;
      }
      
      if (this.pellets.length === 0) {
        this.level++;
        this.loadLevel();
      }
    }
    
    // Ghosts
    for (const g of this.ghosts) {
      if (g.x === this.player.x && g.y === this.player.y) {
        if (g.state === 'frightened') {
          this.score += 200;
          g.x = g.startX;
          g.y = g.startY;
          g.state = 'chase';
        } else {
          this.die();
        }
      }
    }
  }
  
  private die(): void {
    this.lives--;
    if (this.lives <= 0) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
    } else {
      // Reset positions
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
    renderer.clear("#000000");
    const cellSize = 16;
    const offsetX = (renderer.getWidth() - 23 * cellSize) / 2;
    const offsetY = (renderer.getHeight() - 23 * cellSize) / 2;
    
    // Draw Maze
    for (let y = 0; y < 23; y++) {
      for (let x = 0; x < 23; x++) {
        if (this.isWall(x, y)) {
          renderer.drawRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize, cellSize, "#1122AA");
        }
      }
    }
    
    // Draw Pellets
    for (const p of this.pellets) {
      if (p.power) {
        renderer.drawCircle(offsetX + p.x * cellSize + cellSize/2, offsetY + p.y * cellSize + cellSize/2, 5, "#FFAA00");
      } else {
        renderer.drawCircle(offsetX + p.x * cellSize + cellSize/2, offsetY + p.y * cellSize + cellSize/2, 2, "#FFFFFF");
      }
    }
    
    // Draw Player
    renderer.drawCircle(offsetX + this.player.x * cellSize + cellSize/2, offsetY + this.player.y * cellSize + cellSize/2, cellSize/2 - 2, "#FFFF00");
    
    // Draw Ghosts
    const ghostColors = ["#FF0000", "#FFB8FF", "#00FFFF", "#FFB852"];
    for (const g of this.ghosts) {
      const color = g.state === 'frightened' ? "#0000FF" : ghostColors[g.type];
      renderer.drawRect(offsetX + g.x * cellSize + 2, offsetY + g.y * cellSize + 2, cellSize - 4, cellSize - 4, color);
    }
    
    // Draw UI
    renderer.drawText(`SCORE: ${this.score}`, 10, 20, {color: "#FFF", size: 16});
    renderer.drawText(`LIVES: ${this.lives}`, renderer.getWidth() - 80, 20, {color: "#FFF", size: 16});
    
    if (this.gameOver) {
      renderer.drawText("GAME OVER", renderer.getWidth()/2, renderer.getHeight()/2, {color: "#F00", size: 32, align: "center"});
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
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }
  public getLives(): number { return this.lives; }
}
