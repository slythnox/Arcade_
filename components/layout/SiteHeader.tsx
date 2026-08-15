"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Volume2, VolumeX, Maximize2, Minimize2, ChevronDown, Gamepad2, FlaskConical } from "lucide-react";
import { getAudioManager } from "@/engine/audio/AudioManager";
import { loadPlayerSettings, savePlayerSettings } from "@/lib/storage/settings";
import { SteamLaunchOverlay } from "@/components/game/SteamLaunchOverlay";

export const SiteHeader: React.FC = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSteamTransition, setShowSteamTransition] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const settings = loadPlayerSettings();
    setIsMuted(!settings.soundEnabled);
    getAudioManager().setMuted(!settings.soundEnabled);

    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLibraryOpen(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleMute = () => {
    const audio = getAudioManager();
    const newMuted = audio.toggleMute();
    setIsMuted(newMuted);
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

          {/* Centre nav — Library dropdown */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setLibraryOpen((o) => !o)}
              aria-haspopup="true"
              aria-expanded={libraryOpen}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.08)",
                backgroundColor: libraryOpen ? "rgba(255,255,255,0.06)" : "transparent",
                color: libraryOpen ? "#ffffff" : "rgba(255,255,255,0.55)",
                transition: "all 0.15s ease",
              }}
            >
              LIBRARY
              <ChevronDown
                size={12}
                style={{
                  transition: "transform 0.2s ease",
                  transform: libraryOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>

            {/* Dropdown panel */}
            {libraryOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  minWidth: "210px",
                  backgroundColor: "#0a1224",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                  overflow: "hidden",
                  zIndex: 100,
                }}
              >
                {/* Games entry */}
                <Link
                  href="/games"
                  onClick={() => setLibraryOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px 18px",
                    textDecoration: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    background: "transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,216,77,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255,216,77,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Gamepad2 size={16} color="#ffd84d" />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 800,
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.06em",
                        color: "#ffd84d",
                        textTransform: "uppercase",
                      }}
                    >
                      🎮 Games
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                      59 arcade cartridges
                    </div>
                  </div>
                </Link>

                {/* Labs entry */}
                <Link
                  href="/labs"
                  onClick={() => setLibraryOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px 18px",
                    textDecoration: "none",
                    background: "transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(168,121,255,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(168,121,255,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FlaskConical size={16} color="#a879ff" />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 800,
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.06em",
                        color: "#a879ff",
                        textTransform: "uppercase",
                      }}
                    >
                      🧪 Labs
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                      14 math experiments
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>

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
