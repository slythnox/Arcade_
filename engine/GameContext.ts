import type { GameSession } from "./GameSession";
import type { InputManager } from "./input/InputManager";
import type { Renderer } from "./rendering/Renderer";
import type { AudioManager } from "./audio/AudioManager";
import type { RandomSource } from "../core/math/random";

/**
 * Execution context passed to every GameInstance.
 * Provides access to input, renderer, audio synth, deterministic PRNG, and session lifecycle.
 */
export interface GameContext {
  session: GameSession;
  input: InputManager;
  renderer: Renderer;
  audio: AudioManager;
  random: RandomSource;
}
