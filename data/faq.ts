export type FAQCategory = "general" | "technical" | "controls" | "engine" | "audio" | "performance";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
}

export const faqs: FAQItem[] = [
  {
    id: "what-is-arcade",
    question: "What exactly is ARCADE_?",
    answer: "ARCADE_ is a modern, browser-based retro gaming platform featuring 60 mathematically pure cartridge games. It is built completely from scratch using web standards, relying on zero ROMs or third-party emulators, and operates directly in your browser with zero dependencies.",
    category: "general"
  },
  {
    id: "is-it-free",
    question: "Is ARCADE_ free to play?",
    answer: "Yes, the platform is 100% free and open-source. We believe in providing accessible retro experiences without paywalls, ads, or microtransactions, honoring the pure spirit of classic arcade gaming.",
    category: "general"
  },
  {
    id: "no-roms",
    question: "How do you run games without ROMs?",
    answer: "Every game is meticulously reverse-engineered and rebuilt from mathematical first principles using TypeScript. We do not use binary ROM dumps or emulation; instead, we recreate the deterministic logic and physics native to the web platform.",
    category: "general"
  },
  {
    id: "60hz-timestep",
    question: "How does the fixed timestep loop work?",
    answer: "The engine runs a rigid 60Hz fixed timestep accumulator loop. By decoupling simulation steps from rendering frames, we guarantee deterministic physics and identical game behavior across any device, regardless of screen refresh rate.",
    category: "engine"
  },
  {
    id: "prng-mulberry",
    question: "How is randomness handled?",
    answer: "We use Mulberry32, a fast, 32-bit seeded pseudo-random number generator. This guarantees reproducible sequences of random events within games like Tetris or procedural generation, critical for replays and deterministic mechanics.",
    category: "engine"
  },
  {
    id: "memory-pooling",
    question: "Does the engine use memory pooling?",
    answer: "Yes, to prevent garbage collection stutter during high-action sequences (like bullet hells), the engine pre-allocates object pools for entities such as bullets and particles. Dead entities are recycled instead of being destroyed.",
    category: "engine"
  },
  {
    id: "delta-clamping",
    question: "What is delta clamping?",
    answer: "If a browser tab is backgrounded, requestAnimationFrame pauses, causing massive delta time spikes upon return. The engine clamps maximum frame delta to prevent a \"spiral of death\" where the physics engine tries to simulate thousands of missed frames at once.",
    category: "engine"
  },
  {
    id: "game-count",
    question: "How many games are available?",
    answer: "There are precisely 60 unique games built into the platform, meticulously categorized into 7 distinct tiers ranging from Core Classics like Tetris and Snake, up to complex Strategy and Experimental concepts.",
    category: "general"
  },
  {
    id: "cartridge-architecture",
    question: "What is the game cartridge architecture?",
    answer: "Every game implements a strict GameInstance interface, isolating its state, input handling, simulation step, and rendering pipeline. The core platform merely mounts the cartridge, feeds it inputs, and requests renders, ensuring complete decoupling.",
    category: "technical"
  },
  {
    id: "tier-system",
    question: "How does the tier system work?",
    answer: "Games are classified by mechanical complexity. Tier 1 involves basic grid mathematics (Snake), Tier 3 adds vector physics (Breakout), Tier 4 introduces object pooling (Shooters), up to Tier 7 which challenges engine limitations with experimental concepts.",
    category: "general"
  },
  {
    id: "web-audio",
    question: "How is audio generated without files?",
    answer: "We use the native Web Audio API to synthesize all sound effects and music procedurally in real-time. By configuring oscillators, noise nodes, and custom gain envelopes, we produce rich retro soundscapes without a single MP3 or WAV file.",
    category: "audio"
  },
  {
    id: "envelope-adsr",
    question: "What is an ADSR envelope?",
    answer: "ADSR stands for Attack, Decay, Sustain, Release. Our audio engine modulates the gain (volume) and frequency of oscillators over time using these phases to shape raw tones into recognizable sounds like laser blasts, jumps, and explosions.",
    category: "audio"
  },
  {
    id: "oscillator-types",
    question: "What waveforms power the sound effects?",
    answer: "We primarily utilize square and sawtooth waveforms for that classic 8-bit crunch, alongside triangle waves for deep bass or melodic leads, and white noise buffers specifically sculpted for percussive hits and explosion effects.",
    category: "audio"
  },
  {
    id: "canvas-vs-webgl",
    question: "Why Canvas 2D instead of WebGL?",
    answer: "We chose the standard HTML5 Canvas 2D context for maximum compatibility and simplicity. Given our retro aesthetic and optimized rendering paths (batching, minimal state changes), Canvas 2D easily maintains a locked 60fps without the overhead of WebGL shaders.",
    category: "performance"
  },
  {
    id: "60fps-guarantee",
    question: "How do you guarantee 60 frames per second?",
    answer: "By keeping the rendering layer extremely thin and optimizing the simulation loop. We avoid complex DOM manipulations during gameplay, minimize garbage collection through object pooling, and restrict rendering to dirtied regions when possible.",
    category: "performance"
  },
  {
    id: "controls-supported",
    question: "What input methods are supported?",
    answer: "The platform seamlessly supports keyboard input with n-key rollover handling, a customized virtual D-Pad and action buttons for touch devices, and native Gamepad API integration for a true console-like experience.",
    category: "controls"
  },
  {
    id: "search-algorithm",
    question: "How does the game search work?",
    answer: "We implement a custom Levenshtein distance algorithm for fuzzy string matching, combined with weighted scoring for exact substrings and acronyms. This allows users to find games instantly even with typos.",
    category: "technical"
  },
  {
    id: "privacy-policy",
    question: "Is my gameplay data tracked?",
    answer: "Absolutely not. The platform has zero backend servers, zero trackers, and zero analytics. All high scores, settings, and save states are persisted entirely locally using your browser's native localStorage.",
    category: "general"
  },
  {
    id: "mobile-support",
    question: "Can I play on my phone?",
    answer: "Yes, ARCADE_ is fully responsive. On mobile devices, the platform dynamically swaps to a tailored layout providing virtual touch controls, handling both portrait and landscape orientations to maximize the gameplay viewport.",
    category: "controls"
  },
  {
    id: "tech-stack",
    question: "What powers the ARCADE_ platform?",
    answer: "The platform is built with strict TypeScript 5.x and Next.js 16 App Router (with Turbopack). However, for the actual game engine, we strictly prohibit third-party frameworks like Phaser or Pixi, relying exclusively on zero-dependency custom code.",
    category: "technical"
  }
];
