"use client";

import React, { useEffect, useRef } from "react";

interface PixelStar {
  x: number;
  y: number;
  size: number;
  color: string;
  twinkleSpeed: number;
  twinkleOffset: number;
}

export const ProceduralBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // 1. Generate Colorful Pixel Stars
    const starColors = ["#ffd84d", "#ff5c8a", "#4de8e8", "#a879ff", "#ffffff", "#63e66d"];
    const stars: PixelStar[] = [];
    const numStars = Math.floor((width * height) / 9000);

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() < 0.2 ? 3 : Math.random() < 0.5 ? 2 : 1,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        twinkleSpeed: 1.5 + Math.random() * 3,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }

    let startTime = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;

      ctx.clearRect(0, 0, width, height);

      // Deep Space / Digital Wilderness Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, "#080b12");
      grad.addColorStop(0.45, "#0b1020");
      grad.addColorStop(0.85, "#101628");
      grad.addColorStop(1, "#0d1322");

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle Cosmic Dust Nebulas
      const radGrad = ctx.createRadialGradient(
        width * 0.25, height * 0.3, 20,
        width * 0.25, height * 0.3, width * 0.5
      );
      radGrad.addColorStop(0, "rgba(168, 121, 255, 0.04)");
      radGrad.addColorStop(0.6, "rgba(77, 163, 255, 0.02)");
      radGrad.addColorStop(1, "transparent");
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, width, height);

      // Render Twinkling Stars
      for (const s of stars) {
        const alpha = 0.4 + 0.6 * Math.sin(elapsed * s.twinkleSpeed + s.twinkleOffset);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0.1, alpha);
        ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
      }
      ctx.globalAlpha = 1.0;

      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
};
