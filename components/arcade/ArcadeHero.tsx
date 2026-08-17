"use client";

import React from "react";
import { Search } from "lucide-react";

export interface ArcadeHeroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedPlatform: string;
  onPlatformChange: (p: string) => void;
  /** "arcade" (default yellow) | "labs" (purple) */
  variant?: "arcade" | "labs";
}


/* ─────────────── Pixel Art SVG Components ─────────────── */

const PixelRocket = ({
  size = 60,
  flip = false,
  rotate = 0,
  color = "#b0b8d0",
}: {
  size?: number;
  flip?: boolean;
  rotate?: number;
  color?: string;
}) => (
  <svg
    width={size}
    height={size * 1.6}
    viewBox="0 0 10 16"
    style={{
      imageRendering: "pixelated",
      transform: `rotate(${rotate}deg) scaleX(${flip ? -1 : 1})`,
    }}
  >
    {/* Body */}
    <rect x="3" y="3" width="4" height="8" fill={color} />
    {/* Nose */}
    <rect x="4" y="1" width="2" height="2" fill={color} />
    <rect x="4" y="0" width="2" height="1" fill="#ffffff" />
    {/* Window */}
    <rect x="4" y="5" width="2" height="2" fill="#4de8e8" />
    {/* Fins */}
    <rect x="2" y="9" width="2" height="3" fill={color} />
    <rect x="6" y="9" width="2" height="3" fill={color} />
    {/* Flame */}
    <rect x="4" y="12" width="2" height="2" fill="#ffd84d" />
    <rect x="4" y="14" width="2" height="1" fill="#ff9f43" />
    <rect x="3" y="13" width="1" height="1" fill="#ff9f43" />
    <rect x="6" y="13" width="1" height="1" fill="#ff9f43" />
  </svg>
);

const PixelPlanet = ({ size = 70 }: { size?: number }) => (
  <svg width={size * 1.4} height={size * 1.6} viewBox="0 0 20 24" style={{ imageRendering: "pixelated" }}>
    {/* Planet body */}
    <rect x="6" y="2" width="8" height="2" fill="#4a6fd4" />
    <rect x="4" y="4" width="12" height="2" fill="#5578e0" />
    <rect x="3" y="6" width="14" height="2" fill="#5578e0" />
    <rect x="3" y="8" width="14" height="2" fill="#4a6fd4" />
    <rect x="4" y="10" width="12" height="2" fill="#3d5ec2" />
    <rect x="6" y="12" width="8" height="2" fill="#3d5ec2" />
    {/* Craters / detail */}
    <rect x="7" y="6" width="2" height="2" fill="#3a5ab0" />
    <rect x="12" y="9" width="2" height="2" fill="#3a5ab0" />
    {/* Sign posts */}
    <rect x="9" y="1" width="1" height="3" fill="#8b7355" />
    <rect x="7" y="0" width="6" height="2" fill="#ffd84d" />
    <rect x="12" y="3" width="1" height="3" fill="#8b7355" />
    <rect x="10" y="2" width="6" height="2" fill="#63e66d" />
  </svg>
);

const PixelHelm = ({ size = 70 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" style={{ imageRendering: "pixelated" }}>
    {/* Outer ring */}
    <rect x="7" y="1" width="6" height="2" fill="#c8862a" />
    <rect x="4" y="3" width="2" height="2" fill="#c8862a" />
    <rect x="14" y="3" width="2" height="2" fill="#c8862a" />
    <rect x="2" y="5" width="2" height="4" fill="#c8862a" />
    <rect x="16" y="5" width="2" height="4" fill="#c8862a" />
    <rect x="2" y="11" width="2" height="4" fill="#c8862a" />
    <rect x="16" y="11" width="2" height="4" fill="#c8862a" />
    <rect x="4" y="15" width="2" height="2" fill="#c8862a" />
    <rect x="14" y="15" width="2" height="2" fill="#c8862a" />
    <rect x="7" y="17" width="6" height="2" fill="#c8862a" />
    {/* Inner hub */}
    <rect x="8" y="7" width="4" height="6" fill="#e09c3a" />
    <rect x="7" y="8" width="6" height="4" fill="#e09c3a" />
    {/* Spokes */}
    <rect x="9" y="3" width="2" height="5" fill="#d48e30" />
    <rect x="9" y="12" width="2" height="5" fill="#d48e30" />
    <rect x="3" y="9" width="5" height="2" fill="#d48e30" />
    <rect x="12" y="9" width="5" height="2" fill="#d48e30" />
    <rect x="4" y="4" width="3" height="3" fill="#d48e30" />
    <rect x="13" y="4" width="3" height="3" fill="#d48e30" />
    <rect x="4" y="13" width="3" height="3" fill="#d48e30" />
    <rect x="13" y="13" width="3" height="3" fill="#d48e30" />
  </svg>
);

const PixelCompass = ({ size = 55 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: "pixelated" }}>
    <rect x="4" y="0" width="8" height="2" fill="#2e5fa3" />
    <rect x="2" y="2" width="12" height="2" fill="#3a72c4" />
    <rect x="1" y="4" width="14" height="8" fill="#3a72c4" />
    <rect x="2" y="12" width="12" height="2" fill="#3a72c4" />
    <rect x="4" y="14" width="8" height="2" fill="#2e5fa3" />
    {/* Inner face */}
    <rect x="3" y="5" width="10" height="6" fill="#e8edf8" />
    {/* Needle */}
    <rect x="7" y="5" width="2" height="3" fill="#e84040" />
    <rect x="7" y="8" width="2" height="3" fill="#404040" />
  </svg>
);

const SparkPlus = ({ color = "#ff5c8a", size = 14 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 6 6" style={{ imageRendering: "pixelated" }}>
    <rect x="2" y="0" width="2" height="6" fill={color} />
    <rect x="0" y="2" width="6" height="2" fill={color} />
  </svg>
);

const DiamondStar = ({ color = "#ffffff", size = 8 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 4 4" style={{ imageRendering: "pixelated" }}>
    <rect x="1" y="0" width="2" height="1" fill={color} />
    <rect x="0" y="1" width="4" height="2" fill={color} />
    <rect x="1" y="3" width="2" height="1" fill={color} />
  </svg>
);

/* ─────────────── Floating Elements with CSS Animations ─────────────── */

const FloatingElement = ({
  children,
  animName,
  duration,
  delay = 0,
  style = {},
}: {
  children: React.ReactNode;
  animName: string;
  duration: number;
  delay?: number;
  style?: React.CSSProperties;
}) => (
  <div
    style={{
      position: "absolute",
      animation: `${animName} ${duration}s ease-in-out ${delay}s infinite`,
      ...style,
    }}
  >
    {children}
  </div>
);

/* ─────────────── Main Hero ─────────────── */

export const ArcadeHero: React.FC<ArcadeHeroProps> = ({
  searchQuery,
  onSearchChange,
  selectedPlatform,
  onPlatformChange,
}) => {
  const accent = "#ffd84d";
  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        paddingTop: "clamp(48px, 6vw, 68px)",
        paddingBottom: "clamp(36px, 5vw, 52px)",
        textAlign: "center",
        overflow: "hidden",
        /* 100% full-width ambient radial glow that softly fades into background transparent on all sides */
        background: "radial-gradient(ellipse 75% 65% at 50% 45%, rgba(22, 44, 88, 0.28) 0%, rgba(13, 27, 62, 0.08) 55%, transparent 100%)",
        border: "none",
        outline: "none",
      }}
    >
      {/* ── Star field dots ── */}
      {[
        { top: "8%", left: "12%" }, { top: "15%", left: "32%" },
        { top: "6%", left: "55%" }, { top: "20%", left: "74%" },
        { top: "35%", left: "88%" }, { top: "72%", left: "90%" },
        { top: "80%", left: "65%" }, { top: "85%", left: "20%" },
        { top: "70%", left: "8%" }, { top: "50%", left: "4%" },
        { top: "40%", left: "95%" }, { top: "55%", left: "48%" },
        { top: "25%", left: "18%" }, { top: "90%", left: "42%" },
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: pos.top,
            left: pos.left,
            width: i % 3 === 0 ? "2px" : "1px",
            height: i % 3 === 0 ? "2px" : "1px",
            backgroundColor: i % 4 === 0 ? accent : "#ffffff",
            borderRadius: "50%",
            opacity: 0.4 + (i % 3) * 0.15,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* ── Sparkle crosses ── */}
      <FloatingElement animName="sparkFloat" duration={3.2} delay={0} style={{ top: "12%", left: "22%", opacity: 0.85 }}>
        <SparkPlus color="#ff5c8a" size={16} />
      </FloatingElement>
      <FloatingElement animName="sparkFloat" duration={2.8} delay={0.6} style={{ top: "28%", left: "82%", opacity: 0.9 }}>
        <SparkPlus color="#ffd84d" size={12} />
      </FloatingElement>
      <FloatingElement animName="sparkFloat" duration={3.6} delay={1.2} style={{ top: "75%", left: "25%", opacity: 0.7 }}>
        <SparkPlus color="#ff5c8a" size={14} />
      </FloatingElement>
      <FloatingElement animName="sparkFloat" duration={2.5} delay={0.3} style={{ top: "65%", left: "70%", opacity: 0.8 }}>
        <SparkPlus color="#4de8e8" size={10} />
      </FloatingElement>
      <FloatingElement animName="sparkFloat" duration={3.0} delay={1.8} style={{ top: "82%", left: "55%", opacity: 0.6 }}>
        <SparkPlus color="#ffd84d" size={12} />
      </FloatingElement>

      {/* ── Diamond stars ── */}
      <FloatingElement animName="twinkle" duration={2.2} delay={0.4} style={{ top: "18%", left: "42%", opacity: 0.9 }}>
        <DiamondStar color="#4de8e8" size={10} />
      </FloatingElement>
      <FloatingElement animName="twinkle" duration={1.8} delay={0.9} style={{ top: "60%", left: "15%", opacity: 0.7 }}>
        <DiamondStar color="#ffd84d" size={8} />
      </FloatingElement>
      <FloatingElement animName="twinkle" duration={2.6} delay={0.1} style={{ top: "40%", left: "88%", opacity: 0.8 }}>
        <DiamondStar color="#ffffff" size={9} />
      </FloatingElement>

      {/* ── Left: Steering Wheel / Helm ── */}
      <FloatingElement animName="helmSpin" duration={12} delay={0} style={{ top: "12%", left: "4%", opacity: 0.95 }}>
        <PixelHelm size={72} />
      </FloatingElement>

      {/* ── Left: Compass Badge ── */}
      <FloatingElement animName="floatY" duration={4.2} delay={0.8} style={{ top: "54%", left: "6%", opacity: 0.9 }}>
        <PixelCompass size={56} />
      </FloatingElement>

      {/* ── Right: Planet with signs ── */}
      <FloatingElement animName="floatY" duration={5} delay={0.3} style={{ top: "6%", right: "14%", opacity: 0.95 }}>
        <PixelPlanet size={64} />
      </FloatingElement>

      {/* ── Rockets ── */}
      <FloatingElement animName="rocketDrift" duration={7} delay={0} style={{ top: "4%", right: "6%", opacity: 0.9 }}>
        <PixelRocket size={34} rotate={-20} color="#c0c8e0" />
      </FloatingElement>
      <FloatingElement animName="rocketDrift" duration={9} delay={1.5} style={{ top: "42%", right: "4%", opacity: 0.85 }}>
        <PixelRocket size={26} rotate={10} flip color="#a0a8c0" />
      </FloatingElement>
      <FloatingElement animName="rocketDrift" duration={6} delay={0.8} style={{ top: "68%", right: "8%", opacity: 0.9 }}>
        <PixelRocket size={36} rotate={-35} color="#c8d0e8" />
      </FloatingElement>
      <FloatingElement animName="rocketDrift" duration={8} delay={2} style={{ top: "20%", left: "14%", opacity: 0.7 }}>
        <PixelRocket size={22} rotate={15} flip color="#9099b8" />
      </FloatingElement>

      {/* ── Central Hero Content ── */}
      <div style={{ position: "relative", zIndex: 10, maxWidth: "720px", margin: "0 auto" }}>

        {/* Marquee Title with Seamless Subtle Frame */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            padding: "20px clamp(24px, 4vw, 48px)",
            marginBottom: "16px",
            borderRadius: "6px",
            border: "1px solid rgba(255, 216, 77, 0.25)",
            backgroundColor: "rgba(10, 16, 30, 0.4)",
            boxShadow: "0 0 30px rgba(255, 216, 77, 0.08), inset 0 0 20px rgba(13, 27, 62, 0.3)",
          }}
        >
          {/* Subtle Corner Brackets for authentic Arcade Marquee */}
          <div style={{ position: "absolute", top: "-2px", left: "-2px", width: "8px", height: "8px", borderTop: "2px solid #ffd84d", borderLeft: "2px solid #ffd84d" }} />
          <div style={{ position: "absolute", top: "-2px", right: "-2px", width: "8px", height: "8px", borderTop: "2px solid #ffd84d", borderRight: "2px solid #ffd84d" }} />
          <div style={{ position: "absolute", bottom: "-2px", left: "-2px", width: "8px", height: "8px", borderBottom: "2px solid #ffd84d", borderLeft: "2px solid #ffd84d" }} />
          <div style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "8px", height: "8px", borderBottom: "2px solid #ffd84d", borderRight: "2px solid #ffd84d" }} />

          {/* Title */}
          <h1
            style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "clamp(24px, 4.5vw, 50px)",
              fontWeight: 900,
              color: accent,
              letterSpacing: "0.06em",
              lineHeight: 1.1,
              textShadow: "0 0 16px rgba(255, 216, 77, 0.4), 3px 3px 0px rgba(0,0,0,0.8)",
              margin: 0,
            }}
          >
            THE ARCADE<span className="morse-cursor-underscore" style={{ color: "#ff5c8a" }} title="Morse Code: A · R · C · A · D · E">_</span>
          </h1>
        </div>

        {/* Subtitle — clean white sans-serif */}
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(14px, 1.8vw, 17px)",
            fontWeight: 400,
            color: "rgba(255,255,255,0.85)",
            letterSpacing: "0.01em",
            marginBottom: "28px",
            lineHeight: 1.5,
          }}
        >
          60 deterministic cartridges · zero ROMs · pure TypeScript mathematics
        </p>

        {/* Search bar */}
        <div
          id="arcade-grid-section"
          style={{
            maxWidth: "540px",
            margin: "0 auto",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "18px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#4de8e8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              zIndex: 2,
              filter: "drop-shadow(0 0 6px rgba(77, 232, 232, 0.6))",
            }}
          >
            <Search size={18} strokeWidth={2.5} />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search 60 cartridges — hotlap, tetris, physics, retro..."
            style={{
              width: "100%",
              padding: "14px 20px 14px 48px",
              fontSize: "14px",
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              backgroundColor: "rgba(12, 19, 36, 0.75)",
              color: "#ffffff",
              border: "1px solid rgba(77, 232, 232, 0.3)",
              borderRadius: "6px",
              backdropFilter: "blur(12px)",
              boxShadow: "0 6px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
              outline: "none",
            }}
          />

          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              style={{
                position: "absolute",
                right: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.6)",
                fontSize: "14px",
                backgroundColor: "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* CSS animations injected inline */}
      <style dangerouslySetInnerHTML={{ __html: HERO_ANIMATIONS }} />
    </section>
  );
};

/* ─────────────── Dotted Pixel Border Component ─────────────── */
const DottedBorder = () => {
  const dotColor = "rgba(255,255,255,0.55)";
  const dotSize = 4;
  const gap = 10;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    >
      {/* Rendered via CSS border-image trick with SVG data URL */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: "3px dashed rgba(255,255,255,0.4)",
          borderRadius: "4px",
          /* Override dashes to look pixel-chunky */
          borderStyle: "dashed",
        }}
      />
    </div>
  );
};

/* ─────────────── Animation Keyframes ─────────────── */
const HERO_ANIMATIONS = `
  @keyframes floatY {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes sparkFloat {
    0%, 100% { transform: translateY(0px) scale(1); opacity: 0.85; }
    50% { transform: translateY(-8px) scale(1.15); opacity: 0.6; }
  }

  @keyframes twinkle {
    0%, 100% { opacity: 0.9; transform: scale(1); }
    50% { opacity: 0.2; transform: scale(0.6); }
  }

  @keyframes rocketDrift {
    0%, 100% { transform: translateY(0px) translateX(0px); }
    33% { transform: translateY(-12px) translateX(4px); }
    66% { transform: translateY(-6px) translateX(-3px); }
  }

  @keyframes helmSpin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes morseArcadeBlink {
    /* Morse code sequence for "A-R-C-A-D-E" across 58 standard timing units */
    /* A: . (0-1.72% ON), - (3.45-8.62% ON) */
    0%, 1.72% { opacity: 1; text-shadow: 0 0 3px rgba(255, 92, 138, 0.4), 2px 2px 0px rgba(0, 0, 0, 0.6); }
    1.73%, 3.45% { opacity: 0; text-shadow: none; }
    3.46%, 8.62% { opacity: 1; text-shadow: 0 0 3px rgba(255, 92, 138, 0.4), 2px 2px 0px rgba(0, 0, 0, 0.6); }
    8.63%, 13.79% { opacity: 0; text-shadow: none; }
    
    /* R: . (13.79-15.52% ON), - (17.24-22.41% ON), . (24.14-25.86% ON) */
    13.80%, 15.52% { opacity: 1; text-shadow: 0 0 3px rgba(255, 92, 138, 0.4), 2px 2px 0px rgba(0, 0, 0, 0.6); }
    15.53%, 17.24% { opacity: 0; text-shadow: none; }
    17.25%, 22.41% { opacity: 1; text-shadow: 0 0 3px rgba(255, 92, 138, 0.4), 2px 2px 0px rgba(0, 0, 0, 0.6); }
    22.42%, 24.14% { opacity: 0; text-shadow: none; }
    24.15%, 25.86% { opacity: 1; text-shadow: 0 0 3px rgba(255, 92, 138, 0.4), 2px 2px 0px rgba(0, 0, 0, 0.6); }
    25.87%, 31.03% { opacity: 0; text-shadow: none; }
    
    /* C: - (31.03-36.21% ON), . (37.93-39.66% ON), - (41.38-46.55% ON), . (48.28-50.00% ON) */
    31.04%, 36.21% { opacity: 1; text-shadow: 0 0 3px rgba(255, 92, 138, 0.4), 2px 2px 0px rgba(0, 0, 0, 0.6); }
    36.22%, 37.93% { opacity: 0; text-shadow: none; }
    37.94%, 39.66% { opacity: 1; text-shadow: 0 0 3px rgba(255, 92, 138, 0.4), 2px 2px 0px rgba(0, 0, 0, 0.6); }
    39.67%, 41.38% { opacity: 0; text-shadow: none; }
    41.39%, 46.55% { opacity: 1; text-shadow: 0 0 3px rgba(255, 92, 138, 0.4), 2px 2px 0px rgba(0, 0, 0, 0.6); }
    46.56%, 48.28% { opacity: 0; text-shadow: none; }
    48.29%, 50.00% { opacity: 1; text-shadow: 0 0 3px rgba(255, 92, 138, 0.4), 2px 2px 0px rgba(0, 0, 0, 0.6); }
    50.01%, 55.17% { opacity: 0; text-shadow: none; }
    
    /* A: . (55.17-56.90% ON), - (58.62-63.79% ON) */
    55.18%, 56.90% { opacity: 1; text-shadow: 0 0 3px rgba(255, 92, 138, 0.4), 2px 2px 0px rgba(0, 0, 0, 0.6); }
    56.91%, 58.62% { opacity: 0; text-shadow: none; }
    58.63%, 63.79% { opacity: 1; text-shadow: 0 0 3px rgba(255, 92, 138, 0.4), 2px 2px 0px rgba(0, 0, 0, 0.6); }
    63.80%, 68.97% { opacity: 0; text-shadow: none; }
    
    /* D: - (68.97-74.14% ON), . (75.86-77.59% ON), . (79.31-81.03% ON) */
    68.98%, 74.14% { opacity: 1; text-shadow: 0 0 3px rgba(255, 92, 138, 0.4), 2px 2px 0px rgba(0, 0, 0, 0.6); }
    74.15%, 75.86% { opacity: 0; text-shadow: none; }
    75.87%, 77.59% { opacity: 1; text-shadow: 0 0 3px rgba(255, 92, 138, 0.4), 2px 2px 0px rgba(0, 0, 0, 0.6); }
    77.60%, 79.31% { opacity: 0; text-shadow: none; }
    79.32%, 81.03% { opacity: 1; text-shadow: 0 0 3px rgba(255, 92, 138, 0.4), 2px 2px 0px rgba(0, 0, 0, 0.6); }
    81.04%, 86.21% { opacity: 0; text-shadow: none; }
    
    /* E: . (86.21-87.93% ON), Word End Pause (87.93-100% OFF) */
    86.22%, 87.93% { opacity: 1; text-shadow: 0 0 3px rgba(255, 92, 138, 0.4), 2px 2px 0px rgba(0, 0, 0, 0.6); }
    87.94%, 100% { opacity: 0; text-shadow: none; }
  }

  .morse-cursor-underscore {
    display: inline-block;
    color: #ff5c8a;
    animation: morseArcadeBlink 6.5s infinite linear;
    transform: translateY(-2px);
  }
`;
