"use client";

import React, { useState, useMemo } from "react";
import { gameRegistry } from "@/games/registry";
import { searchGames } from "@/lib/search/searchGames";
import { GameGrid } from "@/components/arcade/GameGrid";
import { PLATFORM_CATEGORIES, GENRE_CATEGORIES } from "@/data/categories";
import { BreadcrumbTrail } from "@/components/marketing/BreadcrumbTrail";
import { Search } from "lucide-react";

export default function GamesPage() {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("all");
  const [genre, setGenre] = useState("all");

  const filteredGames = useMemo(() => {
    const results = searchGames(query, gameRegistry, platform, genre);
    return results.map((r) => r.item);
  }, [query, platform, genre]);

  return (
    <div className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-12)" }}>
      <BreadcrumbTrail items={[{ label: "ALL GAMES" }]} />

      <div style={{ marginBottom: "var(--space-8)" }}>
        <h1
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "28px",
            fontWeight: 900,
            color: "var(--color-text)",
            marginBottom: "8px",
          }}
        >
          BROWSE ALL CARTRIDGES
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-dim)" }}>
          Explore our collection of authentic 1990s retro games built from scratch on our custom 2D engine.
        </p>
      </div>

      {/* Filter Controls Bar */}
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          border: "var(--border-width) solid var(--color-surface-border)",
          boxShadow: "var(--shadow-pixel-sm)",
          padding: "16px 20px",
          marginBottom: "var(--space-8)",
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <div
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-green)",
              pointerEvents: "none",
              display: "flex",
            }}
          >
            <Search size={16} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name, genre, tag, year..."
            style={{
              width: "100%",
              padding: "10px 14px 10px 38px",
              fontSize: "14px",
              fontFamily: "var(--font-mono)",
              backgroundColor: "var(--color-surface-elevated)",
              color: "var(--color-text)",
              border: "1px solid var(--color-surface-border)",
              outline: "none",
            }}
          />
        </div>

        {/* Platform Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--color-muted)", fontFamily: "var(--font-mono)" }}>
            PLATFORM:
          </span>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            style={{
              padding: "8px 12px",
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              backgroundColor: "var(--color-surface-elevated)",
              color: "var(--color-text)",
              border: "1px solid var(--color-surface-border)",
              cursor: "pointer",
            }}
          >
            {PLATFORM_CATEGORIES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Genre Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--color-muted)", fontFamily: "var(--font-mono)" }}>
            GENRE:
          </span>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            style={{
              padding: "8px 12px",
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              backgroundColor: "var(--color-surface-elevated)",
              color: "var(--color-text)",
              border: "1px solid var(--color-surface-border)",
              cursor: "pointer",
            }}
          >
            {GENRE_CATEGORIES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <GameGrid games={filteredGames} title={`AVAILABLE CARTRIDGES`} />
    </div>
  );
}
