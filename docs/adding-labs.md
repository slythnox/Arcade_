# Adding Mathematical Experiments (Labs)

This guide explains how to construct and register interactive mathematical simulations, algorithmic benchmarks, and procedural sandboxes under the **Labs** category.

---

## 1. What Distinguishes a "Lab" from an "Arcade Game"?

- **Arcade Games:** Focus on player reflex, score loops, difficulty ramping, and win/loss states.
- **Labs:** Focus on interactive visualization of mathematical systems, algorithmic execution steps, emergent complexity, or physics sandboxes (e.g. *Cell Colony*, *Fire Spread*, *Pool Simulator*, *Liquid Cells*, *Time Loop*).

---

## 2. Implementation Checklist

1. **Implement `GameInstance`:** Create your class under `games/{labName}/{PascalCaseLabName}Game.ts`.
2. **Category Configuration:** In your definition, set `category: "labs"` and choose an appropriate subcategory:
   - `fractals`
   - `physics-sim`
   - `algorithms`
   - `cellular-automata`
   - `ai`
   - `procedural`
   - `experimental`
3. **Document the Mathematical Model:** Provide formal LaTeX equations in the `math` section of the definition so users can learn the underlying mathematics while observing the simulation.
4. **Register in `games/registry.ts`:** Append your lab to `gameRegistry`.
5. **Add Automated Tests:** Create a test file in `tests/games/{labName}.test.ts`.

---

## 3. Example: Cellular Automaton Lab Definition

```typescript
import type { GameDefinition } from "../types";

export const myLabDefinition: GameDefinition = {
  id: "my-math-lab",
  slug: "my-math-lab",
  name: "My Math Lab",
  platform: "arcade",
  genre: "experimental",
  era: "2000s",
  year: 2026,
  tags: ["math", "simulation", "cellular-automata"],
  tagline: "Interactive discrete dynamical systems sandbox.",
  description: "Visual simulation of 2D non-linear state transitions.",
  difficulty: "easy",
  players: "single",
  category: "labs",
  subcategory: "cellular-automata",
  estimatedPlayTime: "5-15 min",
  thumbnail: {
    src: "/games/myMathLab/thumb.png",
    alt: "My Math Lab",
  },
  controls: {
    keyboard: [
      { key: "SPACE", description: "Step Simulation" },
      { key: "R", description: "Randomize Matrix" },
    ],
    touch: "Tap to toggle cell states",
  },
  seo: {
    title: "My Math Lab — Interactive Simulation",
    description: "Explore discrete mathematics and emergent complexity in browser.",
  },
  math: {
    title: "State Transition Function",
    summary: "Evaluates neighborhood density constraints.",
    concepts: [
      {
        name: "Transition Rule",
        description: "Applies non-linear update function across Moore neighborhood.",
        formula: "S_{t+1} = f(S_t, N)",
      },
    ],
  },
  createGame: async () => {
    const { MyMathLabGame } = await import("../myMathLab/MyMathLabGame");
    return new MyMathLabGame();
  },
};
```
