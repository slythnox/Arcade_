"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NoxMascot } from "@/components/arcade/NoxMascot";

export const SiteFooter: React.FC = () => {
  const pathname = usePathname();

  // Hide footer completely on active game cartridge gameplay pages
  if (pathname && pathname.startsWith("/games/")) {
    return null;
  }

  return (
    <footer
      style={{
        borderTop: "1px solid var(--color-surface-border)",
        backgroundColor: "var(--color-bg-deep)",
        paddingTop: "var(--space-12)",
        paddingBottom: "var(--space-8)",
        marginTop: "var(--space-16)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top accent glow line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "10%",
          right: "10%",
          height: "1px",
          background: "linear-gradient(90deg, transparent 0%, var(--arcade-cyan) 30%, var(--arcade-pink) 70%, transparent 100%)",
          opacity: 0.5,
        }}
      />

      <div className="container">
        {/* Navigation Grid in Footer */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "40px",
            marginBottom: "44px",
          }}
        >
          {/* Brand Info & Nox Mascot */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <NoxMascot size={32} mood="happy" />
              <div
                style={{
                  fontFamily: "var(--font-pixel)",
                  fontSize: "15px",
                  color: "#ffd84d",
                  textShadow: "2px 2px 0px #04060a",
                }}
              >
                THE ARCADE<span style={{ color: "var(--arcade-pink)" }}>_</span>
              </div>
            </div>
            <p
              style={{
                fontSize: "13px",
                color: "var(--color-text-dim)",
                lineHeight: 1.6,
                maxWidth: "340px",
              }}
            >
              A mathematical browser arcade platform built from scratch in TypeScript with 59 deterministic game cartridges, procedural shaders, and zero third-party game frameworks.
            </p>
          </div>

          {/* Engine Architecture */}
          <div>
            <h4
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                fontWeight: 800,
                color: "var(--arcade-cyan)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "14px",
              }}
            >
              Engine Architecture
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
              <Link href="/case-studies" style={{ color: "var(--color-text-dim)" }}>
                Engineering Case Studies
              </Link>
              <Link href="/case-studies/deterministic-game-engine" style={{ color: "var(--color-text-dim)" }}>
                60Hz Fixed Timestep Loop
              </Link>
              <Link href="/case-studies/tetris-matrix-rotations" style={{ color: "var(--color-text-dim)" }}>
                SRS 2D Matrix Rotations
              </Link>
              <Link href="/case-studies/fuzzy-search-ranking" style={{ color: "var(--color-text-dim)" }}>
                Multi-Criteria Fuzzy Search
              </Link>
            </div>
          </div>

          {/* Platform Docs */}
          <div>
            <h4
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                fontWeight: 800,
                color: "var(--arcade-pink)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "14px",
              }}
            >
              Platform Docs
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
              <Link href="/about" style={{ color: "var(--color-text-dim)" }}>
                About Platform
              </Link>
              <Link href="/faq" style={{ color: "var(--color-text-dim)" }}>
                Engineering FAQ
              </Link>
              <Link href="/contact" style={{ color: "var(--color-text-dim)" }}>
                Contact & Dispatch
              </Link>
              <Link href="/privacy" style={{ color: "var(--color-text-dim)" }}>
                Privacy Statement
              </Link>
              <Link href="/terms" style={{ color: "var(--color-text-dim)" }}>
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: "1px solid var(--color-surface-border)",
            paddingTop: "24px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            fontSize: "12px",
            color: "var(--color-text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <div>
            © {new Date().getFullYear()} ARCADE_. 100% ORIGINAL IMPLEMENTATIONS. ZERO ROMS.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--arcade-green)",
                display: "inline-block",
                boxShadow: "0 0 10px var(--arcade-green)",
              }}
            />
            <span style={{ color: "var(--arcade-green)", fontWeight: 700 }}>
              84 DETERMINISTIC CARTRIDGES · 60HZ FIXED ACCUMULATOR
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
