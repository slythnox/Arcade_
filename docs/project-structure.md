# Project Structure & Directory Reference

This document provides a comprehensive inventory of all active directories and files in the **ARCADE_** repository.

---

## Complete Directory Tree

```text
c:\1337\arcade_\
├── app/                                 # Next.js 16 App Router
│   ├── about/page.tsx                   # Platform manifesto & architecture summary
│   ├── api/analytics/route.ts           # Optional anonymous analytics endpoint
│   ├── case-studies/                    # Engineering case studies
│   │   ├── deterministic-game-engine/   # 60Hz accumulator deep-dive
│   │   ├── fuzzy-search-ranking/        # Multi-attribute search deep-dive
│   │   ├── tetris-matrix-rotations/     # Super Rotation System (SRS) deep-dive
│   │   └── page.tsx                     # Case studies directory index
│   ├── faq/page.tsx                     # Technical FAQ
│   ├── games/[slug]/page.tsx            # Dynamic game stage route
│   ├── privacy/page.tsx                 # Privacy policy (acknowledges Vercel Analytics)
│   ├── terms/page.tsx                   # Terms of service (MIT License)
│   ├── globals.css                      # Global resets & custom scrollbars
│   ├── layout.tsx                       # Root layout & Vercel Analytics provider
│   ├── page.tsx                         # Homepage (Arcade Floor & Hero Search)
│   ├── robots.ts                        # robots.txt generator
│   └── sitemap.ts                       # Dynamic XML sitemap generator
│
├── components/                          # React UI Components
│   ├── arcade/                          # Arcade UI (Hero, Cards, Grid, Filters)
│   │   ├── ArcadeFilterBar.tsx          # Platform & Genre category pill filters
│   │   ├── ArcadeGrid.tsx               # Responsive cartridge card grid
│   │   ├── ArcadeHero.tsx               # Hero header with morse-code blinking prompt
│   │   ├── CartridgeCard.tsx            # Individual 3D retro cartridge card
│   │   └── WeeklyFeatured.tsx           # Deterministic featured cartridge banner
│   ├── environment/                     # Retro shaders & visual overlays
│   │   ├── CRTOverlay.tsx               # Scanlines, vignette, and barrel distortion
│   │   └── PixelWilderness.tsx          # Procedural starry background
│   ├── game/                            # In-game HUD & Runtime Mounts
│   │   ├── GameShell.tsx                # Master canvas wrapper & mobile D-pad HUD
│   │   ├── MobileControls.tsx           # Virtual touch buttons & D-pad
│   │   └── SteamLaunchOverlay.tsx       # Retro boot sequence overlay
│   ├── layout/                          # Site-wide layout headers & footers
│   │   ├── BreadcrumbTrail.tsx          # Navigational breadcrumbs
│   │   ├── SiteFooter.tsx               # Global footer with live engine status
│   │   └── SiteHeader.tsx               # Global top navigation bar
│   └── ui/                              # Atoms & micro-components
│
├── core/                                # Zero-Dependency Core Library
│   ├── algorithms/                      # Discrete algorithms
│   │   ├── aStar.ts                     # A* pathfinding with Manhattan heuristic
│   │   ├── bfs.ts                       # Breadth-first shortest path
│   │   ├── cellularAutomata.ts          # Conway Life, Cave smoothing, Fire spread
│   │   ├── floodFill.ts                 # Iterative queue flood fill
│   │   ├── levenshtein.ts               # Space-optimized edit distance
│   │   ├── minimax.ts                   # Minimax with alpha-beta pruning
│   │   ├── spatialHash.ts               # Spatial hash grid broad-phase collision
│   │   └── weightedSearch.ts            # Multi-attribute scoring equation
│   ├── constants/                       # Centralized constants
│   │   ├── game.ts                      # Virtual canvas dimensions (480x640)
│   │   ├── search.ts                    # Search scoring field weights
│   │   └── timing.ts                    # SIMULATION_HZ = 60, FIXED_DT = 1/60s
│   ├── math/                            # Mathematical primitives
│   │   ├── distance.ts                  # Manhattan, Euclidean, Chebyshev metrics
│   │   ├── easing.ts                    # Cubic, Bounce, Back easing curves
│   │   ├── geometry.ts                  # AABB, Circle-to-AABB contact normals
│   │   ├── interpolation.ts             # Lerp, invLerp, remap, smoothstep
│   │   ├── matrix.ts                    # Matrix2, rotateMatrixCW, rotateMatrixCCW
│   │   ├── noise.ts                     # Seeded 1D & 2D ValueNoise
│   │   ├── pool.ts                      # ObjectPool<T> GC recycler
│   │   ├── random.ts                    # Mulberry32 PRNG & seedFromDateString
│   │   └── vector.ts                    # Vector2, dot, cross, project, reflect
│   ├── types/                           # Shared TypeScript type definitions
│   │   ├── game.ts                      # GameAction, GameStatus, GameGenre
│   │   ├── geometry.ts                  # Point2D, Rectangle, Circle, GridCoord
│   │   ├── player.ts                    # PlayerStats, PlayerSettings
│   │   └── search.ts                    # SearchResult, SearchScoreBreakdown
│   └── utils/                           # General helper functions
│       └── index.ts                     # clamp, slugify, formatScore, debounce
│
├── data/                                # Static Metadata & Configuration
│   ├── caseStudies.ts                   # Case study content
│   ├── categories.ts                    # Platform & Genre category definitions
│   ├── faq.ts                           # Frequently asked questions & answers
│   └── shortcuts.ts                     # Keyboard shortcut definitions
│
├── docs/                                # Full Technical Documentation Suite
│   ├── adr/                             # Architecture Decision Records
│   ├── adding-games.md                  # Tutorial: Adding new cartridges
│   ├── adding-labs.md                   # Tutorial: Adding mathematical labs
│   ├── algorithms.md                    # Algorithmic complexity reference
│   ├── architecture.md                  # System architecture & layers
│   ├── audio.md                         # Procedural Web Audio synthesizer
│   ├── configuration.md                 # Configuration reference
│   ├── deployment.md                    # Deployment guide
│   ├── design-system.md                 # Visual design tokens & CRT styling
│   ├── determinism.md                   # Determinism, Mulberry32, replays
│   ├── engine.md                        # Engine runtime internals
│   ├── game-loading.md                  # Dynamic code splitting & chunks
│   ├── input.md                         # Input normalization & mobile touch
│   ├── limitations.md                   # Architectural limitations & boundaries
│   ├── mathematics.md                   # Mathematical formulas & derivations
│   ├── performance.md                   # Optimization & memory management
│   ├── project-structure.md             # This directory reference
│   ├── rendering.md                     # Canvas 2D & quantization pipeline
│   ├── search.md                        # Search engine ranking model
│   ├── seo.md                           # SEO, OpenGraph & JSON-LD
│   ├── storage.md                       # Local storage & persistence
│   └── testing.md                       # Vitest testing strategy
│
├── engine/                              # 2D Game Engine Runtime
│   ├── audio/                           # Web Audio sound engine
│   │   └── AudioManager.ts              # Synthesizer, oscillators, presets
│   ├── debug/                           # Debugging & profiling tools
│   │   └── profiler.ts                  # Lightweight frame time profiler
│   ├── input/                           # Input management
│   │   └── InputManager.ts              # Keyboard & touch action dispatcher
│   ├── particles/                       # Particle effects
│   │   └── ParticleSystem.ts            # Burst emitters & floating score text
│   ├── rendering/                       # 2D rendering backends
│   │   ├── CanvasRenderer.ts            # Standard HTML5 Canvas 2D wrapper
│   │   ├── PixelRenderer.ts             # Quantized pixel-grid renderer
│   │   └── Renderer.ts                  # Abstract renderer interface
│   ├── GameContext.ts                   # Dependency injection container
│   ├── GameEngine.ts                    # Master engine orchestrator
│   ├── GameLoop.ts                      # 60Hz fixed accumulator loop
│   └── GameSession.ts                   # State machine & scoring session
│
├── games/                               # Cartridge Implementations (61 games)
│   ├── definitions/                     # 61 cartridge definition metadata files
│   ├── {gameName}/                      # 61 game cartridge logic classes
│   ├── registry.ts                      # Central single-source-of-truth registry
│   └── types.ts                         # GameInstance & GameDefinition contracts
│
├── lib/                                 # Shared Services & Utilities
│   ├── analytics/                       # Event tracking dispatcher
│   ├── featured/                        # Deterministic daily/weekly game selectors
│   ├── search/                          # Multi-attribute fuzzy search engine
│   ├── seo/                             # Dynamic metadata & JSON-LD schemas
│   └── storage/                         # Versioned localStorage abstraction
│
├── styles/                              # Design System & Styling Tokens
│   ├── animations.css                   # Keyframe animations (glow, twinkle)
│   ├── globals.css                      # Global stylesheet
│   └── tokens.css                       # Retro arcade color tokens & typography
│
├── tests/                               # Vitest Automated Test Suite
│   ├── engine/                          # GameLoop & GameSession unit tests
│   ├── games/                           # Cartridge-specific logic unit tests
│   ├── helpers/                         # Mock GameContext & Mock Renderer
│   ├── search/                          # Search ranking unit tests
│   ├── smoke/                           # 62-cartridge smoke test suites
│   └── unit/                            # Vector, geometry, and algorithm tests
│
├── CONTRIBUTING.md                      # Open-source contribution guidelines
├── LICENSE                              # MIT License
├── package.json                         # Dependencies & npm scripts
├── README.md                            # Project overview & quickstart
├── SECURITY.md                          # Security policy & vulnerability reporting
├── tsconfig.json                        # Strict TypeScript 5.x configuration
└── vitest.config.ts                     # Vitest test runner configuration
```
