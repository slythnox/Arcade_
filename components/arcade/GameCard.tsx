"use client";

import React from "react";
import Link from "next/link";
import { GameDefinition } from "@/games/types";
import { GameIllustration, getGameTheme } from "./GameIllustration";

export interface GameCardProps {
  game: GameDefinition;
  isFeatured?: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const theme = getGameTheme(game);

  return (
    <div
      className="arcade-game-card"
      style={
        {
          "--card-accent": theme.primary,
          "--card-glow": theme.glow,
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: "320px",
          border: `1px solid ${theme.primary}33`,
          background: `linear-gradient(180deg, #101626 0%, #090d18 100%)`,
          borderRadius: "8px",
        } as React.CSSProperties
      }
    >
      {/* Top Section */}
      <div>
        {/* Top Badges */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "14px",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: theme.primary,
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: `1px solid ${theme.primary}55`,
              padding: "3px 8px",
              borderRadius: "4px",
            }}
          >
            {game.genre}
          </span>
          <span
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--color-text-muted)",
              letterSpacing: "0.05em",
            }}
          >
            {game.year}
          </span>
        </div>

        {/* Central Saturated Pixel Art Illustration */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          <GameIllustration game={game} size={140} />
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: "19px",
            color: "#FFFFFF",
            fontFamily: "var(--font-sans)",
            fontWeight: 800,
            marginBottom: "6px",
            letterSpacing: "-0.02em",
          }}
        >
          {game.name}
        </h3>

        {/* Tagline */}
        <p
          style={{
            fontSize: "13px",
            color: "var(--color-text-dim)",
            lineHeight: 1.45,
            marginBottom: "18px",
          }}
        >
          {game.tagline}
        </p>
      </div>

      {/* Saturated Hot Pink Capsule START! Button */}
      <div>
        <Link
          href={`/games/${game.slug}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "12px 18px",
            background: "linear-gradient(180deg, #ff5c8a 0%, #ff3b77 100%)",
            color: "#ffffff",
            fontFamily: "var(--font-pixel)",
            fontSize: "12px",
            fontWeight: 900,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            textDecoration: "none",
            borderRadius: "10px",
            borderTop: "1px solid rgba(255, 255, 255, 0.4)",
            borderBottom: "2px solid #b81446",
            boxShadow: "0 6px 18px rgba(255, 92, 138, 0.35), 0 2px 4px rgba(0, 0, 0, 0.5)",
            transition: "all 0.15s ease",
            textShadow: "1px 1px 0px rgba(0, 0, 0, 0.35)",
          }}
          className="start-game-btn"
        >
          <span>START!</span>
        </Link>
      </div>
    </div>
  );
};
