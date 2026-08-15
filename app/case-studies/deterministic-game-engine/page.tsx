import React from "react";
import type { Metadata } from "next";
import { constructSiteMetadata } from "@/lib/seo/metadata";
import { BreadcrumbTrail } from "@/components/marketing/BreadcrumbTrail";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";

export const metadata: Metadata = constructSiteMetadata({
  title: "Deterministic 60Hz Game Engine Architecture — ARCADE_",
  description:
    "Why we decoupled physics simulation from browser display refresh rates using a fixed 60Hz accumulator loop and seeded PRNG sequences.",
  path: "/case-studies/deterministic-game-engine",
});

export default function DeterministicGameEngineStudy() {
  return (
    <div className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-16)" }}>
      <BreadcrumbTrail
        items={[
          { label: "CASE STUDIES", href: "/case-studies" },
          { label: "DETERMINISTIC 60HZ ENGINE" },
        ]}
      />

      <article style={{ maxWidth: "840px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "36px", borderBottom: "1px solid var(--color-surface-border)", paddingBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 800,
                color: "var(--arcade-cyan)",
                backgroundColor: "rgba(77, 232, 232, 0.12)",
                border: "1px solid rgba(77, 232, 232, 0.3)",
                padding: "3px 10px",
                borderRadius: "4px",
                textTransform: "uppercase",
              }}
            >
              ENGINE STUDY #01
            </span>
            <span style={{ color: "var(--color-text-muted)" }}>•</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--color-text-dim)", fontSize: "13px", fontFamily: "var(--font-mono)" }}>
              <Clock size={14} /> 8 min read
            </span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "clamp(22px, 3.5vw, 34px)",
              fontWeight: 900,
              color: "#FFFFFF",
              marginBottom: "14px",
              lineHeight: 1.25,
            }}
          >
            DETERMINISTIC 60HZ ENGINE ARCHITECTURE
          </h1>

          <p style={{ fontSize: "16px", color: "var(--color-text-dim)", lineHeight: 1.6 }}>
            Decoupling numerical simulation from browser frame rates to eliminate physics tunneling, floating-point drift, and non-deterministic divergence across 60Hz, 144Hz, and 240Hz monitors.
          </p>
        </div>

        {/* Deep Dive Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px", fontSize: "15px", color: "var(--color-text)", lineHeight: 1.75 }}>
          <section
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-surface-border)",
              borderRadius: "8px",
              padding: "24px 28px",
            }}
          >
            <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "20px", fontWeight: 800, color: "#FFFFFF", marginBottom: "14px" }}>
              1. The Vulnerability of Variable Delta Time
            </h2>
            <p style={{ color: "var(--color-text-dim)", marginBottom: "14px" }}>
              Most naive HTML5 Canvas games link physical updates directly to the elapsed time between browser animation frames:
            </p>
            <div style={{ backgroundColor: "#070b14", border: "1px solid rgba(255, 92, 138, 0.3)", borderRadius: "6px", padding: "14px 18px", marginBottom: "14px" }}>
              <code style={{ color: "var(--arcade-pink)", fontFamily: "var(--font-mono)", fontSize: "13px" }}>
                position.x += velocity.x * deltaTime; // Flawed approach
              </code>
            </div>
            <p style={{ color: "var(--color-text-dim)" }}>
              On a 60Hz display, <code>deltaTime ≈ 16.6ms</code>. On a 144Hz monitor, <code>deltaTime ≈ 6.94ms</code>. On a 240Hz monitor, it drops to <code>≈ 4.16ms</code>. When a background tab throttles or CPU spikes occur, <code>deltaTime</code> can jump to <code>250ms+</code>. This creates two catastrophic failure modes:
            </p>
            <ul style={{ paddingLeft: "20px", marginTop: "10px", color: "var(--color-text-dim)", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><strong>Collision Tunneling:</strong> A projectile moving at high velocity leaps over solid bounding boxes in a single oversized frame step.</li>
              <li><strong>Simulation Non-Determinism:</strong> Two players executing the exact same keystrokes on different monitors will experience divergent game states due to floating-point truncation differences.</li>
            </ul>
          </section>

          <section
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-surface-border)",
              borderRadius: "8px",
              padding: "24px 28px",
            }}
          >
            <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "20px", fontWeight: 800, color: "#FFFFFF", marginBottom: "14px" }}>
              2. The Fixed 60Hz Accumulator Model
            </h2>
            <p style={{ color: "var(--color-text-dim)", marginBottom: "14px" }}>
              ARCADE_ enforces a strict separation between <em>simulation ticks</em> and <em>visual render passes</em>. The engine maintains a real-time delta accumulator, consuming it in discrete, invariant quantum slices:
            </p>
            <div style={{ backgroundColor: "#070b14", border: "1px solid rgba(77, 232, 232, 0.3)", borderRadius: "6px", padding: "16px 20px", overflowX: "auto" }}>
              <pre style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--arcade-cyan)", lineHeight: 1.55 }}>
                <code>{`export class GameLoop {
  private readonly FIXED_DT = 1 / 60; // Invariant 16.6667ms
  private accumulator = 0;
  private lastTimestamp = 0;

  public tick(timestamp: number): void {
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    
    // Clamp delta to 250ms to prevent "spiral of death" stalls
    const rawDelta = Math.min((timestamp - this.lastTimestamp) / 1000, 0.25);
    this.lastTimestamp = timestamp;
    this.accumulator += rawDelta;

    // Discrete simulation steps
    while (this.accumulator >= this.FIXED_DT) {
      this.game.update(this.FIXED_DT);
      this.accumulator -= this.FIXED_DT;
    }

    // Single visual rasterization pass
    this.game.render(this.renderer);
  }
}`}</code>
              </pre>
            </div>
          </section>

          <section
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-surface-border)",
              borderRadius: "8px",
              padding: "24px 28px",
            }}
          >
            <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "20px", fontWeight: 800, color: "#FFFFFF", marginBottom: "14px" }}>
              3. Deterministic Mulberry32 PRNG
            </h2>
            <p style={{ color: "var(--color-text-dim)", marginBottom: "14px" }}>
              JavaScript's built-in <code>Math.random()</code> cannot be seeded and varies between browser engines (V8 vs SpiderMonkey vs JavaScriptCore). ARCADE_ implements a standalone Mulberry32 32-bit PRNG generator.
            </p>
            <div style={{ backgroundColor: "#070b14", border: "1px solid rgba(255, 216, 77, 0.3)", borderRadius: "6px", padding: "16px 20px", overflowX: "auto" }}>
              <pre style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--arcade-yellow)", lineHeight: 1.55 }}>
                <code>{`export class RandomSource {
  private state: number;

  constructor(seed: number = 1337) {
    this.state = seed >>> 0;
  }

  public nextFloat(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }
}`}</code>
              </pre>
            </div>
          </section>
        </div>

        {/* Back Link */}
        <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid var(--color-surface-border)" }}>
          <Link
            href="/case-studies"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--arcade-cyan)",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={16} />
            <span>BACK TO ALL CASE STUDIES</span>
          </Link>
        </div>
      </article>
    </div>
  );
}
