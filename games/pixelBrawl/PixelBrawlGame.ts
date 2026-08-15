import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { GameAction } from "../../core/types/game";

const FIGHTERS = [
  { name: "STRIKER",  speed: 5, damage: 1.2, health: 100, special: "fireball" },
  { name: "TANK",     speed: 3, damage: 1.5, health: 150, special: "charge" },
  { name: "SPEEDSTER",speed: 7, damage: 0.8, health: 80,  special: "dash-strike" },
  { name: "BRUISER",  speed: 4, damage: 1.3, health: 120, special: "slam" },
];

const MOVES = {
  light_punch: { startup: 3, active: 3, recovery: 8, damage: 5 },
  heavy_punch: { startup: 8, active: 4, recovery: 14, damage: 12 },
  light_kick: { startup: 4, active: 3, recovery: 10, damage: 6 },
  heavy_kick: { startup: 10, active: 5, recovery: 16, damage: 15 },
  special: { startup: 12, active: 6, recovery: 20, damage: 25 },
  throw: { startup: 5, active: 2, recovery: 18, damage: 20 }
};

interface FighterState {
  x: number;
  y: number;
  vy: number;
  hp: number;
  maxHp: number;
  state: 'idle' | 'moving' | 'attacking' | 'hitstun' | 'blocking' | 'crouching' | 'jumping';
  currentMove: keyof typeof MOVES | null;
  frame: number;
  facing: 1 | -1;
  wins: number;
  archetype: typeof FIGHTERS[0];
}

export class PixelBrawlGame implements GameInstance {
  private ctx!: GameContext;
  private p1!: FighterState;
  private p2!: FighterState;
  
  private score = 0;
  private level = 1;
  private round = 1;
  private combo = 0;
  private paused = false;
  
  private groundY = 300;
  
  // Input states
  private keys = { left: false, right: false, up: false, down: false, block: false };
  
  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }
  
  public reset(seed?: number): void {
    this.p1 = {
      x: 150, y: this.groundY, vy: 0,
      hp: FIGHTERS[0].health, maxHp: FIGHTERS[0].health,
      state: 'idle', currentMove: null, frame: 0, facing: 1, wins: 0,
      archetype: FIGHTERS[0]
    };
    this.p2 = {
      x: 450, y: this.groundY, vy: 0,
      hp: FIGHTERS[1].health, maxHp: FIGHTERS[1].health,
      state: 'idle', currentMove: null, frame: 0, facing: -1, wins: 0,
      archetype: FIGHTERS[1]
    };
    this.round = 1;
    this.combo = 0;
    this.score = 0;
  }
  
  public update(deltaTime: number): void {
    if (this.paused) return;
    
    // 60 FPS frame calculation
    const frames = Math.floor(deltaTime * 60) || 1;
    
    for (let i=0; i<frames; i++) {
      this.updateFighter(this.p1, this.p2, true);
      this.updateFighter(this.p2, this.p1, false);
      this.checkCollisions();
    }
  }
  
  private updateFighter(p: FighterState, opponent: FighterState, isPlayer: boolean) {
    // Gravity
    if (p.y < this.groundY) {
      p.vy += 1; // gravity
      p.y += p.vy;
      if (p.y >= this.groundY) {
        p.y = this.groundY;
        p.vy = 0;
        if (p.state === 'jumping') p.state = 'idle';
      }
    }
    
    if (p.state === 'attacking' && p.currentMove) {
      p.frame++;
      const move = MOVES[p.currentMove];
      const totalFrames = move.startup + move.active + move.recovery;
      if (p.frame >= totalFrames) {
        p.state = 'idle';
        p.currentMove = null;
        p.frame = 0;
      }
    } else if (p.state === 'hitstun') {
      p.frame++;
      if (p.frame > 15) {
        p.state = 'idle';
        p.frame = 0;
      }
    } else {
      if (isPlayer) {
        // Apply inputs
        if (p.state !== 'jumping') {
          if (this.keys.up) {
            p.state = 'jumping';
            p.vy = -15;
          } else if (this.keys.down) {
            p.state = 'crouching';
          } else if (this.keys.left) {
            p.x -= p.archetype.speed;
            p.state = 'moving';
            p.facing = p.x < opponent.x ? 1 : -1;
          } else if (this.keys.right) {
            p.x += p.archetype.speed;
            p.state = 'moving';
            p.facing = p.x < opponent.x ? 1 : -1;
          } else {
            p.state = 'idle';
          }
        }
      } else {
        // Basic AI
        if (p.state !== 'jumping') {
          p.facing = p.x < opponent.x ? 1 : -1;
          const dist = Math.abs(p.x - opponent.x);
          if (dist > 60) {
            p.x += p.facing * (p.archetype.speed * 0.5);
            p.state = 'moving';
          } else {
            if (Math.random() < 0.05) {
              this.startAttack(p, 'light_punch');
            }
          }
        }
      }
    }
    
    // Bounds
    if (p.x < 20) p.x = 20;
    if (p.x > 620) p.x = 620;
  }
  
  private startAttack(p: FighterState, move: keyof typeof MOVES) {
    if (p.state !== 'attacking' && p.state !== 'hitstun') {
      p.state = 'attacking';
      p.currentMove = move;
      p.frame = 0;
    }
  }
  
  private checkCollisions() {
    this.checkHit(this.p1, this.p2);
    this.checkHit(this.p2, this.p1);
  }
  
  private checkHit(attacker: FighterState, defender: FighterState) {
    if (attacker.state === 'attacking' && attacker.currentMove) {
      const move = MOVES[attacker.currentMove];
      // Check if in active frames
      if (attacker.frame >= move.startup && attacker.frame < move.startup + move.active) {
        // Hitbox check
        const hitX = attacker.x + attacker.facing * 30;
        const dist = Math.abs(hitX - defender.x);
        
        // Ensure hit only triggers once per attack
        // For simplicity, we just trigger on first active frame
        if (attacker.frame === move.startup && dist < 40 && Math.abs(attacker.y - defender.y) < 50) {
          // Hit
          if (defender.state === 'moving' && defender.facing !== attacker.facing && this.keys.left) {
             // Blocked
             defender.hp -= move.damage * attacker.archetype.damage * 0.2;
             defender.x += attacker.facing * 10;
          } else {
             defender.hp -= move.damage * attacker.archetype.damage;
             defender.state = 'hitstun';
             defender.frame = 0;
             defender.x += attacker.facing * 20; // knockback
             if (attacker === this.p1) {
               this.combo++;
               this.score += move.damage * 10;
             }
          }
          
          if (defender.hp <= 0) {
            defender.hp = 0;
            this.roundEnd(attacker);
          }
        }
      }
    }
  }
  
  private roundEnd(winner: FighterState) {
    winner.wins++;
    this.round++;
    this.p1.hp = this.p1.maxHp;
    this.p2.hp = this.p2.maxHp;
    this.p1.x = 150;
    this.p2.x = 450;
    this.p1.state = 'idle';
    this.p2.state = 'idle';
    this.combo = 0;
  }
  
  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.keys.left = isPressed;
    if (action === "MOVE_RIGHT") this.keys.right = isPressed;
    if (action === "MOVE_UP") this.keys.up = isPressed;
    if (action === "MOVE_DOWN") this.keys.down = isPressed;
    
    if (action === "ACTION_PRIMARY" && isPressed) {
      this.startAttack(this.p1, 'light_punch');
    }
    if (action === "ACTION_SECONDARY" && isPressed) {
      this.startAttack(this.p1, 'heavy_kick');
    }
    if (action === "ROTATE" && isPressed) {
      this.startAttack(this.p1, 'special');
    }
  }
  
  public render(renderer: Renderer): void {
    const w = renderer.getWidth();
    const h = renderer.getHeight();
    
    renderer.clear("#1a1a2e");
    
    // Draw ground
    renderer.drawRect(0, this.groundY, w, h - this.groundY, "#16213e", true);
    
    // Draw fighters
    this.drawFighter(renderer, this.p1, "#e94560");
    this.drawFighter(renderer, this.p2, "#0f3460");
    
    // UI
    renderer.drawRect(20, 20, 200, 20, "#333", true);
    renderer.drawRect(20, 20, (this.p1.hp / this.p1.maxHp) * 200, 20, "#00ff00", true);
    
    renderer.drawRect(w - 220, 20, 200, 20, "#333", true);
    renderer.drawRect(w - 220, 20, (this.p2.hp / this.p2.maxHp) * 200, 20, "#ff0000", true);
    
    renderer.drawText(`Round ${this.round}`, w/2, 30, { align: 'center', size: 20 });
    
    if (this.combo > 1) {
      renderer.drawText(`${this.combo} Hit Combo!`, 50, 100, { color: '#ffeb3b', size: 24 });
    }
  }
  
  private drawFighter(renderer: Renderer, p: FighterState, color: string) {
    // Body
    renderer.drawRect(p.x - 15, p.y - 60, 30, 60, color, true);
    // Head
    renderer.drawCircle(p.x, p.y - 75, 15, color, true);
    
    // Attack extension
    if (p.state === 'attacking' && p.currentMove) {
      const move = MOVES[p.currentMove];
      if (p.frame >= move.startup && p.frame < move.startup + move.active) {
        renderer.drawRect(p.x + (p.facing * 15), p.y - 50, p.facing * 30, 10, "#ffffff", true);
      }
    }
  }
  
  public pause(): void { this.paused = true; }
  public resume(): void { this.paused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }
}
