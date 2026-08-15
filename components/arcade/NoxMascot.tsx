"use client";

import React, { useState, useEffect } from "react";

export interface NoxMascotProps {
  size?: number;
  mood?: "idle" | "happy" | "sleepy" | "gaming";
  interactive?: boolean;
}

export const NoxMascot: React.FC<NoxMascotProps> = ({
  size = 48,
  mood = "idle",
  interactive = true,
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 3200 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  const scale = size / 24;

  return (
    <div
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: "relative",
        display: "inline-block",
        cursor: interactive ? "pointer" : "default",
        transform: isHovered ? "scale(1.15) translateY(-4px)" : "scale(1)",
        transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{
          imageRendering: "pixelated",
          filter: isHovered ? "drop-shadow(0 0 10px #ff5c8a)" : "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
        }}
      >
        {/* Antenna / Horns */}
        <rect x="7" y="2" width="2" height="3" fill="#ff5c8a" />
        <rect x="15" y="2" width="2" height="3" fill="#ff5c8a" />
        <rect x="6" y="1" width="4" height="2" fill="#ffd84d" />
        <rect x="14" y="1" width="4" height="2" fill="#ffd84d" />

        {/* Head / Body */}
        <rect x="4" y="5" width="16" height="13" fill="#1d263b" />
        <rect x="5" y="4" width="14" height="15" fill="#25324d" />
        <rect x="6" y="6" width="12" height="11" fill="#304165" />

        {/* Cheeks */}
        <rect x="4" y="12" width="2" height="2" fill="#ff5c8a" opacity="0.8" />
        <rect x="18" y="12" width="2" height="2" fill="#ff5c8a" opacity="0.8" />

        {/* Eyes */}
        {!isBlinking ? (
          <>
            {/* Big Glowing Cyan / Yellow Eyes */}
            <rect x="7" y="8" width="3" height="4" fill="#4de8e8" />
            <rect x="8" y="9" width="1" height="2" fill="#ffffff" />
            <rect x="14" y="8" width="3" height="4" fill="#4de8e8" />
            <rect x="15" y="9" width="1" height="2" fill="#ffffff" />
          </>
        ) : (
          <>
            {/* Blinking Happy Eyes */}
            <rect x="7" y="10" width="3" height="1" fill="#4de8e8" />
            <rect x="14" y="10" width="3" height="1" fill="#4de8e8" />
          </>
        )}

        {/* Mouth / Screen expression */}
        {isHovered || mood === "happy" ? (
          <rect x="10" y="13" width="4" height="2" fill="#ffd84d" />
        ) : (
          <rect x="11" y="13" width="2" height="1" fill="#4de8e8" />
        )}

        {/* Feet */}
        <rect x="6" y="18" width="3" height="3" fill="#ff5c8a" />
        <rect x="15" y="18" width="3" height="3" fill="#ff5c8a" />
      </svg>
    </div>
  );
};
