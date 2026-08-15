# Adding a New Game

Follow these steps to integrate a new game into the ARCADE_ engine.

## 1. Create the Game Folder
Create a new directory for your game logic inside `games/`:
```bash
mkdir C:\1337\arcade_\games\myNewGame
```

## 2. Implement the `GameInstance` Interface
Create `games/myNewGame/MyNewGame.ts` and implement the deterministic game contract (`games/types.ts`):

```typescript
import { GameInstance, GameContext, GameAction, Renderer } from "../../engine/types";

export class MyNewGame implements GameInstance {
  init(ctx: GameContext): void {
    // Initialize state, seed randoms, inject audio
  }

  update(deltaTime: number): void {
    // Fixed timestep physics and logic
  }

  render(renderer: Renderer): void {
    // Draw to the canvas using integer coordinates
  }

  handleInput(action: GameAction, isPressed: boolean): void {
    // Respond to normalized input states
  }

  pause(): void {}
  resume(): void {}
  reset(seed?: number): void {}
  destroy(): void {}
  
  getScore(): number { return 0; }
  getLevel(): number { return 1; }
}
```

## 3. Create the `GameDefinition`
Create the metadata file at `games/definitions/myNewGame.ts`. This contains SEO, control schemes, math breakdowns, and the factory.

```typescript
import { GameDefinition } from "../types";
import { MyNewGame } from "../myNewGame/MyNewGame";

export const myNewGameDefinition: GameDefinition = {
  id: "my-new-game",
  slug: "my-new-game",
  name: "My New Game",
  platform: "arcade",
  genre: "arcade",
  era: "1980s",
  year: 1982,
  tags: ["retro", "action"],
  tagline: "A brand new retro experience.",
  description: "Detailed description of the gameplay mechanics.",
  difficulty: "medium",
  players: "1 player",
  estimatedPlayTime: "2-5 min",
  thumbnail: { src: "/games/mynewgame/thumb.png", alt: "Thumbnail" },
  controls: {
    keyboard: [{ key: "SPACE", description: "Jump" }],
    touch: "Tap screen to jump",
    gamepad: "A Button to jump"
  },
  seo: {
    title: "Play My New Game Online",
    description: "Experience the thrill of My New Game directly in your browser.",
    keywords: ["my new game", "arcade"]
  },
  math: {
    title: "Math of My New Game",
    summary: "Simple jump parabolas.",
    concepts: [{ name: "Gravity", description: "v = v_0 + g*t" }]
  },
  createGame: () => new MyNewGame(),
};
```

## 4. Register the Game
Open `games/registry.ts` and append your definition to the master list:

```typescript
import { myNewGameDefinition } from "./definitions/myNewGame";

export const GAMES_REGISTRY: Record<string, GameDefinition> = {
  // ... existing games
  [myNewGameDefinition.id]: myNewGameDefinition,
};
```

## 5. Typecheck
Verify strict typing compliance across the engine:
```bash
npm run typecheck
```

## 6. Write Tests
Create a test file in `tests/games/myNewGame.test.ts` to validate deterministic logic using Vitest. Ensure logic can run headlessly without a browser DOM.
