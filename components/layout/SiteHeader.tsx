"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Volume2, VolumeX, Maximize2, Minimize2 } from "lucide-react";
import { getAudioManager } from "@/engine/audio/AudioManager";
import { savePlayerSettings } from "@/lib/storage/settings";
import { SteamLaunchOverlay } from "@/components/game/SteamLaunchOverlay";

export const SiteHeader: React.FC = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSteamTransition, setShowSteamTransition] = useState(false);

  useEffect(() => {
    const unsubscribeAudio = getAudioManager().subscribeMuteChange((muted) => {
      setIsMuted(muted);
    });

    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      unsubscribeAudio();
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleToggleMute = () => {
    const audio = getAudioManager();
    const newMuted = audio.toggleMute();
    savePlayerSettings({ soundEnabled: !newMuted });
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      setShowSteamTransition(true);
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <>
      <SteamLaunchOverlay
        active={showSteamTransition}
        gameTitle="BIG PICTURE COCKPIT"
        onComplete={() => setShowSteamTransition(false)}
      />

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "rgba(8, 11, 18, 0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--color-surface-border)",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "var(--header-height)",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: "var(--arcade-yellow)",
                boxShadow: "0 0 14px var(--arcade-yellow)",
                transform: "rotate(45deg)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-pixel)",
                fontSize: "16px",
                fontWeight: 900,
                letterSpacing: "0.05em",
                color: "#FFFFFF",
              }}
            >
              ARCADE<span style={{ color: "var(--arcade-pink)" }}>_</span>
            </span>
          </Link>

          {/* Quick Hardware Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={handleToggleMute}
              aria-label={isMuted ? "Unmute Audio" : "Mute Audio"}
              title={isMuted ? "Audio: Muted" : "Audio: Active"}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "38px",
                height: "38px",
                backgroundColor: isMuted ? "var(--color-surface)" : "rgba(77, 232, 232, 0.12)",
                border: "1px solid var(--color-surface-border)",
                color: isMuted ? "var(--color-text-muted)" : "var(--arcade-cyan)",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            <button
              onClick={handleToggleFullscreen}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Big Picture"}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "38px",
                height: "38px",
                backgroundColor: isFullscreen ? "var(--arcade-pink)" : "rgba(255, 92, 138, 0.12)",
                border: "1px solid var(--color-surface-border)",
                color: isFullscreen ? "#080b12" : "var(--arcade-pink)",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>
      </header>
    </>
  );
};
