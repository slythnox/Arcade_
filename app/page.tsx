"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Gamepad2, FlaskConical } from "lucide-react";
import { arcadeRegistry, labsRegistry } from "@/games/registry";
import { searchGames } from "@/lib/search/searchGames";
import { ArcadeHero } from "@/components/arcade/ArcadeHero";
import { GameGrid } from "@/components/arcade/GameGrid";

type Tab = "games" | "labs";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [activeTab, setActiveTab] = useState<Tab>("games");

  const filteredArcade = useMemo(() => {
    const results = searchGames(searchQuery, arcadeRegistry, selectedPlatform);
    return results.map((r) => r.item);
  }, [searchQuery, selectedPlatform]);

  const filteredLabs = useMemo(() => {
    const results = searchGames(searchQuery, labsRegistry, selectedPlatform);
    return results.map((r) => r.item);
  }, [searchQuery, selectedPlatform]);

  const displayGames = activeTab === "games" ? filteredArcade : filteredLabs;
  const gridTitle = searchQuery.trim()
    ? "SEARCH RESULTS"
    : activeTab === "games"
    ? "ALL CARTRIDGES"
    : "ALL EXPERIMENTS";

  const labsBasePath = "/labs";

  return (
    <div className="container" style={{ paddingBottom: "var(--space-12)" }}>
      {/* 1. Sleek 90s Minimalist Hero Search & Platform Filter */}
      <ArcadeHero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedPlatform={selectedPlatform}
        onPlatformChange={setSelectedPlatform}
      />

      {/* 2. GAMES / LABS Tab Switcher */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          marginBottom: "28px",
          padding: "4px",
          backgroundColor: "rgba(10, 18, 36, 0.6)",
          border: "1px solid rgba(255, 255, 255, 0.07)",
          borderRadius: "10px",
          width: "fit-content",
        }}
      >
        <button
          onClick={() => setActiveTab("games")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 20px",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            fontWeight: 900,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            borderRadius: "7px",
            border: "none",
            backgroundColor: activeTab === "games" ? "#ffd84d" : "transparent",
            color: activeTab === "games" ? "#04060d" : "rgba(255,255,255,0.4)",
            transition: "all 0.2s ease",
            boxShadow: activeTab === "games" ? "0 2px 8px rgba(255, 216, 77, 0.35)" : "none",
          }}
        >
          <Gamepad2 size={14} />
          🎮 GAMES
          <span
            style={{
              fontSize: "10px",
              fontWeight: 900,
              backgroundColor: activeTab === "games" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.06)",
              padding: "1px 6px",
              borderRadius: "4px",
            }}
          >
            {arcadeRegistry.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("labs")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 20px",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            fontWeight: 900,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            borderRadius: "7px",
            border: "none",
            backgroundColor: activeTab === "labs" ? "#a879ff" : "transparent",
            color: activeTab === "labs" ? "#ffffff" : "rgba(255,255,255,0.4)",
            transition: "all 0.2s ease",
            boxShadow: activeTab === "labs" ? "0 2px 8px rgba(168, 121, 255, 0.35)" : "none",
          }}
        >
          <FlaskConical size={14} />
          🧪 LABS
          <span
            style={{
              fontSize: "10px",
              fontWeight: 900,
              backgroundColor: activeTab === "labs" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)",
              padding: "1px 6px",
              borderRadius: "4px",
            }}
          >
            {labsRegistry.length}
          </span>
        </button>

        {/* Labs dedicated page link */}
        {activeTab === "labs" && (
          <Link
            href="/labs"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginLeft: "8px",
              padding: "8px 14px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "rgba(168, 121, 255, 0.7)",
              textDecoration: "none",
              border: "1px solid rgba(168, 121, 255, 0.2)",
              borderRadius: "6px",
              transition: "all 0.15s",
            }}
          >
            Full Labs Page →
          </Link>
        )}
      </div>

      {/* 3. Direct Game Cartridge Grid */}
      <GameGrid
        games={displayGames}
        title={gridTitle}
        cardBasePath={activeTab === "labs" ? labsBasePath : "/games"}
        emptyMessage={
          activeTab === "labs"
            ? "NO EXPERIMENTS MATCHING CRITERIA."
            : "NO CARTRIDGES FOUND MATCHING CRITERIA."
        }
      />
    </div>
  );
}
