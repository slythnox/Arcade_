import { GameSession } from "./GameSession";
import { GameLoop } from "./GameLoop";
import { InputManager } from "./input/InputManager";
import { PixelRenderer } from "./rendering/PixelRenderer";
import type { AudioManager} from "./audio/AudioManager";
import { getAudioManager } from "./audio/AudioManager";
import { RandomSource } from "../core/math/random";
import type { GameInstance } from "../games/types";
import type { GameAction } from "../core/types/game";
import type { GameContext } from "./GameContext";

export interface GameEngineOptions {
  canvas: HTMLCanvasElement;
  gameId: string;
  seed?: number;
  pixelSize?: number;
  onFPS?: (fps: number) => void;
}

/**
 * Master Game Engine.
 * Hosts the canvas, initializes input/render/audio/PRNG, runs the deterministic loop,
 * and orchestrates the loaded GameInstance.
 */
export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx2D: CanvasRenderingContext2D;
  private renderer: PixelRenderer;
  private input: InputManager;
  private audio: AudioManager;
  private random: RandomSource;
  private session: GameSession;
  private loop: GameLoop;
  private game: GameInstance | null = null;
  private unsubscribeInput: (() => void) | null = null;

  constructor(options: GameEngineOptions) {
    this.canvas = options.canvas;
    const ctx = this.canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      throw new Error("GameEngine: Failed to get 2D canvas context");
    }
    this.ctx2D = ctx;

    const width = this.canvas.width;
    const height = this.canvas.height;
    this.renderer = new PixelRenderer(this.ctx2D, width, height, options.pixelSize || 2);

    this.input = new InputManager();
    this.audio = getAudioManager();
    this.random = new RandomSource(options.seed || 1337);
    this.session = new GameSession(options.gameId, options.seed || 1337);

    this.loop = new GameLoop(
      (dt) => this.update(dt),
      () => this.render(),
      options.onFPS
    );
  }

  public getSession(): GameSession {
    return this.session;
  }

  public getInput(): InputManager {
    return this.input;
  }

  public getAudio(): AudioManager {
    return this.audio;
  }

  public getRenderer(): PixelRenderer {
    return this.renderer;
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.renderer.setDimensions(width, height);
  }

  public loadGame(game: GameInstance): void {
    if (this.game) {
      this.game.destroy();
    }

    this.game = game;
    this.input.attach();

    const context: GameContext = {
      session: this.session,
      input: this.input,
      renderer: this.renderer,
      audio: this.audio,
      random: this.random,
    };

    this.game.init(context);
    this.session.setStatus("running");

    // Listen to inputs
    if (this.unsubscribeInput) {
      this.unsubscribeInput();
    }

    this.unsubscribeInput = this.input.addListener((action: GameAction, isPressed: boolean) => {
      if (this.game) {
        if (action === "PAUSE" && isPressed) {
          this.togglePause();
        } else if (action === "RESTART" && isPressed) {
          this.restart();
        } else {
          this.session.recordInput(action, isPressed);
          this.game.handleInput(action, isPressed);
        }
      }
    });
  }

  public start(): void {
    if (this.game) {
      this.session.setStatus("running");
    } else {
      this.session.setStatus("ready");
    }
    this.loop.start();
  }

  public pause(): void {
    if (this.session.status === "running") {
      this.session.setStatus("paused");
      this.loop.pause();
      if (this.game) {
        this.game.pause();
      }
    }
  }

  public resume(): void {
    if (this.session.status === "paused") {
      this.session.setStatus("running");
      this.loop.resume();
      if (this.game) {
        this.game.resume();
      }
    }
  }

  public togglePause(): void {
    if (this.session.status === "running") {
      this.pause();
    } else if (this.session.status === "paused") {
      this.resume();
    }
  }

  public restart(newSeed?: number): void {
    const seed = newSeed !== undefined ? newSeed : this.session.seed;
    this.random.reset(seed);
    this.session.reset(seed);
    if (this.game) {
      this.game.reset(seed);
    }
    this.session.setStatus("running");
    this.loop.resume();
  }

  private update(dt: number): void {
    if (this.session.status !== "running" || !this.game) return;

    this.session.tickCount++;
    this.session.elapsedTime += dt;

    this.game.update(dt);

    // Sync session metrics
    this.session.setScore(this.game.getScore());
    this.session.setLevel(this.game.getLevel());
    if (this.game.getLines) {
      this.session.setLines(this.game.getLines());
    }
    if (this.game.getLives) {
      this.session.setLives(this.game.getLives());
    }
  }

  private render(): void {
    this.session.frameCount++;
    if (this.game) {
      this.game.render(this.renderer);
    } else {
      this.renderer.clear("#050705");
      this.renderer.drawText("NO CARTRIDGE LOADED", this.renderer.getWidth() / 2, this.renderer.getHeight() / 2, {
        align: "center",
        color: "#4ADE80",
      });
    }
  }

  public destroy(): void {
    this.loop.stop();
    if (this.unsubscribeInput) {
      this.unsubscribeInput();
      this.unsubscribeInput = null;
    }
    this.input.detach();
    if (this.game) {
      this.game.destroy();
      this.game = null;
    }
    this.session.setStatus("destroyed");
  }
}
