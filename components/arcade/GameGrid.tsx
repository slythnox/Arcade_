"use client";

import React from "react";
import type { GameDefinition } from "@/games/types";
import { GameCard } from "./GameCard";
import { NoxMascot } from "./NoxMascot";

export interface GameGridProps {
  games: readonly GameDefinition[];
  title?: string;
  emptyMessage?: string;
  /** Route prefix passed to each GameCard. Defaults to '/games'. */
  cardBasePath?: string;
}

export const GameGrid: React.FC<GameGridProps> = ({
  games,
  title,
  emptyMessage = "NO CARTRIDGES FOUND MATCHING CRITERIA.",
  cardBasePath = "/games",
}) => {
  return (
    <section style={{ marginBottom: "var(--space-16)" }}>
      {title && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--space-6)",
            borderBottom: "1px solid var(--color-surface-border)",
            paddingBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "22px",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </h2>
            <span
              style={{
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                fontWeight: 800,
                color: "var(--arcade-cyan)",
                backgroundColor: "rgba(77, 232, 232, 0.1)",
                border: "1px solid rgba(77, 232, 232, 0.3)",
                padding: "2px 8px",
                borderRadius: "100px",
              }}
            >
              {games.length}
            </span>
          </div>
        </div>
      )}

      {games.length === 0 ? (
        <div
          style={{
            padding: "var(--space-16)",
            textAlign: "center",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-surface-border)",
            borderRadius: "8px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <NoxMascot size={64} mood="sleepy" />
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              color: "var(--color-text-dim)",
              maxWidth: "400px",
            }}
          >
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(clamp(250px, 18vw, 320px), 1fr))",
            gap: "clamp(16px, 1.8vw, 28px)",
          }}
        >
          {games.map((game) => (
            <GameCard key={game.id} game={game} basePath={cardBasePath} />
          ))}
        </div>
      )}
    </section>
  );
};
