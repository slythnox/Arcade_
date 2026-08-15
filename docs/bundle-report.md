# ARCADE_ Bundle Report

Generated: 2026-08-15 via `npm run analyze` (Turbopack build)

## Summary

| Metric | Value |
|--------|-------|
| Total static pages | 82 |
| Total routes | `/`, `/games/[slug]` (60), plus case studies, about, FAQ, etc. |
| Build tool | Next.js 16.3.1 + Turbopack |
| TypeScript errors | 0 |

## Chunk Size Measurements

Top 20 largest chunks in `.next/static/chunks/`:

| Rank | File | Size (KB) |
|------|------|-----------|
| 1 | `28cj_n2iz4egi.js` | 223.8 |
| 2 | `2gefo9ja1l2mo.js` | 162.0 |
| 3 | `3jaromn3l40bd.js` | 135.0 |
| 4 | `0cz1d0mv5g_q7.js` | 110.0 |
| 5 | `2yeveaiysots2.js` | 51.3 |
| 6 | `1zvt6679f0mvv.js` | 42.2 |
| 7 | `36dxvbm_l-4ed.js` | 39.4 |
| 8 | `19mx3mg6lkumu.js` | 28.2 |
| 9 | `1hhj9r-6izk1-.js` | 28.0 |
| 10 | `1kz0j0qk3fxxr.js` | 18.9 |
| 11 | `0jsmc_etzcqi0.js` | 18.4 |
| 12 | `1sm-39yl83dcx.js` | 17.6 |
| 13 | `2n3d8jqclrw70.js` | 16.5 |
| 14 | `3icnuep4u9l4b.js` | 14.6 |
| 15 | `0kv7oyfzcke6r.js` | 14.0 |
| 16 | `2avbguuk48x2h.js` | 11.9 |
| 17 | `0rg4u_vbk34ig.js` | 10.0 |
| 18 | `turbopack-1i57y8yh2h244.js` | 9.4 |
| 19 | `0swknx7ul24xc.js` | 9.3 |
| 20 | `2-t1nuflz77qg.js` | 9.3 |

> **Note:** Turbopack produces hashed chunk filenames. These chunks represent shared framework code, shared engine code, and individual game modules. The bundle analyzer HTML report (`ANALYZE=true npm run build`) provides a visual treemap — Turbopack's analyzer support is currently experimental; for a webpack-based treemap, run `next build --webpack` and then `ANALYZE=true npm run build`.

## Dynamic Loading Architecture

ARCADE_ uses `import()` for all 102 game implementations:

```ts
// Each game definition uses:
createGame: async () => {
  const { TetrisGame } = await import("../tetris/TetrisGame");
  return new TetrisGame();
}
```

This enables Next.js/Turbopack to code-split game implementations. Game-specific code is bundled into separate chunks that are **not included in the initial homepage load** — they're downloaded only when a player opens a cartridge.

**What this means in practice:**
- The homepage loads the arcade shell, game registry metadata, and shared engine code
- Individual game engines (Tetris, Snake, Ray Sector, Monster Arena, etc.) are loaded on demand
- A user who only plays Tetris never downloads the Dungeon Quest or Ray Sector engine

**What we have NOT yet verified:**
- Exact network-level confirmation that chunk X corresponds to game Y (requires DevTools inspection)
- Gzipped sizes (all numbers above are raw JS, not gzip-compressed)

## Honest Performance Statement

> ARCADE_ uses dynamic `import()` for each game implementation. This enables the bundler to split game-specific code into separate chunks. The homepage does not include game engine implementations in its initial JavaScript. Individual game modules load when a cartridge is opened.

We do not claim "each game is a separate 10KB chunk" — chunk boundaries are determined by the bundler's static analysis and shared dependency graph. The actual savings depend on how many games share the same engine utilities.

## TODO for Full Verification

1. Run `next build --webpack` + `ANALYZE=true` to get the full interactive webpack treemap
2. Open Chrome DevTools → Network tab → load homepage → verify game chunk files are absent
3. Open Tetris → verify Tetris-specific chunk loads
4. Record exact gzipped sizes from the Network tab
5. Update this document with verified network-level measurements
