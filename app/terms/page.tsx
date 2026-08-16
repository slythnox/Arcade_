import React from 'react';

export default function TermsPage() {
  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#080B12',
      color: 'var(--color-text-dim, #ccc)',
      fontFamily: 'var(--font-sans, sans-serif)',
      padding: '4rem 2rem',
      lineHeight: 1.6
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
          <h1 style={{
            fontFamily: 'var(--font-pixel, monospace)',
            color: 'var(--arcade-purple, #A879FF)',
            fontSize: '2rem',
            marginBottom: '1rem',
            textShadow: '2px 2px 0px rgba(168,121,255,0.3)'
          }}>TERMS OF ENGAGEMENT</h1>
          <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.9rem' }}>
            LAST UPDATED: AUGUST 2026
          </p>
        </header>

        <div style={{ display: 'grid', gap: '2rem' }}>
          
          <section style={cardStyle('var(--arcade-cyan, #4DE8E8)')}>
            <h2 style={titleStyle('var(--arcade-cyan, #4DE8E8)')}>1. Platform Access</h2>
            <p>
              ARCADE_ is a free, open platform. Access to our suite of digital experiences requires no user account, no subscription, and no arbitrary paywalls. Your engagement is limited only by your browser's capabilities and your personal bandwidth.
            </p>
          </section>

          <section style={cardStyle('var(--arcade-green, #63E66D)')}>
            <h2 style={titleStyle('var(--arcade-green, #63E66D)')}>2. Original Implementations</h2>
            <p>
              All 61 deterministic cartridges available on this platform are original, from-scratch TypeScript implementations. We do not host, distribute, or run emulated ROMs of copyrighted classic arcade titles. Every line of game logic has been freshly synthesized for the modern web.
            </p>
          </section>

          <section style={cardStyle('var(--arcade-yellow, #FFD84D)')}>
            <h2 style={titleStyle('var(--arcade-yellow, #FFD84D)')}>3. Intellectual Property</h2>
            <p>
              While our games are deeply inspired by the fundamental mechanics of classic arcade cabinets, we do not copy protected code, proprietary assets, or trademarked characters. All art, audio, and code within ARCADE_ belong to their respective creators within our collective.
            </p>
          </section>

          <section style={cardStyle('var(--arcade-pink, #FF5C8A)')}>
            <h2 style={titleStyle('var(--arcade-pink, #FF5C8A)')}>4. Open Source License</h2>
            <p>
              The ARCADE_ platform engine is released under the MIT License. You are free to inspect, fork, and learn from our infrastructure via our <a href="https://github.com/slythnox/Arcade_" style={{ color: 'var(--arcade-pink, #FF5C8A)' }}>public repository</a>. Individual game modules may have separate licensing requirements detailed in their specific directories.
            </p>
          </section>

          <section style={cardStyle('var(--arcade-purple, #A879FF)')}>
            <h2 style={titleStyle('var(--arcade-purple, #A879FF)')}>5. Prohibited Use</h2>
            <p>
              You agree not to aggressively scrape our assets, reverse engineer our obfuscated modules to steal unreleased code without attribution, or use our original engines for commercial deployment without explicit credit and written consent from the core maintainers.
            </p>
          </section>

          <section style={cardStyle('var(--arcade-cyan, #4DE8E8)')}>
            <h2 style={titleStyle('var(--arcade-cyan, #4DE8E8)')}>6. Disclaimer of Warranties</h2>
            <p>
              The digital wilderness is unpredictable. ARCADE_ is provided "as-is" without warranty of any kind. We do not guarantee perfect frame rates across all browser engines or absolute hardware compatibility. You play at your own risk.
            </p>
          </section>

          <section style={cardStyle('var(--arcade-green, #63E66D)')}>
            <h2 style={titleStyle('var(--arcade-green, #63E66D)')}>7. Score & Data Ownership</h2>
            <p>
              Your high scores and configuration data exist exclusively in your browser's local storage. You maintain total ownership of this data. We are not responsible for lost scores due to cache clearing or browser updates.
            </p>
          </section>

          <section style={cardStyle('var(--arcade-yellow, #FFD84D)')}>
            <h2 style={titleStyle('var(--arcade-yellow, #FFD84D)')}>8. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms of Engagement as the platform evolves. Any changes will be reflected in the platform version tag and updated timestamp. Continued use of ARCADE_ constitutes acceptance of any modified terms.
            </p>
          </section>

        </div>
      </div>
    </main>
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
