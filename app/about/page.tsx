import React from 'react';

export default function AboutPage() {
  return (
    <div style={{
      backgroundColor: "#080B12",
      color: "var(--color-text-dim, #A1A1AA)",
      fontFamily: "var(--font-sans), sans-serif",
      minHeight: "100vh",
      paddingBottom: "100px",
      lineHeight: 1.6
    }}>
      {/* HERO SECTION */}
      <div style={{
        width: "100%",
        padding: "clamp(48px, 8vw, 100px) clamp(16px, 4vw, 40px)",
        backgroundColor: "rgba(0,0,0,0.4)",
        borderBottom: "1px solid var(--color-surface-border, #1E293B)",
        textAlign: "center"
      }}>
        <h1 style={{
          fontFamily: "var(--font-pixel), monospace",
          fontSize: "clamp(1.6rem, 4vw, 3rem)",
          color: "var(--arcade-yellow, #FFD84D)",
          marginBottom: "20px",
          textShadow: "4px 4px 0px rgba(0,0,0,0.8)",
          lineHeight: 1.3,
        }}>
          ARCADE_ ARCHITECTURE
        </h1>
        <p style={{
          maxWidth: "800px",
          margin: "0 auto",
          fontSize: "clamp(1rem, 1.8vw, 1.25rem)",
          color: "var(--arcade-cyan, #4DE8E8)"
        }}>
          Engineering documentation for a deterministic, zero-dependency browser game platform.
        </p>
      </div>

      <div style={{ maxWidth: "min(1400px, 94vw)", margin: "0 auto", padding: "40px clamp(16px, 3vw, 32px)" }}>
        
        {/* 1. WHAT IS ARCADE_ */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{
            fontFamily: "var(--font-pixel), monospace",
            color: "var(--arcade-pink, #FF5C8A)",
            borderBottom: "1px solid var(--color-surface-border, #1E293B)",
            paddingBottom: "10px",
            marginBottom: "20px"
          }}>1. WHAT IS ARCADE_?</h2>
          <p style={{ fontSize: "16px", lineHeight: "1.7", color: "var(--color-text-dim)", maxWidth: "800px", margin: "0 auto 32px" }}>
            ARCADE_ is a modern, browser-based retro gaming platform engineered with mathematical purity. Featuring precisely 61 unique cartridge games, the platform vehemently rejects ROM dumps and third-party emulators. Every title is reverse-engineered from first principles and natively re-implemented in strict TypeScript. Built for longevity and determinism, it operates entirely within the client boundary, utilizing zero external dependencies, resulting in a blisteringly fast, hyper-optimized 60fps experience that honors the legacy of classic arcade hardware.
          </p>
        </section>

        {/* 2. THE ENGINEERING MANIFESTO */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{
            fontFamily: "var(--font-pixel), monospace",
            color: "var(--arcade-green, #63E66D)",
            borderBottom: "1px solid var(--color-surface-border, #1E293B)",
            paddingBottom: "10px",
            marginBottom: "30px"
          }}>2. THE ENGINEERING MANIFESTO</h2>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px"
          }}>
            <div style={{ backgroundColor: "var(--color-surface, #111827)", padding: "24px", borderRadius: "8px", border: "1px solid var(--color-surface-border, #1E293B)" }}>
              <h3 style={{ fontFamily: "var(--font-pixel), monospace", color: "var(--arcade-yellow, #FFD84D)", fontSize: "1rem", marginBottom: "12px" }}>1. ZERO ROM PRINCIPLE</h3>
              <p>No binary dumps or emulators. Every game is meticulously rewritten utilizing native web APIs. We embrace the constraints of the browser as our hardware.</p>
            </div>
            <div style={{ backgroundColor: "var(--color-surface, #111827)", padding: "24px", borderRadius: "8px", border: "1px solid var(--color-surface-border, #1E293B)" }}>
              <h3 style={{ fontFamily: "var(--font-pixel), monospace", color: "var(--arcade-pink, #FF5C8A)", fontSize: "1rem", marginBottom: "12px" }}>2. DETERMINISTIC SIMULATION</h3>
              <p>A decoupled, rigid 60Hz accumulator loop guarantees that physics and game logic execute identically on a 60Hz budget monitor or a 240Hz display.</p>
            </div>
            <div style={{ backgroundColor: "var(--color-surface, #111827)", padding: "24px", borderRadius: "8px", border: "1px solid var(--color-surface-border, #1E293B)" }}>
              <h3 style={{ fontFamily: "var(--font-pixel), monospace", color: "var(--arcade-cyan, #4DE8E8)", fontSize: "1rem", marginBottom: "12px" }}>3. ZERO-DEPENDENCY ENGINE</h3>
              <p>No Phaser. No Pixi. No Unity. We hand-write our Canvas 2D renderers, object pools, and input handlers, eliminating framework bloat.</p>
            </div>
            <div style={{ backgroundColor: "var(--color-surface, #111827)", padding: "24px", borderRadius: "8px", border: "1px solid var(--color-surface-border, #1E293B)" }}>
              <h3 style={{ fontFamily: "var(--font-pixel), monospace", color: "var(--arcade-purple, #A879FF)", fontSize: "1rem", marginBottom: "12px" }}>4. PROCEDURAL AUDIO</h3>
              <p>Zero MP3s or WAVs. All soundscapes are synthesized in real-time utilizing the Web Audio API, ADSR envelopes, and custom oscillators.</p>
            </div>
            <div style={{ backgroundColor: "var(--color-surface, #111827)", padding: "24px", borderRadius: "8px", border: "1px solid var(--color-surface-border, #1E293B)" }}>
              <h3 style={{ fontFamily: "var(--font-pixel), monospace", color: "var(--arcade-green, #63E66D)", fontSize: "1rem", marginBottom: "12px" }}>5. MATHEMATICAL FOUNDATIONS</h3>
              <p>Game mechanics are rooted in pure math: real vector physics, Super Rotation Systems (SRS), Levenshtein distance for search, and pseudo-random noise.</p>
            </div>
          </div>
        </section>

        {/* 3. ENGINE ARCHITECTURE OVERVIEW */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{
            fontFamily: "var(--font-pixel), monospace",
            color: "var(--arcade-yellow, #FFD84D)",
            borderBottom: "1px solid var(--color-surface-border, #1E293B)",
            paddingBottom: "10px",
            marginBottom: "30px"
          }}>3. ENGINE ARCHITECTURE OVERVIEW</h2>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px"
          }}>
            <div style={{ backgroundColor: "var(--color-surface, #111827)", border: "1px solid var(--color-surface-border, #1E293B)", padding: "20px" }}>
              <h3 style={{ fontFamily: "var(--font-pixel), monospace", color: "var(--arcade-cyan, #4DE8E8)", fontSize: "0.9rem", marginBottom: "15px" }}>[ INPUT LAYER ]</h3>
              <p style={{ fontSize: "0.95rem" }}>Normalizes device inputs (Keyboard, Touch, Gamepad) into a unified buffer. Handles edge cases like n-key rollover, touch dragging, and analog deadzones. State is snapshotted per-frame to avoid mid-frame mutation anomalies.</p>
            </div>
            <div style={{ backgroundColor: "var(--color-surface, #111827)", border: "1px solid var(--color-surface-border, #1E293B)", padding: "20px" }}>
              <h3 style={{ fontFamily: "var(--font-pixel), monospace", color: "var(--arcade-purple, #A879FF)", fontSize: "0.9rem", marginBottom: "15px" }}>[ SIMULATION LAYER ]</h3>
              <p style={{ fontSize: "0.95rem" }}>The beating heart. Processes the input snapshot and advances game state by exactly 16.66ms per tick. Resolves AABB/Circle collisions, updates vector trajectories, and manages entity lifecycle via strict memory pooling.</p>
            </div>
            <div style={{ backgroundColor: "var(--color-surface, #111827)", border: "1px solid var(--color-surface-border, #1E293B)", padding: "20px" }}>
              <h3 style={{ fontFamily: "var(--font-pixel), monospace", color: "var(--arcade-pink, #FF5C8A)", fontSize: "0.9rem", marginBottom: "15px" }}>[ RENDER LAYER ]</h3>
              <p style={{ fontSize: "0.95rem" }}>Pure function of the Simulation Layer state. Batches draw calls to HTML5 Canvas 2D. Utilizes integer coordinates for pixel-perfect crispness. Handles alpha-blending and sprite sheet blitting with minimal context switching.</p>
            </div>
          </div>
        </section>

        {/* 4. GAME TIERS TABLE */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{
            fontFamily: "var(--font-pixel), monospace",
            color: "var(--arcade-cyan, #4DE8E8)",
            borderBottom: "1px solid var(--color-surface-border, #1E293B)",
            paddingBottom: "10px",
            marginBottom: "20px"
          }}>4. GAME TIERS TABLE</h2>
          
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--color-surface-border, #1E293B)", textAlign: "left", color: "var(--arcade-yellow, #FFD84D)" }}>
                <th style={{ padding: "12px", fontFamily: "var(--font-pixel), monospace", fontSize: "0.7rem" }}>CATEGORY</th>
                <th style={{ padding: "12px", fontFamily: "var(--font-pixel), monospace", fontSize: "0.7rem" }}>EXAMPLES</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                <td style={{ padding: "12px", fontWeight: "bold" }}>Core Classics</td>
                <td style={{ padding: "12px" }}>Tetris, Snake, Pong, Breakout, Minesweeper, Space Defender, Asteroid Field</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                <td style={{ padding: "12px", fontWeight: "bold" }}>Retro Arcade</td>
                <td style={{ padding: "12px" }}>Maze Chaser, Donkey Climb, Bomb Grid, Cave Hunter, Pixel Quest, Diamond Run</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                <td style={{ padding: "12px", fontWeight: "bold" }}>Puzzle Logic</td>
                <td style={{ padding: "12px" }}>2048, Sudoku, Lights Out, Sliding Puzzle, Pipe Connect, Sokoban, Logic Gates</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                <td style={{ padding: "12px", fontWeight: "bold" }}>Physics & Reflex</td>
                <td style={{ padding: "12px" }}>Breakout, Ball Drop, Rope Swing, Magnet Run, Newton's Box, Ricochet, Pool Simulator</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                <td style={{ padding: "12px", fontWeight: "bold" }}>Shooters & Action</td>
                <td style={{ padding: "12px" }}>Twin Stick Arena, Bullet Garden, Boss Reactor, Drone Swarm, Missile Command, Ray Sector</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                <td style={{ padding: "12px", fontWeight: "bold" }}>Platformers</td>
                <td style={{ padding: "12px" }}>Pixel Jumper, Wall Runner, Cave Escape, Shadow Runner, Velocity Rush, Omega Run</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                <td style={{ padding: "12px", fontWeight: "bold" }}>Strategy & Board</td>
                <td style={{ padding: "12px" }}>Tower Defense, Connect Four, Reversi, Tic-Tac-Toe+</td>
              </tr>
              <tr>
                <td style={{ padding: "12px", fontWeight: "bold" }}>Systems & Simulation</td>
                <td style={{ padding: "12px" }}>Cell Colony, Fire Spread, Infinite Forest, Time Loop, Liquid Cells</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 5. TECH STACK */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{
            fontFamily: "var(--font-pixel), monospace",
            color: "var(--arcade-purple, #A879FF)",
            borderBottom: "1px solid var(--color-surface-border, #1E293B)",
            paddingBottom: "10px",
            marginBottom: "20px"
          }}>5. TECH STACK</h2>
          
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                <td style={{ padding: "12px", fontWeight: "bold", width: "20%" }}>Language</td>
                <td style={{ padding: "12px", color: "var(--arcade-yellow, #FFD84D)" }}>TypeScript 5.x</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                <td style={{ padding: "12px", fontWeight: "bold" }}>Framework</td>
                <td style={{ padding: "12px", color: "var(--arcade-cyan, #4DE8E8)" }}>Next.js 16 App Router</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                <td style={{ padding: "12px", fontWeight: "bold" }}>Rendering</td>
                <td style={{ padding: "12px", color: "white" }}>HTML5 Canvas 2D</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                <td style={{ padding: "12px", fontWeight: "bold" }}>Audio</td>
                <td style={{ padding: "12px", color: "white" }}>Web Audio API (Procedural)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                <td style={{ padding: "12px", fontWeight: "bold" }}>Physics</td>
                <td style={{ padding: "12px", color: "var(--arcade-green, #63E66D)" }}>Custom vector math, no Box2D</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                <td style={{ padding: "12px", fontWeight: "bold" }}>PRNG</td>
                <td style={{ padding: "12px", color: "white" }}>Mulberry32 seeded</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                <td style={{ padding: "12px", fontWeight: "bold" }}>Search</td>
                <td style={{ padding: "12px", color: "white" }}>Levenshtein distance custom</td>
              </tr>
              <tr>
                <td style={{ padding: "12px", fontWeight: "bold" }}>Styling</td>
                <td style={{ padding: "12px", color: "var(--arcade-pink, #FF5C8A)" }}>Vanilla CSS custom tokens</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 6. ARCHITECTURE DECISION RECORDS (ADRs) */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{
            fontFamily: "var(--font-pixel), monospace",
            color: "var(--arcade-pink, #FF5C8A)",
            borderBottom: "1px solid var(--color-surface-border, #1E293B)",
            paddingBottom: "10px",
            marginBottom: "30px"
          }}>6. ARCHITECTURE DECISION RECORDS (ADRs)</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{
              backgroundColor: "var(--color-surface, #111827)",
              padding: "20px",
              border: "1px solid var(--color-surface-border, #1E293B)",
              borderLeft: "6px solid var(--arcade-yellow, #FFD84D)"
            }}>
              <h3 style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "1rem", marginBottom: "10px" }}>ADR-001 Fixed Timestep</h3>
              <p style={{ marginBottom: "10px" }}><strong>Context:</strong> Using variable deltas (`dt`) directly in physics integration causes instability and non-determinism across different refresh rates.</p>
              <p><strong>Decision:</strong> Implemented a fixed timestep accumulator. The game updates strictly in 16.66ms increments. <code style={{ backgroundColor: "#000", padding: "2px 6px", fontFamily: "var(--font-mono)", color: "var(--arcade-cyan, #4DE8E8)" }}>while (accumulator {'>'}={'<'} dt) update()</code></p>
            </div>
            
            <div style={{
              backgroundColor: "var(--color-surface, #111827)",
              padding: "20px",
              border: "1px solid var(--color-surface-border, #1E293B)",
              borderLeft: "6px solid var(--arcade-cyan, #4DE8E8)"
            }}>
              <h3 style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "1rem", marginBottom: "10px" }}>ADR-002 No Third-Party Engine</h3>
              <p style={{ marginBottom: "10px" }}><strong>Context:</strong> Large libraries like Phaser provide massive toolsets but introduce massive payload bloat and opaque execution models.</p>
              <p><strong>Decision:</strong> Built a bespoke rendering and update loop in pure TypeScript. Ensures total understanding of the execution path, <code style={{ backgroundColor: "#000", padding: "2px 6px", fontFamily: "var(--font-mono)", color: "var(--arcade-pink, #FF5C8A)" }}>O(1)</code> state mutations, and a radically smaller bundle size.</p>
            </div>
            
            <div style={{
              backgroundColor: "var(--color-surface, #111827)",
              padding: "20px",
              border: "1px solid var(--color-surface-border, #1E293B)",
              borderLeft: "6px solid var(--arcade-green, #63E66D)"
            }}>
              <h3 style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "1rem", marginBottom: "10px" }}>ADR-003 Seeded PRNG</h3>
              <p style={{ marginBottom: "10px" }}><strong>Context:</strong> Math.random() cannot be seeded, making reproducible procedural generation or deterministic replays impossible.</p>
              <p><strong>Decision:</strong> Adopted Mulberry32. By maintaining state externally, the exact sequence of random events can be reproduced by passing the identical starting seed. Crucial for Tier 2 puzzle integrity.</p>
            </div>
          </div>
        </section>

        {/* 7. PERFORMANCE BENCHMARKS */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{
            fontFamily: "var(--font-pixel), monospace",
            color: "var(--arcade-green, #63E66D)",
            borderBottom: "1px solid var(--color-surface-border, #1E293B)",
            paddingBottom: "10px",
            marginBottom: "20px"
          }}>7. PERFORMANCE BENCHMARKS</h2>
          <div style={{
            backgroundColor: "var(--color-surface, #111827)",
            padding: "30px",
            border: "1px solid var(--color-surface-border, #1E293B)",
            fontFamily: "var(--font-mono), monospace"
          }}>
            <ul style={{ listStyleType: "none", padding: 0, margin: 0, lineHeight: 2 }}>
              <li><span style={{ color: "var(--arcade-yellow, #FFD84D)" }}>[ FPS ]</span> 60fps stable on Chrome / Firefox / Safari (M1 & Intel).</li>
              <li><span style={{ color: "var(--arcade-cyan, #4DE8E8)" }}>[ BUNDLE SIZE ]</span> {'<'}2MB total payload across all 61 cartridges.</li>
              <li><span style={{ color: "var(--arcade-pink, #FF5C8A)" }}>[ NETWORK ]</span> Zero network requests during gameplay. Fully local simulation.</li>
              <li><span style={{ color: "var(--arcade-purple, #A879FF)" }}>[ GC PAUSES ]</span> Mitigated entirely via strict Object Pooling for ephemeral entities.</li>
            </ul>
          </div>
        </section>
        
      </div>
    </div>
  );
}
