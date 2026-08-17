import React from "react";
import type { Metadata } from "next";
import { constructSiteMetadata } from "@/lib/seo/metadata";
import { BreadcrumbTrail } from "@/components/marketing/BreadcrumbTrail";

export const metadata: Metadata = constructSiteMetadata({
  title: "Privacy Manifesto & Trust Policy — ARCADE_",
  description: "Privacy manifesto, zero-server architecture, and localStorage schema for ARCADE_.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-16)" }}>
      <BreadcrumbTrail items={[{ label: "PRIVACY" }]} />

      <div style={{ maxWidth: "880px", margin: "0 auto" }}>
        <header style={{ marginBottom: "36px", borderBottom: "1px solid var(--color-surface-border)", paddingBottom: "24px" }}>
          <span
            style={{
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              fontWeight: 800,
              color: "var(--arcade-cyan)",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
            }}
          >
            ✦ PRIVACY & DATA TRANSPARENCY
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
            PRIVACY MANIFESTO
          </h1>
          <p style={{ fontSize: "15px", color: "var(--color-text-dim)" }}>
            LAST UPDATED: AUGUST 2026 · ZERO-SERVER ARCHITECTURE
          </p>
        </header>

        <div style={{ display: 'grid', gap: '2rem' }}>
          
          <section style={cardStyle('var(--arcade-green, #63E66D)')}>
            <h2 style={titleStyle('var(--arcade-green, #63E66D)')}>1. Zero-Server Architecture</h2>
            <p>
              ARCADE_ operates entirely on a zero-server architecture. All game logic, state management, and rendering code runs strictly within your local browser environment (client-side). We do not send your gameplay data, inputs, or session information to any remote server.
            </p>
          </section>

          <section style={cardStyle('var(--arcade-pink, #FF5C8A)')}>
            <h2 style={titleStyle('var(--arcade-pink, #FF5C8A)')}>2. localStorage Schema</h2>
            <p>
              To save your high scores and settings between sessions, we utilize your browser's local storage capabilities. The data stored is strictly limited to:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li><code>arcade:v1:scores</code> - Encoded high scores for individual games.</li>
              <li><code>arcade:v1:preferences</code> - Volume levels, CRT filter toggles, and color settings.</li>
            </ul>
          </section>

          <section style={cardStyle('var(--arcade-yellow, #FFD84D)')}>
            <h2 style={titleStyle('var(--arcade-yellow, #FFD84D)')}>3. Analytics</h2>
            <p>
              ARCADE_ uses <strong>Vercel Analytics</strong> for aggregate, anonymous page-view metrics. This collects no personal data, no cookies, and no behavioral profiling. Your gameplay inputs, game state, and in-game events are never transmitted to any server. We do not use Google Analytics, Mixpanel, or any tracking pixels.
            </p>
          </section>

          <section style={cardStyle('var(--arcade-purple, #A879FF)')}>
            <h2 style={titleStyle('var(--arcade-purple, #A879FF)')}>4. No Cookies</h2>
            <p>
              ARCADE_ does not generate, read, or require HTTP cookies for operation. Because we do not authenticate users or track sessions across the web, cookies are obsolete in our architecture.
            </p>
          </section>

          <section style={cardStyle('var(--arcade-cyan, #4DE8E8)')}>
            <h2 style={titleStyle('var(--arcade-cyan, #4DE8E8)')}>5. Web Audio Synthesis</h2>
            <p>
              All sound effects and music are synthetically generated in real-time using the Web Audio API. We do not fetch external audio files that could be used to fingerprint your browser or track your requests.
            </p>
          </section>

          <section style={cardStyle('var(--arcade-pink, #FF5C8A)')}>
            <h2 style={titleStyle('var(--arcade-pink, #FF5C8A)')}>6. GitHub Open Source</h2>
            <p>
              Trust requires transparency. The entirety of ARCADE_'s client-side codebase is open-source and available for public audit. You can verify our privacy claims by inspecting the source code on our <a href="https://github.com/slythnox/Arcade_" style={{ color: 'var(--arcade-pink, #FF5C8A)' }}>GitHub repository</a>.
            </p>
          </section>

          <section style={cardStyle('var(--arcade-yellow, #FFD84D)')}>
            <h2 style={titleStyle('var(--arcade-yellow, #FFD84D)')}>7. Your Rights</h2>
            <p>
              Because all data resides locally on your device, you have absolute control over it. You can exercise your right to be forgotten simply by clearing your browser's local storage or clearing your site data. No requests to our team are necessary.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}

const cardStyle = (color: string): React.CSSProperties => ({
  backgroundColor: 'var(--color-surface, #121826)',
  borderLeft: `4px solid ${color}`,
  padding: '1.5rem',
  borderRadius: '0 8px 8px 0',
  boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
});

const titleStyle = (color: string): React.CSSProperties => ({
  fontFamily: 'var(--font-pixel, monospace)',
  fontSize: '1rem',
  color: color,
  marginBottom: '1rem',
  textTransform: 'uppercase' as const
});
