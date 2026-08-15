"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export const FixedBottomFlora: React.FC = () => {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Hide flowers completely on active game pages
  const isGamePage = pathname && pathname.startsWith("/games");

  useEffect(() => {
    if (isGamePage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let width = (canvas.width = window.innerWidth);
    const height = (canvas.height = 50);

    interface FloraItem {
      x: number;
      layer: 0 | 1 | 2; // 0 = back tall, 1 = mid flowers, 2 = front grass & mushrooms
      type:
        | "sunflower"
        | "lupine_purple"
        | "wheat_gold"
        | "reed_emerald"
        | "rose_red"
        | "rose_pink"
        | "rose_white"
        | "marigold_gold"
        | "poppy_orange"
        | "lavender"
        | "daisy_white"
        | "glowbell_cyan"
        | "nightshade_violet"
        | "mushroom_red"
        | "mushroom_gold"
        | "clover_patch"
        | "grass_tall"
        | "grass_dense";
      scale: number;
      swayOffset: number;
      swaySpeed: number;
      offsetY: number;
    }

    interface Butterfly {
      x: number;
      y: number;
      baseY: number;
      color: string;
      wingPhase: number;
      speedX: number;
      swayFreq: number;
    }

    interface Firefly {
      x: number;
      y: number;
      baseY: number;
      size: number;
      color: string;
      speedX: number;
      phase: number;
    }

    const floraItems: FloraItem[] = [];
    const step = 10; // Balanced spacing with natural breathing room
    const count = Math.ceil(width / step);

    // Layer 0: Tall back flora (Sunflowers, Lupines, Reeds)
    const backTypes: FloraItem["type"][] = [
      "sunflower",
      "grass_tall",
      "lupine_purple",
      "wheat_gold",
      "reed_emerald",
      "grass_tall",
    ];

    // Layer 1: Blooming midground flowers (Roses, Marigolds, Poppies, Daisies, Glowbells)
    const midTypes: FloraItem["type"][] = [
      "rose_red",
      "grass_dense",
      "marigold_gold",
      "rose_pink",
      "lavender",
      "daisy_white",
      "poppy_orange",
      "glowbell_cyan",
      "nightshade_violet",
      "rose_white",
    ];

    // Layer 2: Foreground ground cover
    const frontTypes: FloraItem["type"][] = [
      "grass_dense",
      "mushroom_red",
      "clover_patch",
      "grass_dense",
      "mushroom_gold",
    ];

    for (let i = 0; i < count; i++) {
      const x = i * step + (Math.sin(i * 37) * 2);

      // Back layer (every 2 steps for natural tall flower accents)
      if (i % 2 === 0) {
        floraItems.push({
          x: x + 1,
          layer: 0,
          type: backTypes[(i / 2) % backTypes.length],
          scale: 1.0 + Math.abs(Math.sin(i * 13)) * 0.25,
          swayOffset: (i * 0.4) % (Math.PI * 2),
          swaySpeed: 0.8 + Math.abs(Math.sin(i * 17)) * 0.5,
          offsetY: 1 + Math.abs(Math.sin(i * 7)) * 3,
        });
      }

      // Mid layer (Primary floral layer with grass intervals)
      floraItems.push({
        x: x,
        layer: 1,
        type: midTypes[i % midTypes.length],
        scale: 0.95 + Math.abs(Math.sin(i * 23)) * 0.3,
        swayOffset: (i * 0.6) % (Math.PI * 2),
        swaySpeed: 1.0 + Math.abs(Math.sin(i * 29)) * 0.7,
        offsetY: Math.abs(Math.sin(i * 11)) * 2,
      });

      // Front layer (Occasional mushrooms, clovers & grass tufts)
      if (i % 3 === 0) {
        floraItems.push({
          x: x + 3,
          layer: 2,
          type: frontTypes[(i / 3) % frontTypes.length],
          scale: 0.85 + Math.abs(Math.sin(i * 31)) * 0.2,
          swayOffset: (i * 0.8) % (Math.PI * 2),
          swaySpeed: 1.3 + Math.abs(Math.sin(i * 41)) * 0.7,
          offsetY: 0,
        });
      }
    }

    // Sort by layer for correct depth rendering
    floraItems.sort((a, b) => a.layer - b.layer);

    // Animated Butterflies
    const butterflies: Butterfly[] = [];
    const butterflyColors = ["#ffd84d", "#ff5c8a", "#4de8e8", "#c084fc", "#ffffff"];
    const numButterflies = Math.min(5, Math.max(2, Math.floor(width / 320)));

    for (let i = 0; i < numButterflies; i++) {
      butterflies.push({
        x: Math.random() * width,
        y: height - 20 - Math.random() * 20,
        baseY: height - 20 - Math.random() * 20,
        color: butterflyColors[i % butterflyColors.length],
        wingPhase: Math.random() * Math.PI * 2,
        speedX: 0.3 + Math.random() * 0.4,
        swayFreq: 1.1 + Math.random() * 1.3,
      });
    }

    // Micro Fireflies
    const fireflies: Firefly[] = [];
    const numFireflies = Math.min(20, Math.floor(width / 70));
    const fireflyColors = ["#ffd84d", "#ff5c8a", "#4de8e8", "#a879ff", "#63e66d"];

    for (let i = 0; i < numFireflies; i++) {
      fireflies.push({
        x: Math.random() * width,
        y: height - 12 - Math.random() * 30,
        baseY: height - 12 - Math.random() * 30,
        size: Math.random() < 0.3 ? 2 : 1,
        color: fireflyColors[Math.floor(Math.random() * fireflyColors.length)],
        speedX: (Math.random() - 0.5) * 0.4,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const drawFlora = (x: number, baseY: number, item: FloraItem, sway: number) => {
      const s = Math.max(1, Math.floor(item.scale * 2));
      const swayX = Math.round(Math.sin(sway) * 1.5);
      const y = baseY - item.offsetY;

      switch (item.type) {
        // === TALL BACK LAYER ===
        case "sunflower":
          ctx.fillStyle = "#1e3a24";
          ctx.fillRect(x, y - s * 6, s, s * 6);
          ctx.fillStyle = "#2e6038";
          ctx.fillRect(x + swayX, y - s * 9, s, s * 3);
          // Petals
          ctx.fillStyle = "#ffd84d";
          ctx.fillRect(x - s * 2 + swayX, y - s * 12, s * 5, s * 3);
          ctx.fillRect(x - s + swayX, y - s * 13, s * 3, s * 5);
          ctx.fillStyle = "#f59e0b";
          ctx.fillRect(x - s + swayX, y - s * 11, s * 2, s * 2);
          // Core
          ctx.fillStyle = "#5c2e0b";
          ctx.fillRect(x + swayX, y - s * 11, s, s);
          break;

        case "lupine_purple":
          ctx.fillStyle = "#1c3822";
          ctx.fillRect(x, y - s * 7, s, s * 7);
          // Purple cone
          ctx.fillStyle = "#7c3aed";
          ctx.fillRect(x - s + swayX, y - s * 11, s * 3, s * 4);
          ctx.fillStyle = "#a879ff";
          ctx.fillRect(x - s + swayX, y - s * 10, s * 3, s * 2);
          ctx.fillStyle = "#c084fc";
          ctx.fillRect(x + swayX, y - s * 12, s, s * 2);
          break;

        case "wheat_gold":
          ctx.fillStyle = "#854d0e";
          ctx.fillRect(x, y - s * 6, s, s * 6);
          ctx.fillStyle = "#eab308";
          ctx.fillRect(x - s + swayX, y - s * 9, s * 2, s * 3);
          ctx.fillRect(x + s + swayX, y - s * 8, s * 2, s * 2);
          ctx.fillStyle = "#fef08a";
          ctx.fillRect(x + swayX, y - s * 10, s, s * 2);
          break;

        case "reed_emerald":
          ctx.fillStyle = "#166534";
          ctx.fillRect(x, y - s * 8, s, s * 8);
          ctx.fillStyle = "#22c55e";
          ctx.fillRect(x - s + swayX, y - s * 6, s * 3, s * 2);
          ctx.fillRect(x + swayX, y - s * 9, s, s * 2);
          break;

        // === MIDGROUND BLOOMS ===
        case "rose_red":
          ctx.fillStyle = "#15803d";
          ctx.fillRect(x, y - s * 4, s, s * 4);
          ctx.fillStyle = "#dc2626";
          ctx.fillRect(x - s * 2 + swayX, y - s * 7, s * 4, s * 3);
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(x - s + swayX, y - s * 8, s * 2, s * 2);
          ctx.fillStyle = "#fecaca";
          ctx.fillRect(x + swayX, y - s * 7, s, s);
          break;

        case "rose_pink":
          ctx.fillStyle = "#16a34a";
          ctx.fillRect(x, y - s * 4, s, s * 4);
          ctx.fillStyle = "#ff5c8a";
          ctx.fillRect(x - s * 2 + swayX, y - s * 7, s * 4, s * 3);
          ctx.fillStyle = "#f472b6";
          ctx.fillRect(x - s + swayX, y - s * 8, s * 2, s * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x + swayX, y - s * 7, s, s);
          break;

        case "rose_white":
          ctx.fillStyle = "#15803d";
          ctx.fillRect(x, y - s * 4, s, s * 4);
          ctx.fillStyle = "#f8fafc";
          ctx.fillRect(x - s * 2 + swayX, y - s * 6, s * 4, s * 2);
          ctx.fillStyle = "#ffd84d";
          ctx.fillRect(x + swayX, y - s * 5, s, s);
          break;

        case "marigold_gold":
          ctx.fillStyle = "#15803d";
          ctx.fillRect(x, y - s * 4, s, s * 4);
          ctx.fillStyle = "#f59e0b";
          ctx.fillRect(x - s * 2 + swayX, y - s * 7, s * 4, s * 3);
          ctx.fillStyle = "#ffd84d";
          ctx.fillRect(x - s + swayX, y - s * 8, s * 2, s * 2);
          ctx.fillStyle = "#78350f";
          ctx.fillRect(x + swayX, y - s * 6, s, s);
          break;

        case "poppy_orange":
          ctx.fillStyle = "#16a34a";
          ctx.fillRect(x, y - s * 4, s, s * 4);
          ctx.fillStyle = "#ea580c";
          ctx.fillRect(x - s * 2 + swayX, y - s * 7, s * 4, s * 3);
          ctx.fillStyle = "#ff9f43";
          ctx.fillRect(x - s + swayX, y - s * 8, s * 2, s * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x + swayX, y - s * 6, s, s);
          break;

        case "lavender":
          ctx.fillStyle = "#166534";
          ctx.fillRect(x, y - s * 6, s, s * 6);
          ctx.fillStyle = "#9333ea";
          ctx.fillRect(x - s + swayX, y - s * 8, s * 2, s * 3);
          ctx.fillStyle = "#c084fc";
          ctx.fillRect(x + swayX, y - s * 9, s, s * 2);
          break;

        case "glowbell_cyan":
          ctx.fillStyle = "#15803d";
          ctx.fillRect(x, y - s * 4, s, s * 4);
          ctx.fillStyle = "#06b6d4";
          ctx.fillRect(x - s * 2 + swayX, y - s * 6, s * 4, s * 2);
          ctx.fillStyle = "#4de8e8";
          ctx.fillRect(x - s + swayX, y - s * 7, s * 2, s * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x + swayX, y - s * 5, s, s);
          break;

        case "nightshade_violet":
          ctx.fillStyle = "#14532d";
          ctx.fillRect(x, y - s * 4, s, s * 4);
          ctx.fillStyle = "#4c1d95";
          ctx.fillRect(x - s * 2 + swayX, y - s * 7, s * 4, s * 3);
          ctx.fillStyle = "#8b5cf6";
          ctx.fillRect(x - s + swayX, y - s * 7, s * 2, s * 2);
          ctx.fillStyle = "#4de8e8";
          ctx.fillRect(x + swayX, y - s * 6, s, s);
          break;

        case "daisy_white":
          ctx.fillStyle = "#16a34a";
          ctx.fillRect(x, y - s * 4, s, s * 4);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x - s * 2 + swayX, y - s * 6, s * 4, s * 2);
          ctx.fillStyle = "#ffd84d";
          ctx.fillRect(x + swayX, y - s * 5, s, s);
          break;

        // === FOREGROUND COVER ===
        case "mushroom_red":
          ctx.fillStyle = "#e2e8f0";
          ctx.fillRect(x, y - s * 2, s, s * 2);
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(x - s * 2, y - s * 4, s * 4, s * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x - s, y - s * 3, s, s);
          ctx.fillRect(x + s, y - s * 3, s, s);
          break;

        case "mushroom_gold":
          ctx.fillStyle = "#f1f5f9";
          ctx.fillRect(x, y - s * 2, s, s * 2);
          ctx.fillStyle = "#f59e0b";
          ctx.fillRect(x - s * 2, y - s * 4, s * 4, s * 2);
          ctx.fillStyle = "#fef08a";
          ctx.fillRect(x, y - s * 3, s, s);
          break;

        case "clover_patch":
          ctx.fillStyle = "#15803d";
          ctx.fillRect(x - s, y - s * 2, s * 3, s * 2);
          ctx.fillStyle = "#22c55e";
          ctx.fillRect(x - s * 2, y - s * 4, s * 2, s * 2);
          ctx.fillRect(x + s, y - s * 4, s * 2, s * 2);
          break;

        case "grass_tall":
          ctx.fillStyle = "#14532d";
          ctx.fillRect(x, y - s * 5, s, s * 5);
          ctx.fillStyle = "#22c55e";
          ctx.fillRect(x - s + swayX, y - s * 4, s, s * 3);
          ctx.fillStyle = "#4ade80";
          ctx.fillRect(x + s + swayX, y - s * 3, s, s * 2);
          break;

        case "grass_dense":
        default:
          ctx.fillStyle = "#166534";
          ctx.fillRect(x, y - s * 3, s, s * 3);
          ctx.fillStyle = "#22c55e";
          ctx.fillRect(x - s + swayX, y - s * 2, s, s * 2);
          ctx.fillStyle = "#86efac";
          ctx.fillRect(x + s + swayX, y - s * 2, s, s * 2);
          break;
      }
    };

    let startTime = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      // Deep Navy Soil Foundation Bed
      ctx.fillStyle = "#03060f";
      ctx.fillRect(0, height - 8, width, 8);
      ctx.fillStyle = "rgba(77, 232, 232, 0.4)";
      ctx.fillRect(0, height - 8, width, 1);
      ctx.fillStyle = "#0a1326";
      ctx.fillRect(0, height - 7, width, 7);

      // Render 3 Layer Flora
      for (const item of floraItems) {
        const sway = elapsed * item.swaySpeed + item.swayOffset;
        drawFlora(item.x, height - 7, item, sway);
      }

      // Render Floating Animated Butterflies
      for (const b of butterflies) {
        b.x += b.speedX;
        b.y = b.baseY + Math.sin(elapsed * b.swayFreq) * 8;
        if (b.x > width + 10) b.x = -10;

        const flap = Math.sin(elapsed * 16 + b.wingPhase);
        const wingW = Math.max(1, Math.round(Math.abs(flap) * 3));

        // Butterfly body & wings
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(Math.floor(b.x), Math.floor(b.y), 1, 3);
        ctx.fillStyle = b.color;
        ctx.fillRect(Math.floor(b.x) - wingW, Math.floor(b.y) - 1, wingW, 2);
        ctx.fillRect(Math.floor(b.x) + 1, Math.floor(b.y) - 1, wingW, 2);
      }

      // Render Floating Micro Fireflies with halos
      for (const f of fireflies) {
        f.x += f.speedX;
        f.y = f.baseY + Math.sin(elapsed * 2 + f.phase) * 6;
        if (f.x < 0) f.x = width;
        if (f.x > width) f.x = 0;

        const pulse = 0.4 + 0.6 * Math.sin(elapsed * 4 + f.phase);
        ctx.fillStyle = f.color;
        ctx.globalAlpha = Math.max(0.1, pulse);
        ctx.fillRect(Math.floor(f.x), Math.floor(f.y), f.size, f.size);
      }
      ctx.globalAlpha = 1.0;

      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
    };

    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", handleResize);
    };
  }, [isGamePage]);

  // Don't render on game pages
  if (isGamePage) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100vw",
        height: "50px",
        zIndex: 40,
        pointerEvents: "none",
        imageRendering: "pixelated",
      }}
    />
  );
};
