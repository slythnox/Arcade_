"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Beaker, FlaskConical, Cpu, Waves, Bot, Dna, Grid3x3, ArrowLeft } from "lucide-react";
import { GameCard } from "@/components/arcade/GameCard";

// We import lazily from registry once types are updated.
// For now we filter the full registry for category === "labs".
import { gameRegistry } from "@/games/registry";
import type { GameSubcategory } from "@/core/types/game";

const LAB_SUBCATEGORIES: { key: GameSubcategory | "all"; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All Experiments", icon: <Beaker size={14} /> },
  { key: "fractals", label: "Fractals", icon: <Grid3x3 size={14} /> },
  { key: "physics-sim", label: "Physics Sim", icon: <Waves size={14} /> },
  { key: "algorithms", label: "Algorithms", icon: <Cpu size={14} /> },
  { key: "cellular-automata", label: "Cellular Automata", icon: <Dna size={14} /> },
  { key: "ai", label: "AI & Emergence", icon: <Bot size={14} /> },
  { key: "procedural", label: "Procedural", icon: <FlaskConical size={14} /> },
  { key: "experimental", label: "Experimental", icon: <FlaskConical size={14} /> },
];

export default function LabsPage() {
  const [activeFilter, setActiveFilter] = useState<GameSubcategory | "all">("all");

  const labsGames = useMemo(
    () => gameRegistry.filter((g) => g.category === "labs"),
    []
  );

  const filtered = useMemo(() => {
    if (activeFilter === "all") return labsGames;
    return labsGames.filter((g) => g.subcategory === activeFilter);
  }, [labsGames, activeFilter]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse 120% 80% at 50% 30%, #130a2a 0%, #0d0820 45%, #060e1c 100%)",
      }}
    >
      {/* Header section */}
      <section
        style={{
          position: "relative",
          paddingTop: "60px",
          paddingBottom: "48px",
          textAlign: "center",
          overflow: "hidden",
          borderBottom: "1px solid rgba(168, 121, 255, 0.15)",
        }}
      >
        {/* Star field */}
        {[
          { top: "12%", left: "8%" }, { top: "22%", left: "30%" },
          { top: "8%", left: "58%" }, { top: "35%", left: "80%" },
          { top: "55%", left: "92%" }, { top: "70%", left: "18%" },
          { top: "60%", left: "65%" }, { top: "80%", left: "45%" },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              width: i % 2 === 0 ? "2px" : "1px",
              height: i % 2 === 0 ? "2px" : "1px",
              backgroundColor: "#a879ff",
              borderRadius: "50%",
              opacity: 0.3 + (i % 3) * 0.1,
            }}
          />
        ))}

        <div style={{ position: "relative", zIndex: 10, maxWidth: "680px", margin: "0 auto", padding: "0 24px" }}>
          {/* Back to Arcade link */}
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              color: "#a879ff",
              textDecoration: "none",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "24px",
              opacity: 0.8,
              transition: "opacity 0.15s",
            }}
          >
            <ArrowLeft size={12} />
            Back to Arcade
          </Link>

          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 900,
              color: "#a879ff",
              backgroundColor: "rgba(168, 121, 255, 0.1)",
              border: "1px solid rgba(168, 121, 255, 0.3)",
              padding: "5px 14px",
              borderRadius: "100px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            <Beaker size={12} />
            MATHEMATICAL LABORATORY
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "clamp(24px, 4.5vw, 48px)",
              fontWeight: 900,
              color: "#a879ff",
              letterSpacing: "0.06em",
              lineHeight: 1.1,
              textShadow: "3px 3px 0px rgba(0,0,0,0.6)",
              margin: "0 0 16px 0",
            }}
          >
            ARCADE<span style={{ color: "#4de8e8" }}>_</span>LABS
          </h1>

          {/* Description */}
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(13px, 1.8vw, 16px)",
              fontWeight: 400,
              color: "rgba(255,255,255,0.7)",
              lineHeight: 1.6,
              margin: "0 0 32px 0",
              maxWidth: "520px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Mathematical experiments, physics simulations, and algorithmic art. These aren&apos;t games —
            they&apos;re living demonstrations of the mathematics underneath ARCADE_.
          </p>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "32px",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
            }}
          >
            {[
              { label: "Experiments", value: labsGames.length },
              { label: "Categories", value: LAB_SUBCATEGORIES.length - 1 },
              { label: "No ROM files", value: "100%" },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: 900, color: "#a879ff" }}>{value}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter pills */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          justifyContent: "center",
          padding: "24px 24px 0",
        }}
      >
        {LAB_SUBCATEGORIES.map(({ key, label, icon }) => {
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
                borderRadius: "6px",
                border: `1px solid ${isActive ? "#a879ff" : "rgba(168, 121, 255, 0.2)"}`,
                backgroundColor: isActive ? "rgba(168, 121, 255, 0.15)" : "transparent",
                color: isActive ? "#a879ff" : "rgba(255, 255, 255, 0.45)",
                transition: "all 0.15s ease",
              }}
            >
              {icon}
              {label}
              {key !== "all" && (
                <span
                  style={{
                    fontSize: "10px",
                    color: isActive ? "#a879ff" : "rgba(255,255,255,0.3)",
                    backgroundColor: isActive ? "rgba(168, 121, 255, 0.15)" : "rgba(255,255,255,0.05)",
                    padding: "1px 5px",
                    borderRadius: "4px",
                  }}
                >
                  {labsGames.filter((g) => g.subcategory === key).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Game grid */}
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "24px 24px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "24px",
            borderBottom: "1px solid rgba(168, 121, 255, 0.15)",
            paddingBottom: "12px",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "20px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            {activeFilter === "all" ? "ALL EXPERIMENTS" : activeFilter.toUpperCase().replace("-", " ")}
          </h2>
          <span
            style={{
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              fontWeight: 800,
              color: "#a879ff",
              backgroundColor: "rgba(168, 121, 255, 0.1)",
              border: "1px solid rgba(168, 121, 255, 0.3)",
              padding: "2px 8px",
              borderRadius: "100px",
            }}
          >
            {filtered.length}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div
            style={{
              padding: "64px 24px",
              textAlign: "center",
              color: "rgba(255,255,255,0.3)",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
            }}
          >
            No experiments in this category yet.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
              gap: "24px",
            }}
          >
            {filtered.map((game) => (
              <GameCard key={game.id} game={game} basePath="/labs" />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
