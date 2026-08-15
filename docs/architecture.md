# Architecture

This document describes the foundational architecture of the ARCADE_ custom engine.

## System Overview

```text
[ Browser Event Loop ]
          |
    (requestAnimationFrame)
          |
          v
+-------------------+      +-------------------+      +-------------------+
|   InputManager    | ---> |    GameSession    | ---> |   PixelRenderer   |
| (Key/Pad/Touch)   |      |  (State machine)  |      |  (Canvas 2D ctx)  |
+-------------------+      +-------------------+      +-------------------+
                                     |
                                     v
                           +-------------------+
                           |   GameInstance    |
                           |   (Actual Game)   |
                           +-------------------+
                                     ^
                                     |
                           +-------------------+
                           |    GameContext    |
                           |  (Dependencies)   |
                           +-------------------+
```

## Component Responsibilities

- **GameEngine**: The global orchestrator. Manages initialization of sub-systems (Renderer, Audio, Input).
- **GameLoop**: The high-precision deterministic loop handler. Implements the accumulator pattern for the fixed-timestep logic.
- **InputManager**: Listens to browser events and gamepads, normalizing diverse inputs into uniform `GameAction` identifiers.
- **AudioManager**: Interacts with the native Web Audio API to synthesize sounds in real-time.
- **PixelRenderer**: Wraps HTML5 Canvas 2D methods, optimizing for pixel-perfect drawing and batching.
- **GameSession**: Manages the lifecycle of a single gameplay round, tracking score, pause states, and game over conditions.
- **GameContext**: A dependency injection container passed to the game.

## Data Flow

1. **Input Phase:** `InputManager` processes DOM events and sets internal button state arrays.
2. **Simulation Phase:** `GameLoop` triggers `update(dt)`. The `GameInstance` polls `GameContext` for inputs, updates physics, tests collisions, and modifies entities.
3. **Render Phase:** `GameLoop` triggers `render(renderer)`. The `GameInstance` calls rendering methods (`drawRect`, `drawText`) which map to underlying Canvas calls.

## The GameInstance Contract

Every game fully implements the following deterministic interface (`games/types.ts`):

```typescript
export interface GameInstance {
  init(ctx: GameContext): void;
  update(deltaTime: number): void;
  render(renderer: Renderer): void;
  handleInput(action: GameAction, isPressed: boolean): void;
  pause(): void;
  resume(): void;
  reset(seed?: number): void;
  destroy(): void;
  getScore(): number;
  getLevel(): number;
  getLines?(): number;
  getLives?(): number;
}
```

## Registry Pattern

ARCADE_ uses a static registry (`games/registry.ts`). Games are not dynamically imported from the filesystem at runtime. Instead, every `GameDefinition` is statically analyzed and bundled. This guarantees compile-time type safety, strong tree-shaking, and co-located metadata (SEO, math definitions) without slow runtime IO.

## Why Engine State is Outside React

React is exceptional for UI, but horrible for 60FPS byte-level state updates. The game engine lives entirely outside the React lifecycle. The only bridge is a custom React hook that extracts the active `GameEngine` ref and mounts the Canvas. This guarantees zero virtual DOM overhead during gameplay.
