"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getGameBySlug, createGameInstance } from "@/games/registry";
import { GameEngine } from "@/engine/GameEngine";
import type { GameStatus, GameAction } from "@/core/types/game";
import { CRTOverlay } from "../environment/CRTOverlay";
import { SteamLaunchOverlay } from "./SteamLaunchOverlay";
import { recordGameSessionEnd, loadPlayerStats } from "@/lib/storage/gameProgress";
import { loadPlayerSettings } from "@/lib/storage/settings";
import { getAudioManager } from "@/engine/audio/AudioManager";
import { track } from "@/lib/analytics/tracker";
import { formatScore } from "@/core/utils";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Home,
  Sliders,
  ChevronDown,
  ChevronUp,
  Target,
  BookOpen,
  Cpu,
  Keyboard,
  BatteryCharging,
  Wifi,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export interface GameShellProps {
  gameSlug: string;
  /** "labs" applies purple accent and LABS EXPERIMENT branding. Defaults to "arcade". */
  mode?: "arcade" | "labs";
}

export const GameShell: React.FC<GameShellProps> = ({ gameSlug, mode = "arcade" }) => {
  const game = getGameBySlug(gameSlug);
  const isLabs = mode === "labs";
  const accentColor = isLabs ? "#a879ff" : "#ffd84d";
  const accentGlow = isLabs ? "rgba(168, 121, 255, 0.3)" : "rgba(255, 216, 77, 0.3)";
  const accentBg = isLabs ? "rgba(168, 121, 255, 0.1)" : "rgba(255, 216, 77, 0.1)";
  const accentBorder = isLabs ? "rgba(168, 121, 255, 0.3)" : "rgba(255, 216, 77, 0.3)";
  const specsLabel = isLabs ? "LABS EXPERIMENT" : "CARTRIDGE SPECS";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [status, setStatus] = useState<GameStatus>("running");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState<number | undefined>(undefined);
  const [lives, setLives] = useState<number | undefined>(undefined);
  const [isMuted, setIsMuted] = useState(false);
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [showSteamLaunch, setShowSteamLaunch] = useState(false);
  const [clockTime, setClockTime] = useState("");

  // Accordion state for sidebar game guide dropdown (closed by default)
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Clock for Steam Big Picture Deck UI
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setClockTime(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Settings & Fullscreen listener
  useEffect(() => {
    const settings = loadPlayerSettings();
    setIsMuted(!settings.soundEnabled);
    setCrtEnabled(settings.crtEnabled);

    if (game) {
      const stats = loadPlayerStats();
      setHighScore(stats.highScores[game.id] || 0);
    }

    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) {
        setShowSteamLaunch(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [game]);

  // Instant Auto-Start on Mount
  useEffect(() => {
    if (!game || !canvasRef.current) return;
    let cancelled = false;

    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }

    const engine = new GameEngine({
      canvas: canvasRef.current,
      gameId: game.id,
      pixelSize: 2,
    });
    engineRef.current = engine;

    const session = engine.getSession();
    session.subscribe((s) => {
      if (cancelled) return;
      setStatus(s.status);
      setScore(s.score);
      setLevel(s.level);
      setLines(s.lines > 0 || game.id === "tetris" ? s.lines : undefined);
      setLives(game.id === "breakout" ? s.lives : undefined);

      if (s.status === "game-over") {
        const { isNewHighScore } = recordGameSessionEnd(game.id, s.score, s.elapsedTime);
        if (isNewHighScore) {
          setHighScore(s.score);
        }
        track("game_complete", { gameId: game.id, score: s.score, duration: s.elapsedTime });
      }
    });

    createGameInstance(game.id).then((gameInstance) => {
      if (cancelled || !engineRef.current) return;
      if (gameInstance) {
        engine.loadGame(gameInstance);
        engine.start();
        track("game_start", { gameId: game.id });
      }
    });

    const unsubscribeAudio = getAudioManager().subscribeMuteChange((muted) => {
      setIsMuted(muted);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        getAudioManager().toggleMute();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelled = true;
      unsubscribeAudio();
      window.removeEventListener("keydown", handleKeyDown);
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [game]);

  const handleToggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      setShowSteamLaunch(true);
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handleTogglePause = () => {
    if (engineRef.current) {
      engineRef.current.togglePause();
      track(status === "running" ? "game_pause" : "game_start", { gameId: game?.id });
    }
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.restart();
      track("game_restart", { gameId: game?.id });
    }
  };

  const handleToggleMute = () => {
    getAudioManager().toggleMute();
  };

  // Virtual Touch Button Trigger for Mobile Controls
  const triggerAction = (action: GameAction, isPressed: boolean) => {
    if (!engineRef.current) return;
    if (action === "PAUSE" && isPressed) {
      handleTogglePause();
      return;
    }
    if (action === "RESTART" && isPressed) {
      handleRestart();
      return;
    }

    const input = engineRef.current.getInput();
    // Dispatch to input listeners & active session
    engineRef.current.getSession().recordInput(action, isPressed);
    // Directly dispatch to active game instance
    const activeGame = (engineRef.current as unknown as { game: { handleInput: (a: GameAction, p: boolean) => void } | null }).game;
    if (activeGame) {
      activeGame.handleInput(action, isPressed);
    }
  };

  if (!game) {
    return <div style={{ color: "#EF4444" }}>Error: Cartridge not found.</div>;
  }

  const isPaused = status === "paused";

  return (
    <div
      ref={containerRef}
      className={`arcade-cockpit-stage ${isFullscreen ? "is-fullscreen steam-deck-mode" : ""}`}
      style={{
        width: "100%",
        maxWidth: isFullscreen ? "100vw" : "1280px",
        height: isFullscreen ? "100vh" : "calc(100vh - var(--header-height, 64px) - 24px)",
        maxHeight: isFullscreen ? "100vh" : "calc(100vh - var(--header-height, 64px) - 24px)",
        display: "flex",
        flexDirection: isFullscreen ? "column" : "row",
        justifyContent: isFullscreen ? "space-between" : "center",
        alignItems: "stretch",
        gap: isFullscreen ? "0" : "18px",
        padding: isFullscreen ? "0" : "0 16px 12px 16px",
        boxSizing: "border-box",
        overflow: "hidden",
        backgroundColor: isFullscreen ? "#04060d" : "transparent",
      }}
    >
      {/* Mathematical Steam Big Picture Launch Overlay */}
      <SteamLaunchOverlay
        active={showSteamLaunch}
        gameTitle={game.name}
        onComplete={() => setShowSteamLaunch(false)}
      />

      {/* STEAM BIG PICTURE FULLSCREEN TOP BAR */}
      {isFullscreen && (
        <header
          style={{
            width: "100%",
            height: "44px",
            backgroundColor: "#060b18",
            borderBottom: "1px solid #1a2b4c",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            boxSizing: "border-box",
            fontFamily: "var(--font-mono)",
            zIndex: 20,
          }}
        >
          {/* Deck OS Indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#ffd84d",
                boxShadow: "0 0 10px #ffd84d",
              }}
            />
            <span style={{ fontSize: "12px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.1em" }}>
              ARCADE DECK <span style={{ color: "#4de8e8" }}>// BIG PICTURE OS</span>
            </span>
          </div>

          {/* Center Game Status */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontSize: "13px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.08em" }}>
              {game.name.toUpperCase()}
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#ffd84d",
                backgroundColor: "rgba(255, 216, 77, 0.1)",
                padding: "2px 8px",
                border: "1px solid rgba(255, 216, 77, 0.3)",
                borderRadius: "4px",
              }}
            >
              SCORE: {formatScore(score)}
            </span>
          </div>

          {/* Right Deck Info & Exit */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", color: "var(--color-text-dim)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Wifi size={14} color="#4de8e8" />
              <BatteryCharging size={14} color="#4de8e8" />
            </div>
            <span style={{ color: "#FFFFFF", fontWeight: 700 }}>{clockTime}</span>
            <button
              onClick={handleToggleFullscreen}
              title="Exit Fullscreen [ESC]"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                backgroundColor: "#101b30",
                border: "1px solid #233860",
                color: "#4de8e8",
                padding: "4px 10px",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                fontWeight: 800,
                cursor: "pointer",
                borderRadius: "4px",
              }}
            >
              <Minimize2 size={12} />
              <span>EXIT DECK</span>
            </button>
          </div>
        </header>
      )}

      {/* 1. LEFT SIDE: Info, Stats, & Dropdown Objective/Guide */}
      {!isFullscreen && (
        <aside
          className="arcade-info-box"
          style={{
            width: "300px",
            minWidth: "300px",
            backgroundColor: "#080e1c",
            border: "1px solid #1a2b4c",
            borderRadius: "8px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
            overflowY: "auto",
            maxHeight: "100%",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 900,
              color: accentColor,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: "14px",
              borderBottom: "1px solid #1a2b4c",
              paddingBottom: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Sliders size={13} color={accentColor} />
              <span>{specsLabel}</span>
            </div>
            <span
              style={{
                fontSize: "9px",
                color: accentColor,
                backgroundColor: accentBg,
                padding: "2px 6px",
                border: `1px solid ${accentBorder}`,
                borderRadius: "3px",
              }}
            >
              {(game.subcategory || game.genre).toUpperCase().replace("-", " ")}
            </span>
          </div>

          {/* Go to Home Page Button */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "10px 14px",
              backgroundColor: "#101b30",
              color: "#FFFFFF",
              border: "1px solid #233860",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.05em",
              textDecoration: "none",
              marginBottom: "14px",
              borderRadius: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <Home size={14} color="#ffd84d" />
            <span>EXPLORE CARTRIDGES</span>
          </Link>

          {/* Scoreboard Metrics */}
          <div
            style={{
              backgroundColor: "rgba(6, 11, 24, 0.8)",
              border: "1px solid #1a2b4c",
              borderRadius: "6px",
              padding: "12px",
              marginBottom: "14px",
              fontFamily: "var(--font-mono)",
            }}
          >
            <div style={{ fontSize: "10px", color: "var(--color-text-dim)", textTransform: "uppercase", marginBottom: "2px" }}>
              CURRENT SCORE
            </div>
            <div
              style={{
                fontSize: "26px",
                fontWeight: 900,
                color: accentColor,
                letterSpacing: "0.05em",
                textShadow: `0 0 12px ${accentGlow}`,
                lineHeight: 1.1,
                marginBottom: "8px",
              }}
            >
              {formatScore(score)}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", borderTop: "1px solid #1a2b4c", paddingTop: "8px" }}>
              <div>
                <span style={{ color: "var(--color-text-dim)", fontSize: "10px", display: "block" }}>BEST</span>
                <span style={{ color: "#FFFFFF", fontWeight: 700 }}>{formatScore(Math.max(score, highScore))}</span>
              </div>
              <div>
                <span style={{ color: "var(--color-text-dim)", fontSize: "10px", display: "block" }}>LEVEL</span>
                <span style={{ color: "#4de8e8", fontWeight: 700 }}>{level}</span>
              </div>
              {lines !== undefined && (
                <div>
                  <span style={{ color: "var(--color-text-dim)", fontSize: "10px", display: "block" }}>LINES</span>
                  <span style={{ color: "#ff5c8a", fontWeight: 700 }}>{lines}</span>
                </div>
              )}
              {lives !== undefined && (
                <div>
                  <span style={{ color: "var(--color-text-dim)", fontSize: "10px", display: "block" }}>LIVES</span>
                  <span style={{ color: "#ff5c8a", fontWeight: 700 }}>{lives}</span>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Dropdown: Game Guide & Mission Objective */}
          <div
            style={{
              backgroundColor: "rgba(6, 11, 24, 0.8)",
              border: "1px solid #1a2b4c",
              borderRadius: "6px",
              overflow: "hidden",
              marginBottom: "14px",
            }}
          >
            <button
              onClick={() => setIsGuideOpen(!isGuideOpen)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                backgroundColor: "#101b30",
                border: "none",
                color: "#FFFFFF",
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Target size={13} color="#ff5c8a" />
                <span>MISSION & PURPOSE</span>
              </div>
              {isGuideOpen ? <ChevronUp size={14} color="#4de8e8" /> : <ChevronDown size={14} color="#4de8e8" />}
            </button>

            {isGuideOpen && (
              <div
                style={{
                  padding: "12px",
                  fontSize: "12px",
                  color: "var(--color-text-dim)",
                  lineHeight: 1.5,
                  maxHeight: "220px",
                  overflowY: "auto",
                  borderTop: "1px solid #1a2b4c",
                }}
              >
                {/* Tagline / Purpose */}
                <div style={{ marginBottom: "10px" }}>
                  <div style={{ color: "#ffd84d", fontWeight: 800, fontSize: "11px", textTransform: "uppercase", marginBottom: "3px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <BookOpen size={11} /> Primary Objective:
                  </div>
                  <p style={{ margin: 0, color: "#e2e8f0", fontSize: "12px" }}>
                    {game.tagline}
                  </p>
                </div>

                {/* Detailed Description */}
                <div style={{ marginBottom: "10px" }}>
                  <div style={{ color: "#4de8e8", fontWeight: 800, fontSize: "11px", textTransform: "uppercase", marginBottom: "3px" }}>
                    How to Play:
                  </div>
                  <p style={{ margin: 0, color: "#94a3b8", fontSize: "11px" }}>
                    {game.description}
                  </p>
                </div>

                {/* Mathematical Concept */}
                {game.math && (
                  <div style={{ borderTop: "1px solid #1a2b4c", paddingTop: "8px" }}>
                    <div style={{ color: "#a879ff", fontWeight: 800, fontSize: "11px", textTransform: "uppercase", marginBottom: "3px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Cpu size={11} /> Math Foundation:
                    </div>
                    <div style={{ color: "#cbd5e1", fontSize: "11px", fontWeight: 700 }}>
                      {game.math.title}
                    </div>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "10px" }}>
                      {game.math.summary}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Key Bindings Cheatsheet */}
          <div style={{ fontFamily: "var(--font-mono)", flex: "1 0 auto" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "10px",
                color: "#94a3b8",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              <Keyboard size={12} color="#ffd84d" />
              <span>KEYBOARD CONTROLS</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
              {game.controls.keyboard.map((c, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <kbd
                    style={{
                      color: "#ffd84d",
                      backgroundColor: "#060b18",
                      padding: "2px 6px",
                      border: "1px solid #1a2b4c",
                      borderRadius: "3px",
                      fontSize: "10px",
                      fontWeight: 800,
                    }}
                  >
                    {c.key}
                  </kbd>
                  <span style={{ color: "var(--color-text-dim)", fontSize: "11px" }}>
                    {c.description.replace("Change Snake Heading", "Move").replace("Move Grid Cursor", "Move")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer info */}
          <div
            style={{
              borderTop: "1px solid #1a2b4c",
              paddingTop: "10px",
              marginTop: "12px",
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              color: "#64748b",
              textAlign: "center",
            }}
          >
            {game.name.toUpperCase()} • YEAR {game.year}
          </div>
        </aside>
      )}

      {/* 2. CENTER STAGE: Game Monitor, Icon Sub-Bar, & Mobile Touch Controls */}
      <main
        className="arcade-center-main"
        style={{
          flex: 1,
          width: isFullscreen ? "100%" : "auto",
          maxWidth: isFullscreen ? "860px" : "800px",
          height: isFullscreen ? "calc(100vh - 84px)" : "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          boxSizing: "border-box",
          minWidth: 0,
        }}
      >
        {/* Top Control Sub-Bar: Clean Icon-Only with Hover Tooltips */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#080e1c",
            border: "1px solid #1a2b4c",
            borderRadius: "6px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.6)",
            padding: "8px 14px",
            marginBottom: "8px",
            fontFamily: "var(--font-mono)",
            boxSizing: "border-box",
          }}
        >
          {/* Left: Title & Live Level Pill */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#ffd84d",
                boxShadow: "0 0 8px #ffd84d",
              }}
            />
            <span style={{ fontSize: "14px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.06em" }}>
              {game.name.toUpperCase()}
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#4de8e8",
                borderLeft: "1px solid #1a2b4c",
                paddingLeft: "8px",
              }}
            >
              LVL {level}
            </span>
          </div>

          {/* Right: Icon-Only Action Buttons with Hover Tooltips */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={handleTogglePause}
              title={isPaused ? "Resume Game (P)" : "Pause Game (P)"}
              aria-label={isPaused ? "Resume" : "Pause"}
              className="arcade-icon-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "34px",
                height: "34px",
                backgroundColor: isPaused ? "#ffd84d" : "#101b30",
                color: isPaused ? "#04060d" : "#FFFFFF",
                border: `1px solid ${isPaused ? "#ffd84d" : "#233860"}`,
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} />}
            </button>

            <button
              onClick={handleRestart}
              title="Restart Cartridge (R)"
              aria-label="Restart"
              className="arcade-icon-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "34px",
                height: "34px",
                backgroundColor: "#101b30",
                color: "#e2e8f0",
                border: "1px solid #233860",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <RotateCcw size={16} />
            </button>

            <button
              onClick={handleToggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen (ESC)" : "Enter Fullscreen (F)"}
              aria-label="Toggle Fullscreen"
              className="arcade-icon-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "34px",
                height: "34px",
                backgroundColor: isFullscreen ? "#1e355c" : "#101b30",
                color: isFullscreen ? "#ffd84d" : "#e2e8f0",
                border: "1px solid #233860",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <button
              onClick={handleToggleMute}
              title={isMuted ? "Unmute Synthesizer Audio (M)" : "Mute Synthesizer Audio (M)"}
              aria-label="Toggle Audio"
              className="arcade-icon-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "34px",
                height: "34px",
                backgroundColor: "#101b30",
                color: isMuted ? "#64748b" : "#4de8e8",
                border: "1px solid #233860",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>

        {/* Dynamic Responsive CRT Canvas Stage (~70-80% on Mobile) */}
        <div
          className="arcade-canvas-viewport"
          style={{
            position: "relative",
            width: "100%",
            flex: "1 1 0%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "0",
            overflow: "hidden",
          }}
        >
          <CRTOverlay enabled={crtEnabled} scanlines={crtEnabled}>
            <canvas
              ref={canvasRef}
              width={600}
              height={700}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                backgroundColor: "#050914",
                borderRadius: "4px",
              }}
            />
          </CRTOverlay>
        </div>

        {/* MOBILE CONTROLLER BAR (20-30% height on mobile screens) */}
        <div
          className="arcade-mobile-controller"
          style={{
            width: "100%",
            backgroundColor: "#080e1c",
            border: "1px solid #1a2b4c",
            borderRadius: "8px",
            padding: "10px 16px",
            marginTop: "8px",
            boxSizing: "border-box",
            display: "none", // Displayed via media queries on mobile
            justifyContent: "space-between",
            alignItems: "center",
            touchAction: "none",
            userSelect: "none",
          }}
        >
          {/* Left: 4-Way Virtual D-Pad */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 42px)",
              gridTemplateRows: "repeat(3, 42px)",
              gap: "3px",
            }}
          >
            <div />
            <button
              onPointerDown={() => triggerAction("MOVE_UP", true)}
              onPointerUp={() => triggerAction("MOVE_UP", false)}
              aria-label="Up"
              className="virtual-dpad-btn"
            >
              <ArrowUp size={20} />
            </button>
            <div />

            <button
              onPointerDown={() => triggerAction("MOVE_LEFT", true)}
              onPointerUp={() => triggerAction("MOVE_LEFT", false)}
              aria-label="Left"
              className="virtual-dpad-btn"
            >
              <ArrowLeft size={20} />
            </button>
            <div style={{ backgroundColor: "#0f1a30", borderRadius: "4px" }} />
            <button
              onPointerDown={() => triggerAction("MOVE_RIGHT", true)}
              onPointerUp={() => triggerAction("MOVE_RIGHT", false)}
              aria-label="Right"
              className="virtual-dpad-btn"
            >
              <ArrowRight size={20} />
            </button>

            <div />
            <button
              onPointerDown={() => triggerAction("MOVE_DOWN", true)}
              onPointerUp={() => triggerAction("MOVE_DOWN", false)}
              aria-label="Down"
              className="virtual-dpad-btn"
            >
              <ArrowDown size={20} />
            </button>
            <div />
          </div>

          {/* Center: Start / Pause & Restart */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
            <button
              onPointerDown={() => triggerAction("PAUSE", true)}
              onPointerUp={() => triggerAction("PAUSE", false)}
              className="virtual-sys-btn"
            >
              {isPaused ? "RESUME" : "PAUSE"}
            </button>
            <button
              onPointerDown={() => triggerAction("RESTART", true)}
              onPointerUp={() => triggerAction("RESTART", false)}
              className="virtual-sys-btn"
            >
              RESTART
            </button>
          </div>

          {/* Right: Arcade A & B Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Button B (Secondary / Rotate) */}
            <button
              onPointerDown={() => triggerAction("ACTION_SECONDARY", true)}
              onPointerUp={() => triggerAction("ACTION_SECONDARY", false)}
              className="virtual-action-btn action-b"
              aria-label="Action B"
            >
              <span>B</span>
            </button>

            {/* Button A (Primary Action) */}
            <button
              onPointerDown={() => triggerAction("ACTION_PRIMARY", true)}
              onPointerUp={() => triggerAction("ACTION_PRIMARY", false)}
              className="virtual-action-btn action-a"
              aria-label="Action A"
            >
              <span>A</span>
            </button>
          </div>
        </div>
      </main>

      {/* STEAM BIG PICTURE FULLSCREEN BOTTOM DECK ACTION BAR */}
      {isFullscreen && (
        <footer
          style={{
            width: "100%",
            height: "40px",
            backgroundColor: "#060b18",
            borderTop: "1px solid #1a2b4c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--color-text-dim)",
            zIndex: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <kbd style={{ backgroundColor: "#101b30", color: "#ffd84d", padding: "1px 5px", border: "1px solid #233860", borderRadius: "3px" }}>P</kbd>
            <span>PAUSE / RESUME</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <kbd style={{ backgroundColor: "#101b30", color: "#ffd84d", padding: "1px 5px", border: "1px solid #233860", borderRadius: "3px" }}>R</kbd>
            <span>RESTART</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <kbd style={{ backgroundColor: "#101b30", color: "#ffd84d", padding: "1px 5px", border: "1px solid #233860", borderRadius: "3px" }}>M</kbd>
            <span>MUTE</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <kbd style={{ backgroundColor: "#101b30", color: "#ffd84d", padding: "1px 5px", border: "1px solid #233860", borderRadius: "3px" }}>ESC</kbd>
            <span>EXIT DECK</span>
          </div>
        </footer>
      )}

      <style jsx global>{`
        .arcade-icon-btn:hover {
          background-color: #1e355c !important;
          border-color: #4de8e8 !important;
          box-shadow: 0 0 10px rgba(77, 232, 232, 0.3) !important;
        }

        .virtual-dpad-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #101b30;
          color: #4de8e8;
          border: 1px solid #233860;
          border-radius: 6px;
          cursor: pointer;
          user-select: none;
          touch-action: manipulation;
        }
        .virtual-dpad-btn:active {
          background-color: #4de8e8;
          color: #04060d;
        }

        .virtual-sys-btn {
          background-color: #101b30;
          color: #94a3b8;
          border: 1px solid #233860;
          padding: 4px 10px;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 800;
          border-radius: 4px;
          cursor: pointer;
        }
        .virtual-sys-btn:active {
          background-color: #ffd84d;
          color: #04060d;
        }

        .virtual-action-btn {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-pixel);
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
          user-select: none;
          touch-action: manipulation;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
          transition: transform 0.05s ease;
        }
        .virtual-action-btn:active {
          transform: scale(0.92);
        }
        .action-a {
          background: linear-gradient(180deg, #ffd84d 0%, #f59e0b 100%);
          color: #04060d;
          border: 2px solid #fffbeb;
        }
        .action-b {
          background: linear-gradient(180deg, #ff5c8a 0%, #e11d48 100%);
          color: #ffffff;
          border: 2px solid #ffe4e6;
        }

        /* 70-30 / 80-20 Mobile Ratio Optimization */
        @media (max-width: 860px) {
          .arcade-info-box {
            display: none !important;
          }
          .arcade-cockpit-stage {
            height: calc(100vh - 64px) !important;
            max-height: calc(100vh - 64px) !important;
            padding: 4px 8px 8px 8px !important;
          }
          .arcade-center-main {
            height: 100% !important;
            max-height: 100% !important;
          }
          .arcade-canvas-viewport {
            flex: 7 1 0% !important; /* ~70-75% screen */
          }
          .arcade-mobile-controller {
            display: flex !important;
            flex: 3 0 auto !important; /* ~25-30% screen */
          }
        }
      `}</style>
    </div>
  );
};
