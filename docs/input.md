# Input Normalization & Mobile Controls Architecture

This document details the unified input architecture, keybindings, touch HUD design, radial directional dial, and session input logging in **ARCADE_** (`engine/input/` and `components/game/`).

---

## 1. Unified Input Model

ARCADE_ abstracts hardware-specific events (keyboard scancodes, pointer coordinates, touch contacts, gamepad buttons) into discrete `GameAction` identifiers:

```text
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│ Keyboard Event │     │ Touch Gestures │     │ Gamepad API    │
└───────┬────────┘     └───────┬────────┘     └───────┬────────┘
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────────────────────────────────────────────────────┐
│ InputManager (Maps hardware inputs to GameAction)            │
└──────────────────────────────┬───────────────────────────────┘
                               │ triggers
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ GameInstance.handleInput(action: GameAction, isPressed: bool)│
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Standardized `GameAction` Enum (`core/types/game.ts`)

```typescript
export type GameAction =
  | "MOVE_LEFT"        // Directional Left
  | "MOVE_RIGHT"       // Directional Right
  | "MOVE_UP"          // Directional Up
  | "MOVE_DOWN"        // Directional Down
  | "ROTATE"           // Rotate clockwise (Tetris, Puzzle)
  | "ACTION_PRIMARY"   // Main action (Jump, Shoot, Hard Drop, Select)
  | "ACTION_SECONDARY" // Sub action (Hold Piece, Flag Mine, Special)
  | "PAUSE"            // Pause / Resume toggle
  | "RESTART"          // Quick reset / retry
  | "CONFIRM"          // Menu submit
  | "BACK";            // Menu back / cancel
```

---

## 3. Keyboard Mapping Matrix

| `GameAction` | Primary Key | Secondary Key | Alternative |
|---|---|---|---|
| `MOVE_LEFT` | `ArrowLeft` | `KeyA` | — |
| `MOVE_RIGHT` | `ArrowRight` | `KeyD` | — |
| `MOVE_UP` | `ArrowUp` | `KeyW` | — |
| `MOVE_DOWN` | `ArrowDown` | `KeyS` | — |
| `ROTATE` | `KeyZ` | `ArrowUp` | `KeyW` |
| `ACTION_PRIMARY` | `Space` | `KeyX` | `Enter` |
| `ACTION_SECONDARY` | `KeyC` | `ShiftLeft` | `ShiftRight` |
| `PAUSE` | `KeyP` | `Escape` | — |
| `RESTART` | `KeyR` | — | — |

### Scroll Prevention
To ensure a smooth arcade experience, `InputManager` automatically intercepts and suppresses browser window scrolling on game keys:
```typescript
if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code) && e.target === document.body) {
  e.preventDefault();
}
```

---

## 4. Mobile & Touch Screen Controls (`components/game/GameShell.tsx`)

On touch-enabled mobile devices and tablets, `GameShell` dynamically renders an on-screen arcade control interface with a 75/25 screen ratio:

### 1. Radial Navigation Dial
A 4-way radial navigation dial with cardinal direction chevrons and vector line indicators:
- **Pointer Capture:** Uses Pointer Events (`pointerdown`, `pointermove`, `pointerup`) with `setPointerCapture()` to track continuous drags even if the player's thumb leaves the dial boundary.
- **Angle Calculation:** Converts pointer displacement $(dx, dy)$ into radial angle $\theta = \operatorname{atan2}(dy, dx)$:
  - $-45^\circ \le \theta \le 45^\circ \implies \text{MOVE\_RIGHT}$
  - $45^\circ < \theta < 135^\circ \implies \text{MOVE\_DOWN}$
  - $-135^\circ < \theta < -45^\circ \implies \text{MOVE\_UP}$
  - $|\theta| \ge 135^\circ \implies \text{MOVE\_LEFT}$
- **Visual Feedback:** A glowing vector line points to the active heading with subtle haptic-style visual response.

### 2. Dual Action Cluster
On the right side of the screen, players have access to prominent action buttons:
- **A Button (Primary):** Triggers `ACTION_PRIMARY` (Fire / Jump / Hard Drop).
- **B Button (Secondary):** Triggers `ACTION_SECONDARY` (Hold / Special).
- **ROT Button (Rotation):** Triggers `ROTATE`.

---

## 5. Input Logging & Replay Recording (`engine/GameSession.ts`)

Every user input is logged with the exact simulation tick count:

```typescript
public recordInput(action: string, isPressed: boolean): void {
  this.replayInputs.push({
    tick: this.tickCount,
    action,
    isPressed,
  });
}
```

Because the simulation loop advances in discrete, deterministic 60Hz ticks, replaying this input stream against the initial PRNG seed will reproduce the entire game frame-for-frame.
