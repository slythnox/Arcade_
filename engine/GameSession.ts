import type { GameStatus } from "../core/types/game";

export interface ReplayFrame {
  tick: number;
  action: string;
  isPressed: boolean;
}

export type SessionStateListener = (session: GameSession) => void;

/**
 * Manages the lifecycle state, seed, scoring, and playback recording for a single game session.
 */
export class GameSession {
  public readonly gameId: string;
  public seed: number;
  public status: GameStatus = "idle";
  public score: number = 0;
  public level: number = 1;
  public lines: number = 0;
  public lives: number = 3;
  public elapsedTime: number = 0; // in seconds
  public tickCount: number = 0;
  public frameCount: number = 0;
  public replayInputs: ReplayFrame[] = [];

  private listeners: Set<SessionStateListener> = new Set();

  constructor(gameId: string, seed: number = 1337) {
    this.gameId = gameId;
    this.seed = seed;
  }

  public subscribe(listener: SessionStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this);
    }
  }

  public setStatus(newStatus: GameStatus): void {
    if (this.status === newStatus) return;
    this.status = newStatus;
    this.notify();
  }

  public setScore(score: number): void {
    if (this.score !== score) {
      this.score = score;
      this.notify();
    }
  }

  public addScore(delta: number): void {
    this.setScore(this.score + delta);
  }

  public setLevel(level: number): void {
    if (this.level !== level) {
      this.level = level;
      this.notify();
    }
  }

  public setLines(lines: number): void {
    if (this.lines !== lines) {
      this.lines = lines;
      this.notify();
    }
  }

  public setLives(lives: number): void {
    if (this.lives !== lives) {
      this.lives = lives;
      this.notify();
    }
  }

  public recordInput(action: string, isPressed: boolean): void {
    this.replayInputs.push({
      tick: this.tickCount,
      action,
      isPressed,
    });
  }

  public reset(newSeed?: number): void {
    this.seed = newSeed !== undefined ? newSeed : this.seed;
    this.status = "ready";
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.lives = 3;
    this.elapsedTime = 0;
    this.tickCount = 0;
    this.frameCount = 0;
    this.replayInputs = [];
    this.notify();
  }
}
