import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";
import type { DiamondRunGameState, PlayerState, LevelData, EntityState } from "./types";
import { TileType } from "./types";
import {
  TILE_SIZE,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_ACCEL,
  PLAYER_MAX_SPEED,
  PLAYER_FRICTION,
  ICE_FRICTION,
  JUMP_FORCE,
  GRAVITY,
  COYOTE_TIME_MAX,
  JUMP_BUFFER_MAX,
  INVULNERABILITY_MAX,
  DIAMOND_SCORE,
  GEM_RARE_SCORE,
  GEM_SECRET_SCORE,
  WORLD_PALETTES,
} from "./constants";
import { LEVELS } from "./LevelData";

export class DiamondRunGame implements GameInstance {
  private ctx!: GameContext;
  private gameState: DiamondRunGameState = "BOOT";
  private currentWorld: number = 1;
  private currentLevelIdx: number = 0; // 0..24
  private currentLevel!: LevelData;

  // Grid Map state
  private grid: number[][] = [];
  private cols: number = 20;
  private rows: number = 12;

  // Player state
  private player: PlayerState = {
    x: 32,
    y: 100,
    vx: 0,
    vy: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    isGrounded: false,
    isClimbing: false,
    isSliding: false,
    facing: "right",
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    invulnerabilityTimer: 0,
    isDead: false,
  };

  // Keys inventory
  private keys = { bronze: 0, silver: 0, gold: 0 };
  private diamondsCollected: number = 0;
  private gemsCollected: number = 0;
  private secretsFound: number = 0;
  private score: number = 0;
  private levelTime: number = 0;
  private checkpointPos: { x: number; y: number } | null = null;

  // Input states
  private moveLeft = false;
  private moveRight = false;
  private climbUp = false;
  private climbDown = false;
  private jumpPressed = false;

  // Camera lerp & screen shake
  private cameraX: number = 0;
  private cameraY: number = 0;
  private shakeTimer: number = 0;
  private bootTimer: number = 1.0;

  // Unlocked levels tracker
  private unlockedLevels: boolean[] = new Array(25).fill(false);

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.unlockedLevels[0] = true; // Level 1 is always unlocked
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.score = 0;
    this.diamondsCollected = 0;
    this.gemsCollected = 0;
    this.secretsFound = 0;
    this.bootTimer = 0.8;
    this.gameState = "BOOT";
    this.loadLevel(this.currentLevelIdx);
  }

  private loadLevel(idx: number): void {
    this.currentLevelIdx = Math.max(0, Math.min(LEVELS.length - 1, idx));
    this.currentLevel = LEVELS[this.currentLevelIdx];
    this.currentWorld = this.currentLevel.world;

    this.cols = this.currentLevel.width;
    this.rows = this.currentLevel.height;

    // Deep copy grid tiles
    this.grid = this.currentLevel.tiles.map((row) => [...row]);

    // Reset player position
    this.player.x = this.currentLevel.spawn.col * TILE_SIZE;
    this.player.y = this.currentLevel.spawn.row * TILE_SIZE - (PLAYER_HEIGHT - TILE_SIZE);
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isGrounded = false;
    this.player.isDead = false;
    this.player.invulnerabilityTimer = 0;

    this.checkpointPos = { x: this.player.x, y: this.player.y };
    this.keys = { bronze: 0, silver: 0, gold: 0 };
    this.diamondsCollected = 0;
    this.gemsCollected = 0;
    this.secretsFound = 0;
    this.levelTime = 0;

    // Center camera
    this.cameraX = this.player.x - LOGICAL_WIDTH / 2;
    this.cameraY = this.player.y - LOGICAL_HEIGHT / 2;
  }

  private triggerRespawn(): void {
    this.player.isDead = false;
    this.player.vx = 0;
    this.player.vy = 0;
    if (this.checkpointPos) {
      this.player.x = this.checkpointPos.x;
      this.player.y = this.checkpointPos.y;
    } else {
      this.player.x = this.currentLevel.spawn.col * TILE_SIZE;
      this.player.y = this.currentLevel.spawn.row * TILE_SIZE;
    }
    this.player.invulnerabilityTimer = INVULNERABILITY_MAX;
    this.gameState = "PLAYING";
  }

  public update(dt: number): void {
    globalParticles.update(dt);

    if (this.bootTimer > 0) {
      this.bootTimer -= dt;
      if (this.bootTimer <= 0) {
        this.gameState = "MENU";
      }
      return;
    }

    if (this.gameState !== "PLAYING") return;

    this.levelTime += dt;
    if (this.shakeTimer > 0) this.shakeTimer -= dt;
    if (this.player.invulnerabilityTimer > 0) this.player.invulnerabilityTimer -= dt;

    // --- PLAYER MOVEMENT ---
    const isIce = this.checkTileAt(this.player.x + PLAYER_WIDTH / 2, this.player.y + PLAYER_HEIGHT + 1) === TileType.ICE;
    const isMud = this.checkTileAt(this.player.x + PLAYER_WIDTH / 2, this.player.y + PLAYER_HEIGHT + 1) === TileType.MUD;

    const currentAccel = isMud ? PLAYER_ACCEL * 0.4 : PLAYER_ACCEL;
    const currentMaxSpeed = isMud ? PLAYER_MAX_SPEED * 0.5 : PLAYER_MAX_SPEED;

    if (this.moveLeft) {
      this.player.vx -= currentAccel * dt;
      this.player.facing = "left";
    } else if (this.moveRight) {
      this.player.vx += currentAccel * dt;
      this.player.facing = "right";
    } else {
      const friction = isIce ? ICE_FRICTION : PLAYER_FRICTION;
      this.player.vx *= Math.pow(friction, dt * 60);
    }

    this.player.vx = Math.max(-currentMaxSpeed, Math.min(currentMaxSpeed, this.player.vx));

    // Jump Buffering & Coyote Time
    if (this.player.isGrounded) {
      this.player.coyoteTimer = COYOTE_TIME_MAX;
    } else {
      this.player.coyoteTimer -= dt;
    }

    if (this.jumpPressed) {
      this.player.jumpBufferTimer = JUMP_BUFFER_MAX;
      this.jumpPressed = false;
    } else {
      this.player.jumpBufferTimer -= dt;
    }

    if (this.player.jumpBufferTimer > 0 && this.player.coyoteTimer > 0) {
      this.player.vy = -JUMP_FORCE;
      this.player.isGrounded = false;
      this.player.coyoteTimer = 0;
      this.player.jumpBufferTimer = 0;
      this.ctx.audio.playRotate();
      globalParticles.emitBurst(this.player.x + PLAYER_WIDTH / 2, this.player.y + PLAYER_HEIGHT, 8, ["#ffffff", "#C8A46A"], 40, 120);
    }

    // Gravity
    this.player.vy += GRAVITY * dt;
    this.player.vy = Math.min(320, this.player.vy);

    // X Collision
    this.player.x += this.player.vx * dt;
    this.resolveCollisionX();

    // Y Collision
    this.player.y += this.player.vy * dt;
    this.resolveCollisionY();

    // Collectibles & Tile Interactions
    this.checkTileInteractions();

    // Camera follow lerp
    const targetCamX = this.player.x + PLAYER_WIDTH / 2 - LOGICAL_WIDTH / 2;
    const targetCamY = this.player.y + PLAYER_HEIGHT / 2 - LOGICAL_HEIGHT / 2;
    const maxCamX = this.cols * TILE_SIZE - LOGICAL_WIDTH;
    const maxCamY = this.rows * TILE_SIZE - LOGICAL_HEIGHT;

    this.cameraX += (Math.max(0, Math.min(maxCamX, targetCamX)) - this.cameraX) * Math.min(1, dt * 8);
    this.cameraY += (Math.max(0, Math.min(maxCamY, targetCamY)) - this.cameraY) * Math.min(1, dt * 8);
  }

  private checkTileAt(x: number, y: number): number {
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return TileType.SOLID;
    return this.grid[row][col];
  }

  private resolveCollisionX(): void {
    const leftCol = Math.floor(this.player.x / TILE_SIZE);
    const rightCol = Math.floor((this.player.x + this.player.width) / TILE_SIZE);
    const topRow = Math.floor(this.player.y / TILE_SIZE);
    const bottomRow = Math.floor((this.player.y + this.player.height - 1) / TILE_SIZE);

    for (let r = topRow; r <= bottomRow; r++) {
      for (let c = leftCol; c <= rightCol; c++) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) continue;
        const tile = this.grid[r][c];

        if (this.isTileSolid(tile, c, r)) {
          if (this.player.vx > 0) {
            this.player.x = c * TILE_SIZE - this.player.width;
            this.player.vx = 0;
          } else if (this.player.vx < 0) {
            this.player.x = (c + 1) * TILE_SIZE;
            this.player.vx = 0;
          }
        }
      }
    }
  }

  private resolveCollisionY(): void {
    const leftCol = Math.floor(this.player.x / TILE_SIZE);
    const rightCol = Math.floor((this.player.x + this.player.width) / TILE_SIZE);
    const topRow = Math.floor(this.player.y / TILE_SIZE);
    const bottomRow = Math.floor((this.player.y + this.player.height) / TILE_SIZE);

    this.player.isGrounded = false;

    for (let r = topRow; r <= bottomRow; r++) {
      for (let c = leftCol; c <= rightCol; c++) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) continue;
        const tile = this.grid[r][c];

        if (this.isTileSolid(tile, c, r)) {
          if (this.player.vy > 0) {
            this.player.y = r * TILE_SIZE - this.player.height;
            this.player.vy = 0;
            this.player.isGrounded = true;
          } else if (this.player.vy < 0) {
            this.player.y = (r + 1) * TILE_SIZE;
            this.player.vy = 0;
          }
        }
      }
    }
  }

  private isTileSolid(tile: number, col: number, row: number): boolean {
    if (tile === TileType.SOLID || tile === TileType.BREAKABLE || tile === TileType.PUSHABLE) return true;
    if (tile === TileType.KEY_BRONZE_GATE && this.keys.bronze === 0) return true;
    if (tile === TileType.KEY_SILVER_GATE && this.keys.silver === 0) return true;
    if (tile === TileType.KEY_GOLD_GATE && this.keys.gold === 0) return true;
    return false;
  }

  private checkTileInteractions(): void {
    const centerCol = Math.floor((this.player.x + PLAYER_WIDTH / 2) / TILE_SIZE);
    const centerRow = Math.floor((this.player.y + PLAYER_HEIGHT / 2) / TILE_SIZE);

    if (centerRow < 0 || centerRow >= this.rows || centerCol < 0 || centerCol >= this.cols) return;

    const tile = this.grid[centerRow][centerCol];

    // Hazards (Spikes / Lava / Fire)
    if (tile === TileType.SPIKE || tile === TileType.LAVA || tile === TileType.FIRE_TRAP) {
      if (this.player.invulnerabilityTimer <= 0) {
        this.ctx.audio.playExplosion();
        this.shakeTimer = 0.3;
        this.gameState = "DEAD";
        globalParticles.emitBurst(this.player.x + PLAYER_WIDTH / 2, this.player.y + PLAYER_HEIGHT / 2, 24, ["#FF3366", "#FFB703", "#ffffff"], 80, 260);
        setTimeout(() => this.triggerRespawn(), 800);
        return;
      }
    }

    // Collect Diamonds
    if (tile === TileType.DIAMOND) {
      this.grid[centerRow][centerCol] = TileType.EMPTY;
      this.diamondsCollected++;
      this.score += DIAMOND_SCORE;
      this.ctx.audio.playCoin();
      globalParticles.emitBurst(centerCol * TILE_SIZE + 8, centerRow * TILE_SIZE + 8, 12, ["#4DE8E8", "#ffffff"], 50, 160);
      globalParticles.emitText(`+${DIAMOND_SCORE}`, centerCol * TILE_SIZE + 8, centerRow * TILE_SIZE, "#4DE8E8", 12);
    }

    // Rare Gem
    if (tile === TileType.GEM_RARE) {
      this.grid[centerRow][centerCol] = TileType.EMPTY;
      this.gemsCollected++;
      this.score += GEM_RARE_SCORE;
      this.ctx.audio.playPowerUp();
      globalParticles.emitBurst(centerCol * TILE_SIZE + 8, centerRow * TILE_SIZE + 8, 18, ["#FFB703", "#ffffff"], 70, 200);
      globalParticles.emitText(`+${GEM_RARE_SCORE}`, centerCol * TILE_SIZE + 8, centerRow * TILE_SIZE, "#FFB703", 14);
    }

    // Secret Gem
    if (tile === TileType.GEM_SECRET) {
      this.grid[centerRow][centerCol] = TileType.EMPTY;
      this.secretsFound++;
      this.score += GEM_SECRET_SCORE;
      this.ctx.audio.playVictory();
      globalParticles.emitBurst(centerCol * TILE_SIZE + 8, centerRow * TILE_SIZE + 8, 24, ["#A879FF", "#ffffff"], 90, 240);
      globalParticles.emitText(`SECRET! +${GEM_SECRET_SCORE}`, centerCol * TILE_SIZE + 8, centerRow * TILE_SIZE, "#A879FF", 16);
    }

    // Keys
    if (tile === TileType.KEY_BRONZE) {
      this.grid[centerRow][centerCol] = TileType.EMPTY;
      this.keys.bronze++;
      this.ctx.audio.playPowerUp();
      globalParticles.emitText("BRONZE KEY!", centerCol * TILE_SIZE + 8, centerRow * TILE_SIZE, "#FFD84D", 14);
    }
    if (tile === TileType.KEY_SILVER) {
      this.grid[centerRow][centerCol] = TileType.EMPTY;
      this.keys.silver++;
      this.ctx.audio.playPowerUp();
      globalParticles.emitText("SILVER KEY!", centerCol * TILE_SIZE + 8, centerRow * TILE_SIZE, "#E0F2FE", 14);
    }
    if (tile === TileType.KEY_GOLD) {
      this.grid[centerRow][centerCol] = TileType.EMPTY;
      this.keys.gold++;
      this.ctx.audio.playPowerUp();
      globalParticles.emitText("GOLD KEY!", centerCol * TILE_SIZE + 8, centerRow * TILE_SIZE, "#FFD84D", 14);
    }

    // Key Gates Unlock
    if (tile === TileType.KEY_BRONZE_GATE && this.keys.bronze > 0) {
      this.grid[centerRow][centerCol] = TileType.EMPTY;
      this.keys.bronze--;
      this.ctx.audio.playPowerUp();
    }

    // Checkpoint
    if (tile === TileType.CHECKPOINT) {
      this.checkpointPos = { x: centerCol * TILE_SIZE, y: centerRow * TILE_SIZE };
    }

    // Exit Reached
    if (tile === TileType.EXIT) {
      this.gameState = "LEVEL_COMPLETE";
      this.ctx.session.setStatus("ready");
      this.ctx.audio.playVictory();

      // Unlock next level
      if (this.currentLevelIdx + 1 < LEVELS.length) {
        this.unlockedLevels[this.currentLevelIdx + 1] = true;
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
    if (action === "MOVE_UP") this.climbUp = isPressed;
    if (action === "MOVE_DOWN") this.climbDown = isPressed;

    if ((action === "ACTION_PRIMARY" || action === "ROTATE") && isPressed) {
      if (this.gameState === "MENU") {
        this.gameState = "WORLD_SELECT";
        this.ctx.audio.playMove();
        return;
      }
      if (this.gameState === "WORLD_SELECT") {
        this.gameState = "LEVEL_SELECT";
        this.ctx.audio.playMove();
        return;
      }
      if (this.gameState === "LEVEL_SELECT") {
        this.gameState = "PLAYING";
        this.ctx.audio.playMove();
        return;
      }
      if (this.gameState === "PLAYING") {
        this.jumpPressed = true;
        return;
      }
      if (this.gameState === "LEVEL_COMPLETE") {
        if (this.currentLevelIdx + 1 < LEVELS.length) {
          this.loadLevel(this.currentLevelIdx + 1);
          this.gameState = "PLAYING";
        } else {
          this.gameState = "GAME_COMPLETE";
        }
        this.ctx.audio.playMove();
        return;
      }
    }

    if (action === "RESTART" && isPressed) {
      this.reset();
    }
  }

  public pause(): void { this.gameState = "PAUSED"; }
  public resume(): void { this.gameState = "PLAYING"; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.currentLevelIdx + 1; }

  public render(renderer: Renderer): void {
    const canvasW = renderer.getWidth();
    const canvasH = renderer.getHeight();

    const scaleX = canvasW / LOGICAL_WIDTH;
    const scaleY = canvasH / LOGICAL_HEIGHT;

    renderer.save();
    renderer.scale(scaleX, scaleY);

    const pr = renderer as PixelRenderer;
    const palette = WORLD_PALETTES[this.currentWorld] || WORLD_PALETTES[1];
    pr.clear(palette.bg);

    const w = LOGICAL_WIDTH;
    const h = LOGICAL_HEIGHT;

    if (this.gameState === "BOOT") {
      pr.drawRect(0, 0, w, h, "#04060c", true);
      pr.drawText("DIAMOND RUN", w / 2, h / 2 - 10, { size: 28, color: "#FFD84D", align: "center" });
      pr.drawText("2000s JAVA MOBILE CLASSICS ENGINE", w / 2, h / 2 + 20, { size: 11, color: "#4DE8E8", align: "center" });
      renderer.restore();
      return;
    }

    if (this.gameState === "MENU") {
      pr.drawRect(0, 0, w, h, "#081020", true);
      pr.drawText("DIAMOND RUN", w / 2, h / 2 - 40, { size: 36, color: "#FFD84D", align: "center" });
      pr.drawText("ANCIENT TEMPLE EXPLORATION PUZZLE", w / 2, h / 2, { size: 12, color: "#63E66D", align: "center" });
      pr.drawText("[ PRESS SPACE / Z TO START ]", w / 2, h / 2 + 50, { size: 14, color: "#4DE8E8", align: "center" });
      renderer.restore();
      return;
    }

    if (this.gameState === "WORLD_SELECT") {
      pr.drawRect(0, 0, w, h, "#0a1224", true);
      pr.drawText("SELECT WORLD", w / 2, 50, { size: 24, color: "#FFD84D", align: "center" });

      const worldNames = [
        "WORLD 1 — ANCIENT RUINS",
        "WORLD 2 — JUNGLE TEMPLE",
        "WORLD 3 — FROZEN CAVERNS",
        "WORLD 4 — VOLCANIC FORTRESS",
        "WORLD 5 — LOST SANCTUARY",
      ];

      worldNames.forEach((name, idx) => {
        const y = 120 + idx * 45;
        const active = idx + 1 === this.currentWorld;
        pr.drawRect(w / 2 - 160, y - 18, 320, 36, active ? "rgba(77, 232, 232, 0.2)" : "#101b30", true);
        pr.drawRect(w / 2 - 160, y - 18, 320, 36, active ? "#4DE8E8" : "#233860", false);
        pr.drawText(name, w / 2, y + 5, { size: 12, color: active ? "#FFFFFF" : "#94A3B8", align: "center" });
      });

      pr.drawText("[ PRESS Z TO SELECT WORLD ]", w / 2, h - 30, { size: 11, color: "#63E66D", align: "center" });
      renderer.restore();
      return;
    }

    if (this.gameState === "LEVEL_SELECT") {
      pr.drawRect(0, 0, w, h, "#0a1224", true);
      pr.drawText(`WORLD ${this.currentWorld} — LEVEL SELECT`, w / 2, 40, { size: 20, color: "#FFD84D", align: "center" });

      const startIdx = (this.currentWorld - 1) * 5;
      for (let i = 0; i < 5; i++) {
        const lvlIdx = startIdx + i;
        const lvlData = LEVELS[lvlIdx];
        const y = 110 + i * 45;
        const unlocked = this.unlockedLevels[lvlIdx];
        const active = lvlIdx === this.currentLevelIdx;

        pr.drawRect(w / 2 - 180, y - 18, 360, 36, active ? "rgba(255, 216, 77, 0.2)" : "#101b30", true);
        pr.drawRect(w / 2 - 180, y - 18, 360, 36, active ? "#FFD84D" : "#233860", false);
        pr.drawText(
          `${unlocked ? "✓" : "🔒"} LVL ${lvlIdx + 1}: ${lvlData ? lvlData.title : "Chamber"}`,
          w / 2,
          y + 5,
          { size: 12, color: unlocked ? "#FFFFFF" : "#64748B", align: "center" }
        );
      }

      pr.drawText("[ PRESS Z TO START LEVEL ]", w / 2, h - 30, { size: 11, color: "#4DE8E8", align: "center" });
      renderer.restore();
      return;
    }

    // --- RENDER GAMEPLAY WORLD ---
    const offsetX = Math.floor(-this.cameraX);
    const offsetY = Math.floor(-this.cameraY);

    // Draw Tile Map
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tile = this.grid[r][c];
        if (tile === TileType.EMPTY) continue;

        const tx = c * TILE_SIZE + offsetX;
        const ty = r * TILE_SIZE + offsetY;

        if (tx < -TILE_SIZE || tx > w || ty < -TILE_SIZE || ty > h) continue;

        if (tile === TileType.SOLID) {
          pr.drawPixelBlock(tx, ty, TILE_SIZE, palette.wall, "#FFFFFF", "rgba(0,0,0,0.5)");
        } else if (tile === TileType.ICE) {
          pr.drawPixelBlock(tx, ty, TILE_SIZE, "#48CAE4", "#E0F2FE", "#0077B6");
        } else if (tile === TileType.LAVA) {
          const glow = Math.floor(Date.now() / 150) % 2 === 0 ? "#FF8800" : "#D90429";
          pr.drawPixelBlock(tx, ty, TILE_SIZE, "#D90429", glow, "#780000");
        } else if (tile === TileType.WATER) {
          pr.drawRect(tx, ty, TILE_SIZE, TILE_SIZE, "rgba(0, 240, 255, 0.4)", true);
          pr.drawRect(tx, ty + (Math.floor(Date.now() / 200 + c) % 4), TILE_SIZE, 2, "rgba(255,255,255,0.6)", true);
        } else if (tile === TileType.MUD) {
          pr.drawRect(tx, ty, TILE_SIZE, TILE_SIZE, "#3A1c0c", true);
        } else if (tile === TileType.SPIKE) {
          pr.drawPixelBlock(tx, ty + 8, TILE_SIZE, "#94A3B8", "#FFFFFF", "#334155");
        } else if (tile === TileType.DIAMOND) {
          const pulse = 4.5 + Math.sin((Date.now() + c * 100) / 180) * 1.2;
          pr.drawCircle(tx + 8, ty + 8, Math.round(pulse + 2), "rgba(77, 232, 232, 0.3)", true);
          pr.drawCircle(tx + 8, ty + 8, Math.round(pulse), "#4DE8E8", true);
          pr.drawCircle(tx + 8, ty + 8, 2, "#FFFFFF", true);
        } else if (tile === TileType.GEM_RARE) {
          const pulse = 5.5 + Math.sin((Date.now() + c * 120) / 150) * 1.5;
          pr.drawCircle(tx + 8, ty + 8, Math.round(pulse), "#FFD84D", true);
          pr.drawCircle(tx + 8, ty + 8, 2, "#FFFFFF", true);
        } else if (tile === TileType.GEM_SECRET) {
          const pulse = 6.5 + Math.sin((Date.now() + c * 150) / 120) * 1.8;
          pr.drawCircle(tx + 8, ty + 8, Math.round(pulse), "#A879FF", true);
          pr.drawCircle(tx + 8, ty + 8, 3, "#FFFFFF", true);
        } else if (tile === TileType.KEY_BRONZE) {
          pr.drawRect(tx + 4, ty + 4, 8, 8, "#FFD84D", true);
        } else if (tile === TileType.KEY_BRONZE_GATE) {
          pr.drawPixelBlock(tx, ty, TILE_SIZE, "#B45309", "#FFD84D", "#78350F");
        } else if (tile === TileType.EXIT) {
          const pulseColor = Math.floor(Date.now() / 250) % 2 === 0 ? "#00FF66" : "#4DE8E8";
          pr.drawRect(tx, ty, TILE_SIZE, TILE_SIZE, "rgba(0,255,102,0.15)", true);
          pr.drawRect(tx + 2, ty + 2, 12, 14, pulseColor, false);
          pr.drawRect(tx + 4, ty + 4, 8, 10, pulseColor, true);
        } else if (tile === TileType.PUSHABLE) {
          pr.drawPixelBlock(tx, ty, TILE_SIZE, "#A16207", "#CA8A04", "#713F12");
        } else if (tile === TileType.PRESSURE_PLATE) {
          pr.drawRect(tx + 2, ty + 12, 12, 4, "#64748B", true);
        } else {
          pr.drawRect(tx, ty, TILE_SIZE, TILE_SIZE, palette.wall, true);
        }
      }
    }

    // Draw Detailed Explorer Sprite
    const px = Math.floor(this.player.x + offsetX);
    const py = Math.floor(this.player.y + offsetY);

    if (this.player.invulnerabilityTimer <= 0 || Math.floor(Date.now() / 100) % 2 === 0) {
      // Body & Explorer Shirt
      pr.drawPixelBlock(px, py, PLAYER_WIDTH, "#FFD84D", "#FFFFFF", "#B45309");
      // Explorer Fedora Hat
      pr.drawRect(px - 1, py - 3, PLAYER_WIDTH + 2, 3, "#8B5E34", true);
      pr.drawRect(px + 2, py - 6, PLAYER_WIDTH - 4, 3, "#A67C52", true);

      // Backpack
      const packX = px + (this.player.facing === "right" ? -3 : PLAYER_WIDTH);
      pr.drawRect(packX, py + 4, 3, 7, "#5C3D2E", true);

      // Directional eyes
      const eyeX = px + (this.player.facing === "right" ? 8 : 2);
      pr.drawRect(eyeX, py + 3, 2, 3, "#000000", true);
    }

    // Render Global Particle FX & Popups
    globalParticles.render(pr);

    // Top HUD Status Bar
    pr.drawRect(0, 0, w, 24, "rgba(4, 6, 12, 0.85)", true);
    pr.drawText(
      `💎 ${this.diamondsCollected}/${this.currentLevel.diamondsTotal}  •  SCORE: ${this.score}  •  LVL ${this.currentLevelIdx + 1}: ${this.currentLevel.title}`,
      w / 2,
      16,
      { size: 11, color: "#FFD84D", align: "center" }
    );

    // Level Complete Overlay
    if (this.gameState === "LEVEL_COMPLETE") {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(4,6,12,0.95)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, "#00FF66", false);
      pr.drawText("LEVEL COMPLETE!", w / 2, h / 2 - 20, { size: 24, color: "#00FF66", align: "center" });
      pr.drawText(`DIAMONDS: ${this.diamondsCollected}  •  SCORE: ${this.score}`, w / 2, h / 2 + 10, { size: 12, color: "#FFD84D", align: "center" });
      pr.drawText("[ PRESS Z FOR NEXT LEVEL ]", w / 2, h / 2 + 32, { size: 11, color: "#4DE8E8", align: "center" });
    }

    // Game Complete Overlay
    if (this.gameState === "GAME_COMPLETE") {
      pr.drawRect(0, h / 2 - 60, w, 120, "rgba(4,6,12,0.95)", true);
      pr.drawRect(0, h / 2 - 60, w, 120, "#FFD84D", false);
      pr.drawText("DIAMOND RUN COMPLETE!", w / 2, h / 2 - 25, { size: 26, color: "#FFD84D", align: "center" });
      pr.drawText("CONGRATULATIONS EXPLORER!", w / 2, h / 2 + 5, { size: 13, color: "#63E66D", align: "center" });
      pr.drawText(`FINAL SCORE: ${this.score}`, w / 2, h / 2 + 28, { size: 12, color: "#4DE8E8", align: "center" });
    }

    renderer.restore();
  }
}
