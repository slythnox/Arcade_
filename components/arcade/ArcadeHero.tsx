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
  variant = "arcade",
}) => {
  const isLabs = variant === "labs";
  const accent = isLabs ? "#a879ff" : "#ffd84d";
  const accentDim = isLabs ? "rgba(168,121,255,0.35)" : "rgba(255,216,77,0.35)";
  const accentGlow = isLabs ? "rgba(168,121,255,0.6)" : "rgba(255,216,77,0.6)";
  return (
    <section
      style={{
        position: "relative",
        paddingTop: "72px",
        paddingBottom: "56px",
        textAlign: "center",
        overflow: "hidden",
        /* Deep navy space — matching Google Arcade */
        background: isLabs
          ? "radial-gradient(ellipse 120% 80% at 50% 60%, #130a2a 0%, #0d0820 45%, #060e1c 100%)"
          : "radial-gradient(ellipse 120% 80% at 50% 60%, #0d1b3e 0%, #0a1628 45%, #060e1c 100%)",
        marginLeft: "calc(-1 * var(--space-6))",
        marginRight: "calc(-1 * var(--space-6))",
        paddingLeft: "var(--space-6)",
        paddingRight: "var(--space-6)",
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
      <FloatingElement animName="helmSpin" duration={12} delay={0} style={{ top: "15%", left: "3%", opacity: 0.95 }}>
        <PixelHelm size={80} />
      </FloatingElement>

      {/* ── Left: Compass Badge ── */}
      <FloatingElement animName="floatY" duration={4.2} delay={0.8} style={{ top: "55%", left: "5%", opacity: 0.9 }}>
        <PixelCompass size={60} />
      </FloatingElement>

      {/* ── Right: Planet with signs ── */}
      <FloatingElement animName="floatY" duration={5} delay={0.3} style={{ top: "8%", right: "18%", opacity: 0.95 }}>
        <PixelPlanet size={68} />
      </FloatingElement>

      {/* ── Rockets ── */}
      <FloatingElement animName="rocketDrift" duration={7} delay={0} style={{ top: "5%", right: "5%", opacity: 0.9 }}>
        <PixelRocket size={36} rotate={-20} color="#c0c8e0" />
      </FloatingElement>
      <FloatingElement animName="rocketDrift" duration={9} delay={1.5} style={{ top: "42%", right: "3%", opacity: 0.85 }}>
        <PixelRocket size={28} rotate={10} flip color="#a0a8c0" />
      </FloatingElement>
      <FloatingElement animName="rocketDrift" duration={6} delay={0.8} style={{ top: "68%", right: "8%", opacity: 0.9 }}>
        <PixelRocket size={40} rotate={-35} color="#c8d0e8" />
      </FloatingElement>
      <FloatingElement animName="rocketDrift" duration={8} delay={2} style={{ top: "22%", left: "14%", opacity: 0.7 }}>
        <PixelRocket size={22} rotate={15} flip color="#9099b8" />
      </FloatingElement>

      {/* ── Central Hero Content ── */}
      <div style={{ position: "relative", zIndex: 10 }}>

        {/* Dotted pixel border box around title */}
        <div
          style={{
            display: "inline-block",
            position: "relative",
            padding: "28px 52px 24px",
            marginBottom: "20px",
          }}
        >
          {/* Dotted border SVG — top */}
          <DottedBorder />

          {/* Title */}
          <h1
            style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "clamp(26px, 5vw, 56px)",
              fontWeight: 900,
              color: accent,
              letterSpacing: "0.06em",
              lineHeight: 1.1,
              textShadow: "3px 3px 0px rgba(0,0,0,0.6)",
              margin: 0,
            }}
          >
            {isLabs ? (
              <>ARCADE<span style={{ color: "#4de8e8" }}>_</span>LABS</>
            ) : (
              <>THE ARCADE<span style={{ color: "#ff5c8a" }}>_</span></>
            )}
          </h1>
        </div>

        {/* Subtitle — clean white sans-serif like Google Cloud */}
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(14px, 2vw, 18px)",
            fontWeight: 400,
            color: "rgba(255,255,255,0.85)",
            letterSpacing: "0.01em",
            marginBottom: "32px",
          }}
        >
          {isLabs
            ? "14 mathematical experiments · physics · fractals · algorithms · emergence"
            : "59 deterministic cartridges · zero ROMs · pure TypeScript mathematics"}
        </div>

        {/* Search bar */}
        <div
          id="arcade-grid-section"
          style={{
            maxWidth: "580px",
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
              color: isLabs ? "#a879ff" : "#4de8e8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              zIndex: 2,
              filter: isLabs ? "drop-shadow(0 0 6px rgba(168,121,255,0.6))" : "drop-shadow(0 0 6px rgba(77, 232, 232, 0.6))",
            }}
          >
            <Search size={20} strokeWidth={2.5} />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={isLabs
              ? "Search experiments — fractals, gravity, cellular..."
              : "Search 59 cartridges — tetris, physics, retro, 1989..."}
            style={{
              width: "100%",
              padding: "16px 20px 16px 52px",
              fontSize: "14px",
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              backgroundColor: "rgba(10, 18, 36, 0.8)",
              color: "#ffffff",
              border: isLabs ? "1px solid rgba(168, 121, 255, 0.35)" : "1px solid rgba(77, 232, 232, 0.35)",
              borderRadius: "8px",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
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
`;
