"use client";

import React, { useState, useMemo } from "react";
import { gameRegistry } from "@/games/registry";
import { searchGames } from "@/lib/search/searchGames";
import { ArcadeHero } from "@/components/arcade/ArcadeHero";
import { GameGrid } from "@/components/arcade/GameGrid";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");

  const filteredGames = useMemo(() => {
    const results = searchGames(searchQuery, gameRegistry, selectedPlatform);
    return results.map((r) => r.item);
  }, [searchQuery, selectedPlatform]);

  return (
    <div className="container" style={{ paddingBottom: "var(--space-12)" }}>
      {/* 1. Sleek 90s Minimalist Hero Search & Platform Filter */}
      <ArcadeHero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedPlatform={selectedPlatform}
        onPlatformChange={setSelectedPlatform}
      />

      {/* 2. Direct Game Cartridge Grid */}
      <GameGrid
        games={filteredGames}
        title={searchQuery.trim() ? "SEARCH RESULTS" : "ALL CARTRIDGES"}
      />
    </div>
  );
}
