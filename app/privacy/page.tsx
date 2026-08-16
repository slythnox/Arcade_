import React from 'react';

export default function PrivacyPage() {
  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#080B12',
      color: 'var(--color-text-dim, #ccc)',
      fontFamily: 'var(--font-sans, sans-serif)',
      padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem)',
      lineHeight: 1.6
    }}>
      <div style={{ maxWidth: 'min(960px, 94vw)', margin: '0 auto' }}>
        <header style={{ marginBottom: 'clamp(2rem, 4vw, 4rem)', textAlign: 'center' }}>
          <h1 style={{
            fontFamily: 'var(--font-pixel, monospace)',
            color: 'var(--arcade-cyan, #4DE8E8)',
            fontSize: 'clamp(1.3rem, 3.5vw, 2.2rem)',
            marginBottom: '1rem',
            textShadow: '2px 2px 0px rgba(77,232,232,0.3)',
            lineHeight: 1.3
          }}>PRIVACY MANIFESTO</h1>
          <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.9rem' }}>
            LAST UPDATED: AUGUST 2026
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
