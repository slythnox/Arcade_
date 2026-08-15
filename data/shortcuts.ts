export interface ShortcutItem {
  keys: string[];
  action: string;
  context: "global" | "gameplay";
}

export const KEYBOARD_SHORTCUTS: ShortcutItem[] = [
  { keys: ["/"], action: "Focus Game Search", context: "global" },
  { keys: ["ESC"], action: "Close Overlays / Exit to Menu", context: "global" },
  { keys: ["P"], action: "Pause / Resume Game", context: "gameplay" },
  { keys: ["R"], action: "Restart Current Game", context: "gameplay" },
  { keys: ["←", "→", "A", "D"], action: "Move Left / Right", context: "gameplay" },
  { keys: ["↑", "W", "Z"], action: "Rotate (Tetris) / Up (Snake/Pong)", context: "gameplay" },
  { keys: ["↓", "S"], action: "Soft Drop / Down", context: "gameplay" },
  { keys: ["SPACE", "X"], action: "Hard Drop (Tetris) / Launch Ball (Breakout) / Reveal (Mines)", context: "gameplay" },
  { keys: ["SHIFT", "C"], action: "Hold (Tetris) / Toggle AI Autopilot (Snake) / Flag (Mines)", context: "gameplay" },
];
