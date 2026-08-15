import { GameSession } from "./GameSession";
import { InputManager } from "./input/InputManager";
import { Renderer } from "./rendering/Renderer";
import { AudioManager } from "./audio/AudioManager";
import { RandomSource } from "../core/math/random";

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
