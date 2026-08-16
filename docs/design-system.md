# Design System & Token Specifications

This document outlines the visual design system, CSS variables, color tokens, typography scales, and responsive layout guidelines implemented across **ARCADE_** (`styles/tokens.css`, `styles/globals.css`).

---

## 1. Color Palette Tokens (`styles/tokens.css`)

The visual design system combines a deep navy space backdrop with vibrant, high-saturation 8-bit neon accents:

```css
:root {
  /* --- Deep Navy Space Backdrop --- */
  --color-bg: #060e1c;
  --color-bg-deep: #0a1628;
  --color-bg-surface: #0d1b3a;
  --color-surface: #111f3c;
  --color-surface-elevated: #172548;
  --color-surface-hover: #1e2f58;
  --color-surface-border: #1e3060;
  --color-surface-border-subtle: rgba(77, 163, 255, 0.15);

  /* --- Saturated Primary Arcade Accents --- */
  --arcade-yellow: #ffd84d;
  --arcade-yellow-glow: rgba(255, 216, 77, 0.35);

  --arcade-pink: #ff5c8a;
  --arcade-pink-bright: #ff759d;
  --arcade-pink-glow: rgba(255, 92, 138, 0.4);

  --arcade-blue: #4da3ff;
  --arcade-blue-glow: rgba(77, 163, 255, 0.35);

  --arcade-cyan: #4de8e8;
  --arcade-cyan-glow: rgba(77, 232, 232, 0.35);

  --arcade-orange: #ff9f43;
  --arcade-orange-glow: rgba(255, 159, 67, 0.35);

  --arcade-purple: #a879ff;
  --arcade-purple-glow: rgba(168, 121, 255, 0.35);

  --arcade-green: #63e66d;
  --arcade-green-glow: rgba(99, 230, 109, 0.35);

  --arcade-white: #ffffff;

  /* --- Text & Hierarchy --- */
  --color-text: #f3f6fc;
  --color-text-dim: #9bb0d4;
  --color-text-muted: #62769c;
}
```

---

## 2. Typography Scale

```css
:root {
  --font-pixel: 'Press Start 2P', monospace, cursive;
  --font-sans: 'Space Grotesk', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, Menlo, Monaco, Consolas, monospace;
}
```

- **Headings & Hero:** `Space Grotesk` (weights: 700, 800, 900) with tracking $-0.02\text{em}$.
- **Arcade Labels & HUD:** `Press Start 2P` with tracking $0.02\text{em}$ and font-size clamped between $9\text{px}$ and $12\text{px}$.
- **Code & Mathematics:** `JetBrains Mono` for equations and parameters.

---

## 3. Spacing Scale

- `--space-1`: $4\text{px}$
- `--space-2`: $8\text{px}$
- `--space-3`: $12\text{px}$
- `--space-4`: $16\text{px}$
- `--space-6`: $24\text{px}$
- `--space-8`: $32\text{px}$
- `--space-12`: $48\text{px}$
- `--space-16`: $64\text{px}$
- `--space-24`: $96\text{px}$

---

## 4. Retro Box Shadows & Borders

```css
:root {
  --border-width: 1px;
  --border-width-thick: 2px;
  --border-radius-sm: 4px;
  --border-radius-md: 8px;

  --shadow-pixel: 3px 3px 0px #04060a;
  --shadow-pixel-lg: 5px 5px 0px #04060a;
  --shadow-card: 0 8px 24px rgba(4, 6, 12, 0.6), 3px 3px 0px #000000;
}
```

---

## 5. Responsive Layout Breakpoints

- **Mobile ($< 768\text{px}$):** Single-column cartridge grid, on-screen radial touch D-pad active, 75/25 canvas-to-controls viewport ratio.
- **Tablet ($768\text{px} - 1024\text{px}$):** Two-column cartridge grid, compact hero banner.
- **Desktop ($> 1024\text{px}$):** Three-to-four column cartridge grid, maximum content width `1360px`, full keyboard and gamepad controls.
