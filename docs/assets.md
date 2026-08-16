# Asset Standards & Pixel Art Guidelines

This document details the visual asset pipeline, pixel art dimensions, SVG component rendering, thumbnail specifications, and font imports used in **ARCADE_**.

---

## 1. Asset Philosophy: Zero External Binary Blobs

To ensure sub-second page loads and eliminate external CDN dependencies:
- **Audio:** 100% procedurally synthesized via Web Audio API (zero `.mp3` or `.wav` files).
- **Icons & Decorative Art:** Rendered as inline, pixel-snapped SVG vector components with `imageRendering: "pixelated"`.
- **Fonts:** Clean Google Fonts loaded via standard CSS `@import`.

---

## 2. Cartridge Thumbnail Standards

Cartridge thumbnail graphics are stored under `public/games/{slug}/thumb.png` or `public/assets/thumbnails/`:

- **Aspect Ratio:** $3:4$ or $4:5$ vertical cartridge orientation.
- **Recommended Canvas Size:** $480 \times 640$ or $600 \times 700$ px.
- **Art Style:** High-contrast 8-bit / 16-bit pixel art with bold saturated foreground palettes against dark backdrops.
- **File Format:** Optimized 8-bit PNG with transparent alpha backgrounds where applicable.

---

## 3. Inline Pixel Art SVG Components

For hero visual elements (e.g. `PixelRocket`, `PixelPlanet`, `PixelHelm`, `PixelCompass` in `components/arcade/ArcadeHero.tsx`), graphics are authored directly as pure SVG coordinate rectangles:

```tsx
export const PixelRocket = ({ size = 60, color = "#b0b8d0" }) => (
  <svg
    width={size}
    height={size * 1.6}
    viewBox="0 0 10 16"
    style={{ imageRendering: "pixelated" }}
  >
    {/* Fuselage */}
    <rect x="3" y="3" width="4" height="8" fill={color} />
    {/* Nose Cone */}
    <rect x="4" y="1" width="2" height="2" fill={color} />
    <rect x="4" y="0" width="2" height="1" fill="#ffffff" />
    {/* Cockpit Window */}
    <rect x="4" y="5" width="2" height="2" fill="#4de8e8" />
    {/* Thruster Flames */}
    <rect x="4" y="12" width="2" height="2" fill="#ffd84d" />
    <rect x="4" y="14" width="2" height="1" fill="#ff9f43" />
  </svg>
);
```

---

## 4. Typography Pipeline (`styles/tokens.css`)

ARCADE_ imports three complementary typography families:
1. **Pixel Font (`Press Start 2P`):** Used for arcade scores, retro HUD labels, and cartridge titles.
2. **Body / Interface Font (`Space Grotesk`):** Modern geometric sans-serif for descriptions, metadata, and high-readability documentation.
3. **Monospace Font (`JetBrains Mono`):** Used for mathematical equations, keybindings, and code snippets.
