import React from "react";
import type { Metadata } from "next";
import { constructSiteMetadata } from "@/lib/seo/metadata";
import { BreadcrumbTrail } from "@/components/marketing/BreadcrumbTrail";

export const metadata: Metadata = constructSiteMetadata({
  title: "Engine Architecture & Specifications — ARCADE_",
  description:
    "Engineering documentation, deterministic simulation architecture, zero-dependency canvas renderer, and Web Audio synthesis for ARCADE_.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-16)" }}>
      <BreadcrumbTrail items={[{ label: "ENGINE ARCHITECTURE" }]} />

      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* HEADER SECTION */}
        <div style={{ marginBottom: "36px", borderBottom: "1px solid var(--color-surface-border)", paddingBottom: "24px" }}>
          <span
            style={{
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              fontWeight: 800,
              color: "var(--arcade-yellow)",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
            }}
          >
            ✦ SYSTEM SPECIFICATIONS & ARCHITECTURE
          </span>
          <h1
            style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "clamp(24px, 4vw, 36px)",
              fontWeight: 900,
              color: "#FFFFFF",
              marginTop: "12px",
              marginBottom: "10px",
              lineHeight: 1.25,
            }}
          >
            ARCADE_ ENGINE ARCHITECTURE
          </h1>
          <p style={{ fontSize: "15px", color: "var(--color-text-dim)", lineHeight: 1.6 }}>
            Engineering documentation for a deterministic, zero-dependency browser game platform running 60 autonomous cartridges.
          </p>
        </div>
        
        {/* 1. WHAT IS ARCADE_ */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{
            fontFamily: "var(--font-pixel), monospace",
            color: "var(--arcade-pink, #FF5C8A)",
            borderBottom: "1px solid var(--color-surface-border, #1E293B)",
            paddingBottom: "10px",
            marginBottom: "20px"
          }}>1. WHAT IS ARCADE_?</h2>
          <p style={{ fontSize: "16px", lineHeight: "1.7", color: "var(--color-text-dim)", maxWidth: "880px", marginBottom: "20px" }}>
            ARCADE_ is a modern, high-performance browser arcade platform built from pure mathematical first principles. Featuring precisely <strong>60 autonomous cartridge games</strong>, the platform vehemently rejects binary ROM dumps, bloated third-party engines (no Phaser, no Pixi, no Unity, no Box2D), and third-party emulators. Every single game—from classic matrix puzzles to continuous fluid simulators and electronic circuit breadboards—is hand-engineered in strict TypeScript.
          </p>
          <p style={{ fontSize: "16px", lineHeight: "1.7", color: "var(--color-text-dim)", maxWidth: "880px" }}>
            Operating 100% locally within the client boundary with zero runtime server dependencies, ARCADE_ pairs a rigid 60Hz fixed-timestep physics accumulator with zero-allocation memory pooling and real-time procedural Web Audio synthesis to deliver an authentic, deterministic 60fps retro experience.
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
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px"
          }}>
            <div style={{ backgroundColor: "var(--color-surface, #111827)", padding: "24px", borderRadius: "8px", border: "1px solid var(--color-surface-border, #1E293B)", borderTop: "3px solid var(--arcade-yellow)" }}>
              <h3 style={{ fontFamily: "var(--font-pixel), monospace", color: "var(--arcade-yellow, #FFD84D)", fontSize: "0.95rem", marginBottom: "12px" }}>1. ZERO ROM PRINCIPLE</h3>
              <p style={{ fontSize: "0.9rem", lineHeight: "1.6" }}>No copyright ROM binaries or emulators. Every game is meticulously reverse-engineered and rewritten utilizing native web standards. We treat the browser canvas as custom hardware.</p>
            </div>
            <div style={{ backgroundColor: "var(--color-surface, #111827)", padding: "24px", borderRadius: "8px", border: "1px solid var(--color-surface-border, #1E293B)", borderTop: "3px solid var(--arcade-pink)" }}>
              <h3 style={{ fontFamily: "var(--font-pixel), monospace", color: "var(--arcade-pink, #FF5C8A)", fontSize: "0.95rem", marginBottom: "12px" }}>2. DETERMINISTIC 60HZ ACCUMULATOR</h3>
              <p style={{ fontSize: "0.9rem", lineHeight: "1.6" }}>A decoupled fixed-timestep accumulator loop guarantees that physics, collision resolutions, and game rules execute identically on 60Hz, 144Hz, or 240Hz monitors.</p>
            </div>
            <div style={{ backgroundColor: "var(--color-surface, #111827)", padding: "24px", borderRadius: "8px", border: "1px solid var(--color-surface-border, #1E293B)", borderTop: "3px solid var(--arcade-cyan)" }}>
              <h3 style={{ fontFamily: "var(--font-pixel), monospace", color: "var(--arcade-cyan, #4DE8E8)", fontSize: "0.95rem", marginBottom: "12px" }}>3. ZERO-DEPENDENCY ENGINE</h3>
              <p style={{ fontSize: "0.9rem", lineHeight: "1.6" }}>No external game engines. We hand-crafted our Canvas 2D renderers, matrix transformations, spatial grids, and input normalizers, keeping the initial shell bundle ultra-light.</p>
            </div>
            <div style={{ backgroundColor: "var(--color-surface, #111827)", padding: "24px", borderRadius: "8px", border: "1px solid var(--color-surface-border, #1E293B)", borderTop: "3px solid var(--arcade-purple)" }}>
              <h3 style={{ fontFamily: "var(--font-pixel), monospace", color: "var(--arcade-purple, #A879FF)", fontSize: "0.95rem", marginBottom: "12px" }}>4. PROCEDURAL WEB AUDIO SYNTHESIS</h3>
              <p style={{ fontSize: "0.9rem", lineHeight: "1.6" }}>Zero MP3 or WAV audio downloads. Soundscapes, lasers, explosions, and melodies are synthesized in real-time using the Web Audio API, ADSR gain envelopes, and custom oscillators.</p>
            </div>
            <div style={{ backgroundColor: "var(--color-surface, #111827)", padding: "24px", borderRadius: "8px", border: "1px solid var(--color-surface-border, #1E293B)", borderTop: "3px solid var(--arcade-green)" }}>
              <h3 style={{ fontFamily: "var(--font-pixel), monospace", color: "var(--arcade-green, #63E66D)", fontSize: "0.95rem", marginBottom: "12px" }}>5. MATHEMATICAL FOUNDATIONS</h3>
              <p style={{ fontSize: "0.9rem", lineHeight: "1.6" }}>Mechanics are built on real math: Ohm's law, 2D tire friction tensors, DDA raycasting, Catmull-Rom splines, Levenshtein distance, and Mulberry32 PRNG.</p>
            </div>
            <div style={{ backgroundColor: "var(--color-surface, #111827)", padding: "24px", borderRadius: "8px", border: "1px solid var(--color-surface-border, #1E293B)", borderTop: "3px solid #ff9f43" }}>
              <h3 style={{ fontFamily: "var(--font-pixel), monospace", color: "#ff9f43", fontSize: "0.95rem", marginBottom: "12px" }}>6. ZERO-GC MEMORY POOLING</h3>
              <p style={{ fontSize: "0.9rem", lineHeight: "1.6" }}>High-velocity bullet hells and particle systems reuse pre-allocated object pools, eliminating garbage collection pauses during intense gameplay moments.</p>
            </div>
          </div>
        </section>

        {/* 3. MATHEMATICAL SPOTLIGHT: CRAZY GAMES WE BUILT */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{
            fontFamily: "var(--font-pixel), monospace",
            color: "var(--arcade-yellow, #FFD84D)",
            borderBottom: "1px solid var(--color-surface-border, #1E293B)",
            paddingBottom: "10px",
            marginBottom: "30px"
          }}>3. MATHEMATICAL BREAKTHROUGHS & GAME SPOTLIGHT</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
            
            {/* Circuit Lab */}
            <div style={{ backgroundColor: "var(--color-surface)", padding: "24px", borderRadius: "8px", border: "1px solid rgba(77, 232, 232, 0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontFamily: "var(--font-pixel)", color: "var(--arcade-cyan)", fontSize: "1rem" }}>⚡ CIRCUIT LAB (Time Loop)</h3>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--arcade-yellow)", backgroundColor: "rgba(255,216,77,0.1)", padding: "2px 8px", borderRadius: "4px" }}>ELECTRONICS SIM</span>
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-dim)", lineHeight: "1.6", marginBottom: "12px" }}>
                A virtual solderless breadboard simulation. Wires active components (9V battery rails, 555 timer ICs, LEDs, resistors, capacitors, buzzers). Calculates real-time Ohm&apos;s Law nodal current:
              </p>
              <div style={{ backgroundColor: "rgba(0,0,0,0.5)", padding: "10px 14px", borderRadius: "6px", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#4de8e8", marginBottom: "10px" }}>
                {"I = (V_s - V_f) / R, \\quad \\tau = RC, \\quad f = 1.44 / ((R_1 + 2R_2)C)"}
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-dim)" }}>
                Overcurrent (&gt;30mA) blows components with real-time audio smoke synthesis, while correct wiring delivers oscillating LED pulses.
              </p>
            </div>

            {/* Tractor Mulcher */}
            <div style={{ backgroundColor: "var(--color-surface)", padding: "24px", borderRadius: "8px", border: "1px solid rgba(99, 230, 109, 0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontFamily: "var(--font-pixel)", color: "var(--arcade-green)", fontSize: "1rem" }}>🚜 TRACTOR MULCHER (Infinite Forest)</h3>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--arcade-green)", backgroundColor: "rgba(99,230,109,0.1)", padding: "2px 8px", borderRadius: "4px" }}>VALUE NOISE FBM</span>
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-dim)", lineHeight: "1.6", marginBottom: "12px" }}>
                Procedural forestry simulator. Synthesizes continuous multi-octave ValueNoise terrain heightmaps via fractional Brownian motion (fBm):
              </p>
              <div style={{ backgroundColor: "rgba(0,0,0,0.5)", padding: "10px 14px", borderRadius: "6px", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#63e66d", marginBottom: "10px" }}>
                {"y(x) = h_0 + \\sum_{i=0}^{k-1} A \\cdot \\gamma^i \\cdot Noise(f_0 \\cdot 2^i \\cdot x)"}
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-dim)" }}>
                Rotating carbide grinder drums shred dynamic pine timber into parabolic drag-affected splinter particle ballistics.
              </p>
            </div>

            {/* Inferno Strike */}
            <div style={{ backgroundColor: "var(--color-surface)", padding: "24px", borderRadius: "8px", border: "1px solid rgba(255, 92, 138, 0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontFamily: "var(--font-pixel)", color: "var(--arcade-pink)", fontSize: "1rem" }}>✈️ INFERNO STRIKE (Fire Spread)</h3>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--arcade-pink)", backgroundColor: "rgba(255,92,138,0.1)", padding: "2px 8px", borderRadius: "4px" }}>GAUSSIAN DISPERSAL</span>
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-dim)", lineHeight: "1.6", marginBottom: "12px" }}>
                Aerial firefighting simulation. Air tankers drop chemical retardant swaths calculated via 2D Gaussian ground deposition:
              </p>
              <div style={{ backgroundColor: "rgba(0,0,0,0.5)", padding: "10px 14px", borderRadius: "6px", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#ff5c8a", marginBottom: "10px" }}>
                {"\\rho(x) = \\rho_0 \\cdot \\exp(- (x - x_{drop})^2 / (2\\sigma^2))"}
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-dim)" }}>
                Blocks cellular automaton wildland fire propagation with realistic wind vectors and moisture gradient barriers.
              </p>
            </div>

            {/* Hotlap */}
            <div style={{ backgroundColor: "var(--color-surface)", padding: "24px", borderRadius: "8px", border: "1px solid rgba(255, 216, 77, 0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontFamily: "var(--font-pixel)", color: "var(--arcade-yellow)", fontSize: "1rem" }}>🏎️ HOTLAP (Formula Racing)</h3>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--arcade-yellow)", backgroundColor: "rgba(255,216,77,0.1)", padding: "2px 8px", borderRadius: "4px" }}>TIRE KINEMATICS</span>
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-dim)", lineHeight: "1.6", marginBottom: "12px" }}>
                Top-down formula racing engine. Decomposes velocity vectors into longitudinal traction and lateral slip bases:
              </p>
              <div style={{ backgroundColor: "rgba(0,0,0,0.5)", padding: "10px 14px", borderRadius: "6px", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#ffd84d", marginBottom: "10px" }}>
                {"v = (v · h)h + (v · n)n, \\quad Slip \\propto \\mu \\cdot k \\cdot \\Delta t"}
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-dim)" }}>
                Evaluates distance on closed cubic Catmull-Rom track splines with tire smoke particle emitters on oversteer.
              </p>
            </div>

            {/* Ray Sector */}
            <div style={{ backgroundColor: "var(--color-surface)", padding: "24px", borderRadius: "8px", border: "1px solid rgba(168, 121, 255, 0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontFamily: "var(--font-pixel)", color: "var(--arcade-purple)", fontSize: "1rem" }}>🕶️ RAY SECTOR (2.5D Raycaster)</h3>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--arcade-purple)", backgroundColor: "rgba(168,121,255,0.1)", padding: "2px 8px", borderRadius: "4px" }}>DDA RAYCASTING</span>
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-dim)", lineHeight: "1.6", marginBottom: "12px" }}>
                1990s pseudo-3D FPS engine. Uses Digital Differential Analysis (DDA) for grid traversal with Euclidean fish-eye correction:
              </p>
              <div style={{ backgroundColor: "rgba(0,0,0,0.5)", padding: "10px 14px", borderRadius: "6px", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#a879ff", marginBottom: "10px" }}>
                {"d_{perp} = \\min(t_x, t_y) \\cdot \\cos(\\theta - \\theta_{camera}), \\quad h_{wall} = (H \\cdot S) / d_{perp}"}
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-dim)" }}>
                Draws 320 textured vertical scanlines with depth shading and zero 3D matrix projection libraries.
              </p>
            </div>

            {/* Liquid Cells */}
            <div style={{ backgroundColor: "var(--color-surface)", padding: "24px", borderRadius: "8px", border: "1px solid rgba(77, 232, 232, 0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontFamily: "var(--font-pixel)", color: "var(--arcade-cyan)", fontSize: "1rem" }}>💧 LIQUID CELLS (Hydrodynamics)</h3>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--arcade-cyan)", backgroundColor: "rgba(77,232,232,0.1)", padding: "2px 8px", borderRadius: "4px" }}>DISCRETE FLUIDS</span>
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-dim)", lineHeight: "1.6", marginBottom: "12px" }}>
                Cellular automaton lattice fluid simulator. Models hydrostatic pressure balance and gravity cascade mass transfers:
              </p>
              <div style={{ backgroundColor: "rgba(0,0,0,0.5)", padding: "10px 14px", borderRadius: "6px", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#4de8e8", marginBottom: "10px" }}>
                {"\\Delta m_{i \\to j} = \\min(m_i, \\max(0, (m_i + m_j) / 2 - m_j))"}
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-dim)" }}>
                Yields realistic sloshing waves, water channels, and waterfall cascades on discrete canvas grids.
              </p>
            </div>

          </div>
        </section>

        {/* 4. ENGINE ARCHITECTURE OVERVIEW */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{
            fontFamily: "var(--font-pixel), monospace",
            color: "var(--arcade-yellow, #FFD84D)",
            borderBottom: "1px solid var(--color-surface-border, #1E293B)",
            paddingBottom: "10px",
            marginBottom: "30px"
          }}>4. ENGINE SUBSYSTEM ARCHITECTURE</h2>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px"
          }}>
            <div style={{ backgroundColor: "var(--color-surface, #111827)", border: "1px solid var(--color-surface-border, #1E293B)", padding: "24px", borderRadius: "8px" }}>
              <h3 style={{ fontFamily: "var(--font-pixel), monospace", color: "var(--arcade-cyan, #4DE8E8)", fontSize: "0.95rem", marginBottom: "12px" }}>[ INPUT LAYER ]</h3>
              <p style={{ fontSize: "0.9rem", lineHeight: "1.6", color: "var(--color-text-dim)" }}>Normalizes hardware inputs (Keyboard, 8-Way Touch Radial Dial, Gamepad API) into unified <code>GameAction</code> states with pointer-capture deadzones and per-tick replay logging.</p>
            </div>
            <div style={{ backgroundColor: "var(--color-surface, #111827)", border: "1px solid var(--color-surface-border, #1E293B)", padding: "24px", borderRadius: "8px" }}>
              <h3 style={{ fontFamily: "var(--font-pixel), monospace", color: "var(--arcade-purple, #A879FF)", fontSize: "0.95rem", marginBottom: "12px" }}>[ SIMULATION LAYER ]</h3>
              <p style={{ fontSize: "0.9rem", lineHeight: "1.6", color: "var(--color-text-dim)" }}>Decoupled from render tick rate. Advances state in exact 16.66ms quantum slices, resolves AABB/Circle collisions, integrates vector velocities, and prevents lag spirals via 0.25s clamping.</p>
            </div>
            <div style={{ backgroundColor: "var(--color-surface, #111827)", border: "1px solid var(--color-surface-border, #1E293B)", padding: "24px", borderRadius: "8px" }}>
              <h3 style={{ fontFamily: "var(--font-pixel), monospace", color: "var(--arcade-pink, #FF5C8A)", fontSize: "0.95rem", marginBottom: "12px" }}>[ RENDER LAYER ]</h3>
              <p style={{ fontSize: "0.9rem", lineHeight: "1.6", color: "var(--color-text-dim)" }}>Direct Canvas 2D immediate-mode rasterization. Quantizes coordinates to integer grid intervals to eliminate sub-pixel anti-aliasing blurring, supplemented by CRT scanline filters.</p>
            </div>
            <div style={{ backgroundColor: "var(--color-surface, #111827)", border: "1px solid var(--color-surface-border, #1E293B)", padding: "24px", borderRadius: "8px" }}>
              <h3 style={{ fontFamily: "var(--font-pixel), monospace", color: "var(--arcade-green, #63E66D)", fontSize: "0.95rem", marginBottom: "12px" }}>[ AUDIO SYNTHESIZER ]</h3>
              <p style={{ fontSize: "0.9rem", lineHeight: "1.6", color: "var(--color-text-dim)" }}>Procedural Web Audio API sound generator. Generates authentic square, sawtooth, and triangle waveforms with exponential ADSR envelopes and dynamic pitch ramps on demand.</p>
            </div>
          </div>
        </section>

        {/* 5. ALL 60 CARTRIDGES CATALOG OVERVIEW */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{
            fontFamily: "var(--font-pixel), monospace",
            color: "var(--arcade-cyan, #4DE8E8)",
            borderBottom: "1px solid var(--color-surface-border, #1E293B)",
            paddingBottom: "10px",
            marginBottom: "20px"
          }}>5. COMPLETE CARTRIDGE TIERS (60 TOTAL)</h2>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-surface-border, #1E293B)", textAlign: "left", color: "var(--arcade-yellow, #FFD84D)" }}>
                  <th style={{ padding: "12px", fontFamily: "var(--font-pixel), monospace", fontSize: "0.75rem" }}>CATEGORY</th>
                  <th style={{ padding: "12px", fontFamily: "var(--font-pixel), monospace", fontSize: "0.75rem" }}>CARTRIDGE ROSTER</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                  <td style={{ padding: "12px", fontWeight: "bold", color: "#4de8e8" }}>Core Classics</td>
                  <td style={{ padding: "12px" }}>Tetris, Snake, Pong, Breakout, Minesweeper, Space Defender, Asteroid Field, Alien Swarm</td>
                </tr>
                <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                  <td style={{ padding: "12px", fontWeight: "bold", color: "#ffd84d" }}>Retro Arcade & Reflex</td>
                  <td style={{ padding: "12px" }}>Maze Chaser, Donkey Climb, Bomb Grid, Cave Hunter, Pixel Quest, Diamond Run, Road Hopper, Brick Stack, Laser Grid</td>
                </tr>
                <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                  <td style={{ padding: "12px", fontWeight: "bold", color: "#a879ff" }}>Puzzle Logic & Math</td>
                  <td style={{ padding: "12px" }}>2048, Sudoku, Lights Out, Match-3, Sliding Puzzle, Maze Runner, Pipe Connect, Sokoban, Logic Gates</td>
                </tr>
                <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                  <td style={{ padding: "12px", fontWeight: "bold", color: "#63e66d" }}>Physics & Mechanics</td>
                  <td style={{ padding: "12px" }}>Peg Blast, Marble Rush, Gravity Flip, Ball Drop, Rope Swing, Magnet Run, Newton's Box, Ricochet, Pool Simulator</td>
                </tr>
                <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                  <td style={{ padding: "12px", fontWeight: "bold", color: "#ff5c8a" }}>Shooters & Combat</td>
                  <td style={{ padding: "12px" }}>Pixel Brawl, Twin Stick Arena, Boss Reactor, Drone Swarm, Missile Command, Bullet Garden, Ray Sector, Rail Storm</td>
                </tr>
                <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                  <td style={{ padding: "12px", fontWeight: "bold", color: "#ff9f43" }}>Speed & Platformers</td>
                  <td style={{ padding: "12px" }}>Hotlap, Pixel Kart, Velocity Rush, Omega Run, Pixel Jumper, Wall Runner, Cave Escape, Shadow Runner</td>
                </tr>
                <tr>
                  <td style={{ padding: "12px", fontWeight: "bold", color: "#54a0ff" }}>Strategy & Simulation</td>
                  <td style={{ padding: "12px" }}>Tower Defense, Connect Four, Reversi, Tic-Tac-Toe+, Cell Colony, Infinite Forest, Time Loop, Fire Spread, Liquid Cells</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 6. ENGINEERING CASE STUDIES DIRECTORY */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{
            fontFamily: "var(--font-pixel), monospace",
            color: "var(--arcade-green, #63E66D)",
            borderBottom: "1px solid var(--color-surface-border, #1E293B)",
            paddingBottom: "10px",
            marginBottom: "20px"
          }}>6. TECHNICAL CASE STUDIES (8 PUBLICATIONS)</h2>
          <p style={{ fontSize: "15px", color: "var(--color-text-dim)", marginBottom: "20px" }}>
            Explore in-depth architectural whitepapers detailing the mathematical derivations, algorithms, and source code underpinning ARCADE_:
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            <a href="/case-studies/deterministic-game-engine" style={{ display: "block", padding: "16px", backgroundColor: "var(--color-surface)", border: "1px solid rgba(255,216,77,0.3)", borderRadius: "6px", textDecoration: "none" }}>
              <div style={{ color: "var(--arcade-yellow)", fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: "bold", marginBottom: "6px" }}>CASE STUDY #01</div>
              <div style={{ color: "#ffffff", fontWeight: "bold", fontSize: "0.95rem", marginBottom: "6px" }}>Deterministic 60Hz Game Engine</div>
              <div style={{ color: "var(--color-text-dim)", fontSize: "0.85rem" }}>Decoupling physics from 144Hz/240Hz monitors using fixed accumulators.</div>
            </a>
            <a href="/case-studies/tetris-matrix-rotations" style={{ display: "block", padding: "16px", backgroundColor: "var(--color-surface)", border: "1px solid rgba(77,232,232,0.3)", borderRadius: "6px", textDecoration: "none" }}>
              <div style={{ color: "var(--arcade-cyan)", fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: "bold", marginBottom: "6px" }}>CASE STUDY #02</div>
              <div style={{ color: "#ffffff", fontWeight: "bold", fontSize: "0.95rem", marginBottom: "6px" }}>SRS Matrix Rotations & Algebra</div>
              <div style={{ color: "var(--color-text-dim)", fontSize: "0.85rem" }}>Discrete matrix transposition and prioritized 5-offset kick tables.</div>
            </a>
            <a href="/case-studies/fuzzy-search-ranking" style={{ display: "block", padding: "16px", backgroundColor: "var(--color-surface)", border: "1px solid rgba(255,92,138,0.3)", borderRadius: "6px", textDecoration: "none" }}>
              <div style={{ color: "var(--arcade-pink)", fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: "bold", marginBottom: "6px" }}>CASE STUDY #03</div>
              <div style={{ color: "#ffffff", fontWeight: "bold", fontSize: "0.95rem", marginBottom: "6px" }}>Multi-Criteria Fuzzy Search</div>
              <div style={{ color: "var(--color-text-dim)", fontSize: "0.85rem" }}>Space-optimized O(N) Levenshtein dynamic programming and polynomial weights.</div>
            </a>
            <a href="/case-studies/procedural-pixel-vegetation" style={{ display: "block", padding: "16px", backgroundColor: "var(--color-surface)", border: "1px solid rgba(99,230,109,0.3)", borderRadius: "6px", textDecoration: "none" }}>
              <div style={{ color: "var(--arcade-green)", fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: "bold", marginBottom: "6px" }}>CASE STUDY #04</div>
              <div style={{ color: "#ffffff", fontWeight: "bold", fontSize: "0.95rem", marginBottom: "6px" }}>Procedural Pixel Vegetation</div>
              <div style={{ color: "var(--color-text-dim)", fontSize: "0.85rem" }}>Seeded value noise and quantized coordinate snapping on Canvas 2D.</div>
            </a>
            <a href="/case-studies/electronic-circuit-simulation" style={{ display: "block", padding: "16px", backgroundColor: "var(--color-surface)", border: "1px solid rgba(77,232,232,0.3)", borderRadius: "6px", textDecoration: "none" }}>
              <div style={{ color: "var(--arcade-cyan)", fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: "bold", marginBottom: "6px" }}>CASE STUDY #05</div>
              <div style={{ color: "#ffffff", fontWeight: "bold", fontSize: "0.95rem", marginBottom: "6px" }}>Real-Time Circuit Lab Simulation</div>
              <div style={{ color: "var(--color-text-dim)", fontSize: "0.85rem" }}>Ohm's Law nodal graphs, exponential RC transients, and 555 timers.</div>
            </a>
            <a href="/case-studies/orthographic-tire-kinematics" style={{ display: "block", padding: "16px", backgroundColor: "var(--color-surface)", border: "1px solid rgba(255,216,77,0.3)", borderRadius: "6px", textDecoration: "none" }}>
              <div style={{ color: "var(--arcade-yellow)", fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: "bold", marginBottom: "6px" }}>CASE STUDY #06</div>
              <div style={{ color: "#ffffff", fontWeight: "bold", fontSize: "0.95rem", marginBottom: "6px" }}>Orthogonal Tire Kinematics & Splines</div>
              <div style={{ color: "var(--color-text-dim)", fontSize: "0.85rem" }}>Slipstream vectors, drift friction tensors, and Catmull-Rom tracks.</div>
            </a>
            <a href="/case-studies/aerial-fire-suppression-kinematics" style={{ display: "block", padding: "16px", backgroundColor: "var(--color-surface)", border: "1px solid rgba(255,92,138,0.3)", borderRadius: "6px", textDecoration: "none" }}>
              <div style={{ color: "var(--arcade-pink)", fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: "bold", marginBottom: "6px" }}>CASE STUDY #07</div>
              <div style={{ color: "#ffffff", fontWeight: "bold", fontSize: "0.95rem", marginBottom: "6px" }}>Aerial Retardant Dispersal</div>
              <div style={{ color: "var(--color-text-dim)", fontSize: "0.85rem" }}>Gaussian fluid plumes and non-linear cellular fire spread barriers.</div>
            </a>
            <a href="/case-studies/lattice-cellular-hydrodynamics" style={{ display: "block", padding: "16px", backgroundColor: "var(--color-surface)", border: "1px solid rgba(168,121,255,0.3)", borderRadius: "6px", textDecoration: "none" }}>
              <div style={{ color: "var(--arcade-purple)", fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: "bold", marginBottom: "6px" }}>CASE STUDY #08</div>
              <div style={{ color: "#ffffff", fontWeight: "bold", fontSize: "0.95rem", marginBottom: "6px" }}>Lattice Cellular Hydrodynamics</div>
              <div style={{ color: "var(--color-text-dim)", fontSize: "0.85rem" }}>Hydrostatic pressure balance and fluid cascades on discrete grids.</div>
            </a>
          </div>
        </section>

        {/* 7. PERFORMANCE BENCHMARKS */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{
            fontFamily: "var(--font-pixel), monospace",
            color: "var(--arcade-purple, #A879FF)",
            borderBottom: "1px solid var(--color-surface-border, #1E293B)",
            paddingBottom: "10px",
            marginBottom: "20px"
          }}>7. PERFORMANCE & RUNTIME BENCHMARKS</h2>
          <div style={{
            backgroundColor: "var(--color-surface, #111827)",
            padding: "30px",
            border: "1px solid var(--color-surface-border, #1E293B)",
            borderRadius: "8px",
            fontFamily: "var(--font-mono), monospace"
          }}>
            <ul style={{ listStyleType: "none", padding: 0, margin: 0, lineHeight: 2.2 }}>
              <li><span style={{ color: "var(--arcade-yellow, #FFD84D)" }}>[ SIMULATION TICK ]</span> 60.0 FPS fixed deterministic accumulator loop.</li>
              <li><span style={{ color: "var(--arcade-cyan, #4DE8E8)" }}>[ CODE SPLITTING ]</span> Dynamic on-demand cartridge chunk loading via Next.js Turbopack.</li>
              <li><span style={{ color: "var(--arcade-pink, #FF5C8A)" }}>[ NETWORK OVERHEAD ]</span> 0 audio/video/ROM asset downloads during gameplay.</li>
              <li><span style={{ color: "var(--arcade-green, #63E66D)" }}>[ MEMORY STABILITY ]</span> Zero-allocation object pooling for projectiles, particles, and matrices.</li>
              <li><span style={{ color: "var(--arcade-purple, #A879FF)" }}>[ TEST COVERAGE ]</span> 18 test suites with 344 automated smoke, fuzz, math, and rendering tests passing.</li>
            </ul>
          </div>
        </section>
        
      </div>
    </div>
  );
}
