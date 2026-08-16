# Changelog

All notable changes to the **ARCADE_** platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.2] - 2026-08-16 — Public Beta Release

### Added
- **HOTLAP (`hotlap`):** High-precision Formula time-trial racer with 2D vector tire kinematics ($v_{\text{long}}, v_{\text{lat}}$), 10 distinct circuits, Catmull-Rom spline arc-length projection, 20Hz ghost replays, live $\pm\Delta$ timing HUD, crash barrier mechanics, and 8-way mobile touch controls.
- **61 verified Game Cartridges:** Complete library spanning Classics, Action, Racing, Platformers, Physics, Shooters, Strategy, and Experimental Labs.
- **Custom Deterministic 2D Engine:**
  - `GameLoop`: 60Hz fixed accumulator with delta clamping to prevent lag spirals.
  - `PixelRenderer`: Quantized integer grid rendering with retro bevel lighting.
  - `AudioManager`: Web Audio API synthesizer with zero external audio assets.
  - `InputManager`: Unified normalization for Keyboard, Pointer, Gamepad, and Virtual Touch D-pad.
- **Mathematical & Algorithmic Core:**
  - `Vector2`, `AABB`, `Matrix2`, `RandomSource` (Mulberry32 PRNG), `ValueNoise`, `ObjectPool`.
  - A\* Pathfinding, BFS Shortest Path, Iterative Flood Fill, Minimax ($\alpha$-$\beta$ pruning), Spatial Hashing, and Cellular Automata.
- **Mobile Controls:**
  - 8-Way & 4-Way radial directional touch navigation dial with directional vector chevrons and pointer capture.
  - Dual action button cluster (A, B, ROT) with 75/25 responsive screen ratio.
- **Client-Side Fuzzy Search:** Multi-attribute weighted ranking engine with normalized Levenshtein similarity across 61 cartridges.
- **Automated Test Suite:** Vitest test suite with 227 passing tests (61 cartridge smoke tests, input fuzzing, physics safety, and math unit tests).
- **SEO & Schema.org Markup:** Dynamic OpenGraph metadata, `SoftwareApplication` JSON-LD schemas, breadcrumbs, and automated XML sitemap.
- **Comprehensive Documentation Suite:** Complete technical architecture docs, engine internals, mathematical derivations, design system, and contribution guides.

### Changed
- Truth audit: Corrected all hardcoded game count references across UI, documentation, and SEO from 60 to the accurate count of 61.
- Updated Privacy Policy to transparently disclose Vercel Analytics usage for anonymous aggregate page views.
- Fixed contact form error state handling to display inline alerts rather than silent redirects.
- Removed dead placeholder repository links (`href="#"`) and wired them to the public repository.
- Reorganized documentation structure: consolidated all technical docs into `docs/`.

### Removed
- Deprecated `/contact` form and API endpoints in favor of direct GitHub repository issue tracking.
- Removed unused and redundant root files.
