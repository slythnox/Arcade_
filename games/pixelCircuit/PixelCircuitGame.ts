import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { GameAction } from "../../core/types/game";

type Waypoint = { x: number; y: number };
const TRACKS: Waypoint[][] = [
  [
    { x: 300, y: 400 }, { x: 450, y: 200 }, { x: 600, y: 150 },
    { x: 750, y: 200 }, { x: 900, y: 400 }, { x: 750, y: 600 },
    { x: 450, y: 650 }, { x: 300, y: 600 },
  ],
  [
    { x: 200, y: 200 }, { x: 800, y: 200 }, { x: 800, y: 500 },
    { x: 500, y: 500 }, { x: 500, y: 700 }, { x: 200, y: 700 },
  ],
  [
    { x: 200, y: 400 }, { x: 400, y: 200 }, { x: 600, y: 400 },
    { x: 800, y: 200 }, { x: 800, y: 700 }, { x: 600, y: 500 },
    { x: 400, y: 700 }, { x: 200, y: 700 },
  ],
  [
    { x: 100, y: 100 }, { x: 900, y: 100 }, { x: 900, y: 300 },
    { x: 300, y: 300 }, { x: 300, y: 500 }, { x: 900, y: 500 },
    { x: 900, y: 700 }, { x: 100, y: 700 },
  ]
];

interface Kart {
  id: string;
  x: number;
  y: number;
  angle: number;
  speed: number;
  maxSpeed: number;
  lap: number;
  waypointIndex: number;
  color: string;
  isPlayer: boolean;
  drifting: boolean;
  driftBoost: number;
}

export class PixelCircuitGame implements GameInstance {
  private ctx!: GameContext;
  private trackIndex: number = 0;
  private track: Waypoint[] = [];
  
  private karts: Kart[] = [];
  private playerKart!: Kart;
  
  private score: number = 0;
  private isPaused: boolean = false;
  private gameOver: boolean = false;
  
  private inputAcc: boolean = false;
  private inputBrake: boolean = false;
  private inputLeft: boolean = false;
  private inputRight: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }
  
  public reset(seed?: number): void {
    if (seed !== undefined) {
      this.ctx.random.reset(seed);
    }
    this.score = 0;
    this.trackIndex = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.loadTrack();
  }
  
  private loadTrack(): void {
    this.track = TRACKS[this.trackIndex];
    const startWp = this.track[0];
    const nextWp = this.track[1];
    const startAngle = Math.atan2(nextWp.y - startWp.y, nextWp.x - startWp.x);
    
    this.karts = [
      { id: "p1", x: startWp.x, y: startWp.y, angle: startAngle, speed: 0, maxSpeed: 280, lap: 1, waypointIndex: 1, color: "#FF0000", isPlayer: true, drifting: false, driftBoost: 0 },
      { id: "ai1", x: startWp.x + 20, y: startWp.y + 20, angle: startAngle, speed: 0, maxSpeed: 260, lap: 1, waypointIndex: 1, color: "#0000FF", isPlayer: false, drifting: false, driftBoost: 0 },
      { id: "ai2", x: startWp.x - 20, y: startWp.y - 20, angle: startAngle, speed: 0, maxSpeed: 270, lap: 1, waypointIndex: 1, color: "#00FF00", isPlayer: false, drifting: false, driftBoost: 0 },
      { id: "ai3", x: startWp.x + 40, y: startWp.y + 40, angle: startAngle, speed: 0, maxSpeed: 250, lap: 1, waypointIndex: 1, color: "#FFFF00", isPlayer: false, drifting: false, driftBoost: 0 },
    ];
    this.playerKart = this.karts[0];
  }
  
  public update(deltaTime: number): void {
    if (this.gameOver || this.isPaused) return;
    
    for (const kart of this.karts) {
      if (kart.isPlayer) {
        this.updatePlayer(kart, deltaTime);
      } else {
        this.updateAI(kart, deltaTime);
      }
      this.checkWaypoint(kart);
    }
    
    // Basic collision resolution
    for (let i = 0; i < this.karts.length; i++) {
      for (let j = i + 1; j < this.karts.length; j++) {
        const k1 = this.karts[i];
        const k2 = this.karts[j];
        const dx = k2.x - k1.x;
        const dy = k2.y - k1.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 20) {
          const pushX = (dx / dist) * 2;
          const pushY = (dy / dist) * 2;
          k1.x -= pushX; k1.y -= pushY;
          k2.x += pushX; k2.y += pushY;
        }
      }
    }
    
    // Check win condition
    if (this.playerKart.lap > 3) {
      this.score += 1000;
      this.trackIndex++;
      if (this.trackIndex >= TRACKS.length) {
        this.gameOver = true;
        this.ctx.session.setStatus("game-over");
      } else {
        this.loadTrack();
      }
    }
  }
  
  private updatePlayer(kart: Kart, dt: number): void {
    if (this.inputAcc) {
      kart.speed += 300 * dt;
    } else if (this.inputBrake) {
      kart.speed -= 400 * dt;
    } else {
      kart.speed *= 0.96;
    }
    
    if (kart.driftBoost > 0) {
      kart.speed += 500 * dt;
      kart.driftBoost -= dt;
    }
    
    kart.speed = Math.max(-50, Math.min(kart.speed, kart.maxSpeed + (kart.driftBoost > 0 ? 100 : 0)));
    
    const turnRate = 2.5;
    let turn = 0;
    if (this.inputLeft) turn -= 1;
    if (this.inputRight) turn += 1;
    
    if (kart.speed > 10) {
      kart.angle += turnRate * turn * dt * (1 - kart.speed / 600);
    }
    
    if (this.inputBrake && turn !== 0 && kart.speed > 100) {
      kart.drifting = true;
    } else {
      if (kart.drifting) {
        kart.driftBoost = 0.5; // Drift boost on release
        kart.drifting = false;
      }
    }
    
    kart.x += Math.cos(kart.angle) * kart.speed * dt;
    kart.y += Math.sin(kart.angle) * kart.speed * dt;
  }
  
  private updateAI(kart: Kart, dt: number): void {
    const targetWp = this.track[kart.waypointIndex];
    const targetAngle = Math.atan2(targetWp.y - kart.y, targetWp.x - kart.x);
    
    let angleDiff = targetAngle - kart.angle;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    
    kart.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 2.0 * dt);
    
    kart.speed += 200 * dt;
    kart.speed = Math.max(0, Math.min(kart.speed, kart.maxSpeed));
    
    kart.x += Math.cos(kart.angle) * kart.speed * dt;
    kart.y += Math.sin(kart.angle) * kart.speed * dt;
  }
  
  private checkWaypoint(kart: Kart): void {
    const wp = this.track[kart.waypointIndex];
    const dist = Math.sqrt(Math.pow(kart.x - wp.x, 2) + Math.pow(kart.y - wp.y, 2));
    
    if (dist < 100) {
      kart.waypointIndex++;
      if (kart.waypointIndex >= this.track.length) {
        kart.waypointIndex = 0;
        kart.lap++;
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    switch (action) {
      case "MOVE_UP": this.inputAcc = isPressed; break;
      case "MOVE_DOWN": this.inputBrake = isPressed; break;
      case "MOVE_LEFT": this.inputLeft = isPressed; break;
      case "MOVE_RIGHT": this.inputRight = isPressed; break;
    }
  }
  
  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.trackIndex + 1; }
  
  public render(renderer: Renderer): void {
    renderer.clear("#228B22");
    
    const w = renderer.getWidth();
    const h = renderer.getHeight();
    
    renderer.save();
    
    // Camera follow player
    const scale = 0.5; // Zoom out
    renderer.translate(w/2, h/2);
    renderer.scale(scale, scale);
    renderer.translate(-this.playerKart.x, -this.playerKart.y);
    
    // Draw Track
    for (let i = 0; i < this.track.length; i++) {
      const p1 = this.track[i];
      const p2 = this.track[(i + 1) % this.track.length];
      renderer.drawLine(p1.x, p1.y, p2.x, p2.y, "#333333", 80);
      renderer.drawLine(p1.x, p1.y, p2.x, p2.y, "#FFFFFF", 2); // Center line
    }
    
    // Draw Karts
    for (const kart of this.karts) {
      renderer.save();
      renderer.translate(kart.x, kart.y);
      renderer.rotate(kart.angle);
      
      renderer.drawRect(-10, -5, 20, 10, kart.color, true);
      renderer.drawCircle(10, 0, 3, "#FFFFFF", true); // Front dot
      
      if (kart.drifting) {
        renderer.drawCircle(-15, -5, 3, "#FFA500", true);
        renderer.drawCircle(-15, 5, 3, "#FFA500", true);
      }
      if (kart.driftBoost > 0) {
        renderer.drawCircle(-15, 0, 5, "#00FFFF", true);
      }
      
      renderer.restore();
    }
    
    renderer.restore();
    
    // HUD
    renderer.drawText(`Lap: ${this.playerKart.lap}/3`, 20, 30, { size: 20, color: "#FFFFFF" });
    renderer.drawText(`Speed: ${Math.floor(this.playerKart.speed)}`, 20, 60, { size: 20, color: "#FFFFFF" });
    
    // Minimap
    const mmSize = 150;
    const mmX = w - mmSize - 20;
    const mmY = 20;
    renderer.drawRect(mmX, mmY, mmSize, mmSize, "rgba(0,0,0,0.5)", true);
    for (const kart of this.karts) {
      // Map world coords (0-1000 roughly) to minimap (0-150)
      const mx = mmX + (kart.x / 1000) * mmSize;
      const my = mmY + (kart.y / 1000) * mmSize;
      renderer.drawCircle(mx, my, 4, kart.color, true);
    }
    
    if (this.gameOver) {
      renderer.drawText("YOU WIN!", w/2, h/2, { size: 40, color: "#FFFF00", align: "center" });
    }
  }
}
