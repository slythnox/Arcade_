"use client";

import React, { useState, useMemo } from "react";
import { labsRegistry } from "@/games/registry";
import { searchGames } from "@/lib/search/searchGames";
import { ArcadeHero } from "@/components/arcade/ArcadeHero";
import { GameGrid } from "@/components/arcade/GameGrid";

export default function LabsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");

  const filteredLabs = useMemo(() => {
    const results = searchGames(searchQuery, labsRegistry, selectedPlatform);
    return results.map((r) => r.item);
  }, [searchQuery, selectedPlatform]);

  const gridTitle = searchQuery.trim() ? "SEARCH RESULTS" : "ALL EXPERIMENTS";

  return (
    <div className="container" style={{ paddingBottom: "var(--space-12)" }}>
      <ArcadeHero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedPlatform={selectedPlatform}
        onPlatformChange={setSelectedPlatform}
        variant="labs"
      />

      <GameGrid
        games={filteredLabs}
        title={gridTitle}
        cardBasePath="/labs"
        emptyMessage="No mathematical experiments match your search."
      />
    </div>
  );
}
