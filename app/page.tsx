"use client";

import React, { useState, useMemo } from "react";
import { arcadeRegistry } from "@/games/registry";
import { searchGames } from "@/lib/search/searchGames";
import { ArcadeHero } from "@/components/arcade/ArcadeHero";
import { GameGrid } from "@/components/arcade/GameGrid";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");

  const filteredGames = useMemo(() => {
    const results = searchGames(searchQuery, arcadeRegistry, selectedPlatform);
    return results.map((r) => r.item);
  }, [searchQuery, selectedPlatform]);

  const gridTitle = searchQuery.trim() ? "SEARCH RESULTS" : "ALL CARTRIDGES";

  return (
    <div style={{ paddingBottom: "var(--space-12)" }}>
      {/* Full-bleed edge-to-edge Hero Header with zero side borders */}
      <ArcadeHero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedPlatform={selectedPlatform}
        onPlatformChange={setSelectedPlatform}
      />

      {/* Cartridge Grid in Centered Container */}
      <div className="container">
        <GameGrid
          games={filteredGames}
          title={gridTitle}
          emptyMessage="No cartridges match your search — try a different query."
        />
      </div>
    </div>
  );
}
