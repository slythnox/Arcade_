import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { GameAction } from "../../core/types/game";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";

const TILE_SIZE = 32;

const LEVELS: string[][] = [
  [
    "...................................................F",
    "...................................................#",
    "..................?..........?......................#",
    "..........E..............E.........................#",
    "########.....####......####.......####.......######",
    "P......................................................",
    "###################################################",
  ],
  [
    "...........................................................F",
    "...........................................................#",
    ".............................=C=...........................#",
    "..........................E.......E........................#",
    "P..........E..........#######...#######.........^..........#",
    "#####....#####....####...................########......#####",
    "#####^^^^#####^^^^####...................########^^^^^^#####"
  ],
  [
    "....................................................................F",
    "....................................................................#",
    "....................................M...............................#",
    ".............................C......................................#",
    "P...........=C=............###..........................E..........#",
    "######...E.......E......###..................^.......######.....#####",
    "######.#############.###..................#######....######.....#####"
  ],
  [
    "......................................................................F",
    "......................................................................#",
    ".......................................................C.............#",
    "...............................V......................C.............#",
    "P............?.......................................C..............#",
    "#####.......###.......E..................E...................########",
    "#####^^^^^^^###^^^^#######^^^^^^^^^^#######^^^^^^^^^^^^^^########"
  ],
  [
    ".........................................................................F",
    ".........................................................................#",
    "...................................=C=...................................#",
    "................................E.......E.......................E........#",
    "P..........=C=...............#######.#######.................#####.......#",
    "######..............M..........................M..........M..............#",
    "######...######............##....................##.......##.............#"
  ],
  [
    "......................................................................F",
    "......................................................................#",
    "..........................................................C...........#",
    "P........................V..................V.............C...........#",
    "######....................................................C...........#",
    "######...E.....E..................E.......................C...........#",
    "######.###########.............#######..................#####......####"
  ],
  [
    "...........................................................................F",
    "...........................................................................#",
    "...........................................................................#",
    "...........................=C=C=C=.........................................#",
    "P...........E.......E.......................E.......E............E.........#",
    "######...#######.#######.............#######.#######.....#######.#######",
    "######^^^#######^#######^^^^^^^^^^^^^#######^#######^^^^^#######^#######"
  ],
  [
    "...........................................................................F",
    "...........................................................................#",
    "..................................V........................................#",
    ".................................................V.........................#",
    "P.............M..................................................M.........#",
    "#######..................###...............................................#",
    "#######^^^^^^^^^^^^^^^^^^###^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^#"
  ],
  [
    "........................................................................F",
    "........................................................................#",
    "........................................................................#",
    ".......................?.......................?........................#",
    "P..........=C=.......=C=C=.......=C=.......=C=C=.......................#",
    "#####....#######...#########...#######...#########.............M........#",
    "#####^^^^#######^^^#########^^^#######^^^#########^^^^^^####^^^^^^^^####"
  ],
  [
    "........................................................................F",
    "........................................................................#",
    "................................C.C.....................................#",
    "...............................C...C....................................#",
    "P...........E.......E.........C.....C.........E.......E................#",
    "#####....#######.#######.....#########.....#######.#######...........####",
    "#####^^^^#######^#######^^^^^#########^^^^^#######^#######^^^^^^^^^^^####"
  ],
  [
    "........................................................................F",
    "........................................................................#",
    "..................................V.....................................#",
    "......................V.......................V.........................#",
    "P..........................................................M............#",
    "#####.......M...........................................................#",
    "#####^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^###"
  ],
  [
    "........................................................................F",
    "........................................................................#",
    "........................................................................#",
    "..........................=C=C=C=C=C=C=.................................#",
    "P...........E.......E.......E.......E.......E.......E...................#",
    "#####....#######.#######.#######.#######.#######.#######...........######",
    "#####^^^^#######^#######^#######^#######^#######^#######^^^^^^^^^^^######"
  ]
];

interface Entity {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  type: string;
  id: number;
  dead?: boolean;
  startX?: number;
  startY?: number;
  timer?: number;
}

export class PixelQuestGame implements GameInstance {
  private ctx!: GameContext;
  private currentLevel: number = 0;
  private score: number = 0;
  private lives: number = 3;
  private state: "playing" | "paused" | "gameover" | "victory" | "level_transition" = "playing";

  private player: Entity = { x: 0, y: 0, w: 20, h: 28, vx: 0, vy: 0, type: "player", id: 0 };
  private enemies: Entity[] = [];
  private coins: Entity[] = [];
  private platforms: Entity[] = [];
  
  private map: string[] = [];
  private mapW: number = 0;
  private mapH: number = 0;
  
  private inputX: number = 0;
  private isJumping: boolean = false;
  
  private lastJumpPressTime: number = 0;
  private grounded: boolean = false;
  private lastGroundedTime: number = 0;
  private timeAlive: number = 0;
  
  private cameraX: number = 0;
  private cameraY: number = 0;
  
  private nextEntityId: number = 1;
  private levelTime: number = 0;
  private transitionTimer: number = 0;
  
  private coinTimer: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    this.currentLevel = 0;
    this.score = 0;
    this.lives = 3;
    this.state = "playing";
    this.loadLevel(this.currentLevel);
  }

  private loadLevel(index: number) {
    if (index >= LEVELS.length) {
      this.state = "victory";
      this.score += 1000;
      return;
    }
    this.map = [...LEVELS[index]];
    this.mapW = this.map[0].length;
    this.mapH = this.map.length;
    
    this.enemies = [];
    this.coins = [];
    this.platforms = [];
    this.nextEntityId = 1;
    this.levelTime = 0;
    
    for (let y = 0; y < this.mapH; y++) {
      for (let x = 0; x < this.mapW; x++) {
        const t = this.map[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        
        if (t === 'P') {
          this.player.x = px + 6;
          this.player.y = py + 4;
          this.player.vx = 0;
          this.player.vy = 0;
          this.map[y] = this.map[y].substring(0, x) + '.' + this.map[y].substring(x + 1);
        } else if (t === 'E') {
          this.enemies.push({ x: px + 4, y: py + 8, w: 24, h: 24, vx: 50, vy: 0, type: "goomba", id: this.nextEntityId++ });
          this.map[y] = this.map[y].substring(0, x) + '.' + this.map[y].substring(x + 1);
        } else if (t === 'C') {
          this.coins.push({ x: px + 8, y: py + 8, w: 16, h: 16, vx: 0, vy: 0, type: "coin", id: this.nextEntityId++ });
          this.map[y] = this.map[y].substring(0, x) + '.' + this.map[y].substring(x + 1);
        } else if (t === 'M') {
          this.platforms.push({ x: px, y: py, w: 48, h: 16, vx: 80, vy: 0, type: "hmoving", id: this.nextEntityId++, startX: px });
          this.map[y] = this.map[y].substring(0, x) + '.' + this.map[y].substring(x + 1);
        } else if (t === 'V') {
          this.platforms.push({ x: px, y: py, w: 48, h: 16, vx: 0, vy: 80, type: "vmoving", id: this.nextEntityId++, startY: py });
          this.map[y] = this.map[y].substring(0, x) + '.' + this.map[y].substring(x + 1);
        }
      }
    }
    
    this.cameraX = this.player.x - 400;
    this.cameraY = (this.mapH * TILE_SIZE) / 2 - 300;
  }

  public update(deltaTime: number): void {
    if (this.state === "paused" || this.state === "gameover" || this.state === "victory") return;
    
    if (this.state === "level_transition") {
      this.transitionTimer -= deltaTime;
      if (this.transitionTimer <= 0) {
        this.state = "playing";
      }
      return;
    }

    this.timeAlive += deltaTime;
    this.levelTime += deltaTime;
    this.coinTimer += deltaTime;

    // Player Physics
    this.player.vx += this.inputX * 500 * deltaTime;
    
    if (this.inputX === 0) {
      this.player.vx *= 0.75;
    }
    
    if (this.player.vx > 220) this.player.vx = 220;
    if (this.player.vx < -220) this.player.vx = -220;
    
    this.player.vy += 900 * deltaTime;
    if (this.player.vy > 700) this.player.vy = 700;

    // Move Platforms
    let onPlatform: Entity | null = null;
    for (const p of this.platforms) {
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      
      if (p.type === "hmoving") {
        if (p.startX !== undefined && Math.abs(p.x - p.startX) > 100) {
          p.vx *= -1;
        }
      } else if (p.type === "vmoving") {
         if (p.startY !== undefined && Math.abs(p.y - p.startY) > 100) {
          p.vy *= -1;
        }
      }
      
      // Basic check if player is standing on this platform
      if (this.player.y + this.player.h >= p.y && this.player.y + this.player.h <= p.y + 10 &&
          this.player.x + this.player.w > p.x && this.player.x < p.x + p.w && this.player.vy >= 0) {
          onPlatform = p;
      }
    }

    // Apply platform velocity if standing on one
    let extraVx = 0;
    let extraVy = 0;
    if (onPlatform) {
      extraVx = onPlatform.vx;
      extraVy = onPlatform.vy;
    }

    // X axis move
    this.player.x += (this.player.vx + extraVx) * deltaTime;
    this.resolveCollisionsX(this.player);
    
    // Y axis move
    this.player.y += (this.player.vy + extraVy) * deltaTime;
    const { landed, hitCeiling } = this.resolveCollisionsY(this.player);
    
    if (landed || onPlatform) {
      this.grounded = true;
      this.lastGroundedTime = this.timeAlive;
      this.player.vy = 0;
    } else {
      this.grounded = false;
    }
    
    if (hitCeiling) {
      this.player.vy = 0;
    }
    
    // Jump logic with coyote time and jump buffer
    if (this.timeAlive - this.lastJumpPressTime <= 0.1 && this.timeAlive - this.lastGroundedTime <= 0.12) {
      this.player.vy = -580;
      this.lastJumpPressTime = -1; // Consume jump
      this.grounded = false;
      this.ctx.audio.playTone(400, "square", 0.1);
    }
    
    // Enemy logic
    for (const e of this.enemies) {
      if (e.dead) continue;
      
      e.vy += 900 * deltaTime;
      if (e.vy > 700) e.vy = 700;
      
      e.x += e.vx * deltaTime;
      const exRes = this.resolveCollisionsX(e);
      if (exRes.hitWall) {
        e.vx *= -1;
      }
      
      // Ledge detection
      const dir = e.vx > 0 ? 1 : -1;
      const tx = Math.floor((e.x + e.w / 2 + dir * e.w / 2) / TILE_SIZE);
      const ty = Math.floor((e.y + e.h + 2) / TILE_SIZE);
      if (this.getTile(tx, ty) === '.') {
        e.vx *= -1;
      }

      e.y += e.vy * deltaTime;
      const eyRes = this.resolveCollisionsY(e);
      if (eyRes.landed) e.vy = 0;
      
      // Check collision with player
      if (!e.dead && this.checkOverlap(this.player, e)) {
        if (this.player.vy > 0 && this.player.y + this.player.h < e.y + e.h / 2) {
          // Stomp
          e.dead = true;
          this.player.vy = -400; // Bounce
          this.score += 200;
          this.ctx.audio.playTone(600, "square", 0.1);
        } else {
          // Hurt
          this.die();
          return;
        }
      }
    }
    
    // Collectables
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      if (this.checkOverlap(this.player, c)) {
        this.coins.splice(i, 1);
        this.score += 50;
        this.ctx.audio.playTone(800, "sine", 0.1);
      }
    }
    
    // Check Spikes & Falls
    const ptx = Math.floor((this.player.x + this.player.w / 2) / TILE_SIZE);
    const pty = Math.floor((this.player.y + this.player.h - 2) / TILE_SIZE);
    if (this.getTile(ptx, pty) === '^') {
      this.die();
      return;
    }
    if (this.player.y > this.mapH * TILE_SIZE + 100) {
      this.die();
      return;
    }
    
    // Goal
    if (this.getTile(ptx, pty) === 'F' || this.getTile(Math.floor((this.player.x + this.player.w/2)/TILE_SIZE), Math.floor(this.player.y/TILE_SIZE)) === 'F') {
      this.score += Math.max(0, 1000 - Math.floor(this.levelTime) * 10);
      this.currentLevel++;
      this.state = "level_transition";
      this.transitionTimer = 2.0;
      this.ctx.audio.playTone(400, "sine", 0.1);
      setTimeout(() => this.ctx.audio.playTone(600, "sine", 0.1), 100);
      setTimeout(() => this.ctx.audio.playTone(800, "sine", 0.2), 200);
      this.loadLevel(this.currentLevel);
      return;
    }
    
    // Camera Update (Lerp X, Fixed Y)
    const targetCamX = this.player.x - 400;
    this.cameraX += (targetCamX - this.cameraX) * 0.08;
    this.cameraY = (this.mapH * TILE_SIZE) / 2 - 300;
  }

  private die() {
    this.lives--;
    this.ctx.audio.playTone(200, "sawtooth", 0.3);
    if (this.lives <= 0) {
      this.state = "gameover";
    } else {
      this.loadLevel(this.currentLevel);
    }
  }

  private checkOverlap(a: Entity, b: Entity): boolean {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  private getTile(x: number, y: number): string {
    if (x < 0 || x >= this.mapW || y < 0 || y >= this.mapH) return '.';
    return this.map[y][x];
  }
  
  private isSolid(t: string): boolean {
    return t === '#' || t === '=' || t === '?';
  }

  private resolveCollisionsX(e: Entity) {
    let hitWall = false;
    const txStart = Math.floor(e.x / TILE_SIZE);
    const txEnd = Math.floor((e.x + e.w) / TILE_SIZE);
    const tyStart = Math.floor(e.y / TILE_SIZE);
    const tyEnd = Math.floor((e.y + e.h - 1) / TILE_SIZE);

    for (let ty = tyStart; ty <= tyEnd; ty++) {
      for (let tx = txStart; tx <= txEnd; tx++) {
        const t = this.getTile(tx, ty);
        if (this.isSolid(t)) {
          // Resolve X overlap
          const tileLeft = tx * TILE_SIZE;
          const tileRight = tileLeft + TILE_SIZE;
          if (e.vx > 0) {
            e.x = tileLeft - e.w;
          } else if (e.vx < 0) {
            e.x = tileRight;
          }
          e.vx = 0;
          hitWall = true;
          break;
        }
      }
    }
    return { hitWall };
  }

  private resolveCollisionsY(e: Entity) {
    let landed = false;
    let hitCeiling = false;
    const txStart = Math.floor(e.x / TILE_SIZE);
    const txEnd = Math.floor((e.x + e.w - 1) / TILE_SIZE);
    const tyStart = Math.floor(e.y / TILE_SIZE);
    const tyEnd = Math.floor((e.y + e.h) / TILE_SIZE);

    for (let ty = tyStart; ty <= tyEnd; ty++) {
      for (let tx = txStart; tx <= txEnd; tx++) {
        const t = this.getTile(tx, ty);
        if (this.isSolid(t)) {
          const tileTop = ty * TILE_SIZE;
          const tileBottom = tileTop + TILE_SIZE;
          if (e.vy > 0) {
            e.y = tileTop - e.h;
            landed = true;
          } else if (e.vy < 0) {
            e.y = tileBottom;
            hitCeiling = true;
            
            // Block bump logic
            if (e === this.player && (t === '=' || t === '?')) {
               this.bumpBlock(tx, ty, t);
            }
          }
          break;
        }
      }
    }
    return { landed, hitCeiling };
  }
  
  private bumpBlock(tx: number, ty: number, type: string) {
    if (type === '?') {
      // Turn to solid block, spawn coin
      this.map[ty] = this.map[ty].substring(0, tx) + '#' + this.map[ty].substring(tx + 1);
      this.score += 50;
      this.ctx.audio.playTone(800, "sine", 0.1);
      // Spawn bouncing coin effect (simplified by just adding score and sound)
    } else if (type === '=') {
      // Break block
      this.map[ty] = this.map[ty].substring(0, tx) + '.' + this.map[ty].substring(tx + 1);
      this.ctx.audio.playTone(150, "square", 0.1);
    }
  }

  public render(renderer: Renderer): void {
    if (renderer instanceof PixelRenderer) {
      this.renderPixel(renderer);
      return;
    }
    
    // Fallback Canvas Renderer implementation
    renderer.clear("#5c94fc");
    renderer.save();
    renderer.translate(-this.cameraX, -this.cameraY);

    // Draw Map
    for (let y = 0; y < this.mapH; y++) {
      for (let x = 0; x < this.mapW; x++) {
        const t = this.map[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        
        if (t === '#') {
          renderer.drawRect(px, py, TILE_SIZE, TILE_SIZE, "#c84c0c");
        } else if (t === '=') {
          renderer.drawRect(px, py, TILE_SIZE, TILE_SIZE, "#cc4400");
        } else if (t === '?') {
          renderer.drawRect(px, py, TILE_SIZE, TILE_SIZE, "#fc9838");
        } else if (t === '^') {
          renderer.drawRect(px, py + TILE_SIZE / 2, TILE_SIZE, TILE_SIZE / 2, "#dddddd");
        } else if (t === 'F') {
          renderer.drawRect(px + TILE_SIZE/2 - 2, py - TILE_SIZE*4, 4, TILE_SIZE*5, "#dddddd");
          renderer.drawRect(px + TILE_SIZE/2, py - TILE_SIZE*4, TILE_SIZE, TILE_SIZE, "#00ff00");
        }
      }
    }
    
    // Draw Platforms
    for (const p of this.platforms) {
      renderer.drawRect(p.x, p.y, p.w, p.h, "#00ffcc");
    }

    // Draw Coins
    for (const c of this.coins) {
      renderer.drawCircle(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, "#fcd800");
    }

    // Draw Enemies
    for (const e of this.enemies) {
      if (!e.dead) {
        renderer.drawRect(e.x, e.y, e.w, e.h, "#e02000");
      }
    }

    // Draw Player
    renderer.drawRect(this.player.x, this.player.y, this.player.w, this.player.h, "#ffcccc");

    renderer.restore();
    
    this.renderUI(renderer);
  }

  private renderPixel(pr: PixelRenderer) {
    pr.clear("#5c94fc");
    pr.save();
    pr.translate(-pr.quantize(this.cameraX), -pr.quantize(this.cameraY));
    
    // Draw Clouds (background)
    pr.drawPixelBlock(this.cameraX + 200, this.cameraY + 100, 40, "#ffffff");
    pr.drawPixelBlock(this.cameraX + 220, this.cameraY + 90, 40, "#ffffff");
    pr.drawPixelBlock(this.cameraX + 500, this.cameraY + 50, 60, "#ffffff");

    // Draw Map
    const startX = Math.max(0, Math.floor(this.cameraX / TILE_SIZE));
    const endX = Math.min(this.mapW, Math.floor((this.cameraX + 800) / TILE_SIZE) + 1);
    const startY = Math.max(0, Math.floor(this.cameraY / TILE_SIZE));
    const endY = Math.min(this.mapH, Math.floor((this.cameraY + 600) / TILE_SIZE) + 1);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const t = this.map[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        
        if (t === '#') {
          pr.drawPixelBlock(px, py, TILE_SIZE, "#c84c0c", "#fc9838", "#882800");
        } else if (t === '=') {
          pr.drawPixelRect(px, py, TILE_SIZE, TILE_SIZE, "#cc4400", "#ff8800", "#880000");
          // mortar lines
          pr.drawRect(px, py + TILE_SIZE / 2, TILE_SIZE, 2, "#880000");
          pr.drawRect(px + TILE_SIZE / 2, py, 2, TILE_SIZE / 2, "#880000");
          pr.drawRect(px + TILE_SIZE / 4, py + TILE_SIZE / 2, 2, TILE_SIZE / 2, "#880000");
        } else if (t === '?') {
          pr.drawPixelBlock(px, py, TILE_SIZE, "#fc9838", "#fce0a8", "#c84c0c");
          pr.drawText("?", px + 10, py + 22, { color: "#ffffff", size: 20 });
        } else if (t === '^') {
           pr.drawPixelRect(px + 4, py + TILE_SIZE / 2, TILE_SIZE - 8, TILE_SIZE / 2, "#eeeeee", "#ffffff", "#aaaaaa");
        } else if (t === 'F') {
           pr.drawRect(px + TILE_SIZE/2 - 2, py - TILE_SIZE*4, 4, TILE_SIZE*5, "#cccccc");
           pr.drawPixelRect(px + TILE_SIZE/2, py - TILE_SIZE*4 + (Math.sin(this.timeAlive * 5) * 5), TILE_SIZE, TILE_SIZE, "#00cc00", "#55ff55", "#008800");
        }
      }
    }
    
    // Platforms
    for (const p of this.platforms) {
      pr.drawPixelRect(p.x, p.y, p.w, p.h, "#00ffcc", "#ffffff", "#008888");
    }

    // Coins
    for (const c of this.coins) {
      const scale = Math.abs(Math.sin(this.coinTimer * 5));
      const w = c.w * scale;
      const x = c.x + (c.w - w) / 2;
      if (w > 2) {
        pr.drawPixelRect(x, c.y, w, c.h, "#fcd800", "#ffffff", "#c88c00");
      }
    }

    // Enemies
    for (const e of this.enemies) {
      if (!e.dead) {
        const bounce = Math.sin(this.timeAlive * 10) * 2;
        pr.drawPixelRect(e.x, e.y + bounce, e.w, e.h, "#e02000", "#ff6040", "#800000");
        pr.drawRect(e.x + 4, e.y + bounce + 4, 4, 4, "#ffffff");
        pr.drawRect(e.x + e.w - 8, e.y + bounce + 4, 4, 4, "#ffffff");
      }
    }

    // Player
    const pWalkOffset = (this.inputX !== 0 && this.grounded) ? Math.sin(this.timeAlive * 15) * 2 : 0;
    
    // Body
    pr.drawPixelRect(this.player.x, this.player.y, this.player.w, this.player.h, "#ffffff", "#ffffff", "#cccccc");
    // Eyes
    const faceDir = this.player.vx >= 0 ? 1 : -1;
    const eyeX = faceDir > 0 ? this.player.x + 12 : this.player.x + 4;
    pr.drawRect(eyeX, this.player.y + 4, 4, 4, "#000000");
    // Feet
    pr.drawRect(this.player.x + 2, this.player.y + this.player.h - 4 + pWalkOffset, 6, 4, "#888888");
    pr.drawRect(this.player.x + this.player.w - 8, this.player.y + this.player.h - 4 - pWalkOffset, 6, 4, "#888888");

    pr.restore();
    
    this.renderUI(pr);
  }

  private renderUI(renderer: Renderer) {
    renderer.drawText(`SCORE: ${this.score}`, 10, 20, { color: "#ffffff", size: 16 });
    renderer.drawText(`LEVEL: ${this.currentLevel + 1}`, renderer.getWidth() / 2, 20, { color: "#ffffff", size: 16, align: "center" });
    renderer.drawText(`LIVES: ${this.lives}`, renderer.getWidth() - 10, 20, { color: "#ffffff", size: 16, align: "right" });
    
    if (this.state === "paused") {
      renderer.drawRect(0, 0, renderer.getWidth(), renderer.getHeight(), "rgba(0,0,0,0.5)");
      renderer.drawText("PAUSED", renderer.getWidth() / 2, renderer.getHeight() / 2, { color: "#ffffff", size: 40, align: "center" });
    } else if (this.state === "gameover") {
      renderer.drawRect(0, 0, renderer.getWidth(), renderer.getHeight(), "rgba(0,0,0,0.8)");
      renderer.drawText("GAME OVER", renderer.getWidth() / 2, renderer.getHeight() / 2, { color: "#ff0000", size: 50, align: "center" });
      renderer.drawText("Press R to Restart", renderer.getWidth() / 2, renderer.getHeight() / 2 + 50, { color: "#ffffff", size: 20, align: "center" });
    } else if (this.state === "victory") {
      renderer.drawRect(0, 0, renderer.getWidth(), renderer.getHeight(), "rgba(0,0,0,0.8)");
      renderer.drawText("YOU WIN!", renderer.getWidth() / 2, renderer.getHeight() / 2, { color: "#00ff00", size: 50, align: "center" });
      renderer.drawText(`FINAL SCORE: ${this.score}`, renderer.getWidth() / 2, renderer.getHeight() / 2 + 50, { color: "#ffffff", size: 20, align: "center" });
    } else if (this.state === "level_transition") {
      renderer.drawRect(0, 0, renderer.getWidth(), renderer.getHeight(), "rgba(0,0,0,1)");
      renderer.drawText(`LEVEL ${this.currentLevel + 1}`, renderer.getWidth() / 2, renderer.getHeight() / 2, { color: "#ffffff", size: 40, align: "center" });
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "PAUSE" && isPressed) {
      if (this.state === "playing") this.state = "paused";
      else if (this.state === "paused") this.state = "playing";
      return;
    }
    
    if (action === "RESTART" && isPressed) {
      this.reset();
      return;
    }
    
    if (this.state !== "playing") return;

    if (action === "MOVE_LEFT") {
      this.inputX = isPressed ? -1 : (this.inputX === -1 ? 0 : this.inputX);
    } else if (action === "MOVE_RIGHT") {
      this.inputX = isPressed ? 1 : (this.inputX === 1 ? 0 : this.inputX);
    } else if (action === "ACTION_PRIMARY" || action === "MOVE_UP") {
      if (isPressed) {
        this.lastJumpPressTime = this.timeAlive;
      }
    }
  }

  public pause(): void {
    if (this.state === "playing") {
      this.state = "paused";
    }
  }

  public resume(): void {
    if (this.state === "paused") {
      this.state = "playing";
    }
  }

  public destroy(): void {
    // Cleanup if needed
  }

  public getScore(): number {
    return this.score;
  }

  public getLevel(): number {
    return this.currentLevel + 1;
  }
  
  public getLives(): number {
    return this.lives;
  }
}
