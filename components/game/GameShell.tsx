/** ARCADE_ v1.2.2 */
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
  Gamepad2,
  Tv,
} from "lucide-react";

/* ─────────────── 4-Way & 8-Way Radial Directional Navigation Dial ─────────────── */
const RadialNavigationDial: React.FC<{
  onAction: (action: GameAction, isPressed: boolean) => void;
  showHints?: boolean;
}> = ({ onAction, showHints = false }) => {
  const dialRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeDirs, setActiveDirs] = useState<{ up: boolean; down: boolean; left: boolean; right: boolean }>({
    up: false,
    down: false,
    left: false,
    right: false,
  });
  const activeDirsRef = useRef<{ up: boolean; down: boolean; left: boolean; right: boolean }>({
    up: false,
    down: false,
    left: false,
    right: false,
  });
  const isDraggingRef = useRef(false);

  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!dialRef.current) return;
      const rect = dialRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const distance = Math.hypot(dx, dy);
      const maxRadius = 32;

      const newDirs = {
        up: false,
        down: false,
        left: false,
        right: false,
      };

      if (distance > 7) {
        if (dx > 7) newDirs.right = true;
        if (dx < -7) newDirs.left = true;
        if (dy < -7) newDirs.up = true;
        if (dy > 7) newDirs.down = true;
      }

      const clampedDist = Math.min(distance, maxRadius);
      const angleRad = Math.atan2(dy, dx);
      const knobX = distance === 0 ? 0 : Math.cos(angleRad) * clampedDist;
      const knobY = distance === 0 ? 0 : Math.sin(angleRad) * clampedDist;

      setKnobPos({ x: knobX, y: knobY });

      const prev = activeDirsRef.current;
      if (newDirs.up !== prev.up) onAction("MOVE_UP", newDirs.up);
      if (newDirs.down !== prev.down) onAction("MOVE_DOWN", newDirs.down);
      if (newDirs.left !== prev.left) onAction("MOVE_LEFT", newDirs.left);
      if (newDirs.right !== prev.right) onAction("MOVE_RIGHT", newDirs.right);

      activeDirsRef.current = newDirs;
      setActiveDirs(newDirs);
    },
    [onAction]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    isDraggingRef.current = true;
    handlePointer(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      handlePointer(e.clientX, e.clientY);
    }
  };

  const onPointerEnd = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      isDraggingRef.current = false;
      setKnobPos({ x: 0, y: 0 });
      const prev = activeDirsRef.current;
      if (prev.up) onAction("MOVE_UP", false);
      if (prev.down) onAction("MOVE_DOWN", false);
      if (prev.left) onAction("MOVE_LEFT", false);
      if (prev.right) onAction("MOVE_RIGHT", false);
      const cleared = { up: false, down: false, left: false, right: false };
      activeDirsRef.current = cleared;
      setActiveDirs(cleared);
    }
  };

  const hasAnyActive = activeDirs.up || activeDirs.down || activeDirs.left || activeDirs.right;

  return (
    <div
      ref={dialRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      style={{
        position: "relative",
        width: "100px",
        height: "100px",
        borderRadius: "50%",
        backgroundColor: "#161a24",
        backgroundImage: "radial-gradient(circle at center, #242c3d 0%, #161a24 60%, #0d1017 100%)",
        border: "2px solid #2e3b52",
        boxShadow: "inset 0 2px 10px rgba(0,0,0,0.8), 0 4px 14px rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        touchAction: "none",
        cursor: "grab",
        userSelect: "none",
      }}
    >
      {/* SVG Concentric Gauge, 4 Cardinal Chevrons & Glowing Vector Line */}
      <svg
        width="100"
        height="100"
        viewBox="0 0 100 100"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {/* Concentric rings */}
        <circle cx="50" cy="50" r="44" fill="none" stroke="#2a384f" strokeWidth="1.2" opacity="0.6" />
        <circle cx="50" cy="50" r="34" fill="none" stroke="#32435d" strokeWidth="1" strokeDasharray="4 2" opacity="0.4" />
        <circle cx="50" cy="50" r="25" fill="none" stroke="#222f42" strokeWidth="1.5" opacity="0.8" />
        <circle cx="50" cy="50" r="16" fill="none" stroke="#182333" strokeWidth="1" opacity="0.5" />

        {/* Vector Line Indicator from center to active knob */}
        {hasAnyActive && (
          <line
            x1="50"
            y1="50"
            x2={50 + knobPos.x * 1.15}
            y2={50 + knobPos.y * 1.15}
            stroke="#ffffff"
            strokeWidth="2.0"
            strokeLinecap="round"
            filter="drop-shadow(0 0 4px #4de8e8)"
          />
        )}

        {/* Cardinal Direction Hints when switching */}
        {showHints && (
          <g fill="#ffd84d" fontSize="7" fontFamily="var(--font-mono)" fontWeight="900" textAnchor="middle">
            <text x="50" y="24">UP</text>
            <text x="50" y="82">DN</text>
            <text x="24" y="52.5">LT</text>
            <text x="76" y="52.5">RT</text>
          </g>
        )}

        {/* Top Chevron (Up) */}
        <path
          d="M 45 13 L 50 7 L 55 13"
          stroke={activeDirs.up ? "#ffffff" : "rgba(255, 255, 255, 0.45)"}
          strokeWidth={activeDirs.up ? "2.5" : "1.8"}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={activeDirs.up ? "drop-shadow(0 0 6px #4de8e8)" : undefined}
        />

        {/* Bottom Chevron (Down) */}
        <path
          d="M 45 87 L 50 93 L 55 87"
          stroke={activeDirs.down ? "#ffffff" : "rgba(255, 255, 255, 0.45)"}
          strokeWidth={activeDirs.down ? "2.5" : "1.8"}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={activeDirs.down ? "drop-shadow(0 0 6px #4de8e8)" : undefined}
        />

        {/* Left Chevron (Left) */}
        <path
          d="M 13 45 L 7 50 L 13 55"
          stroke={activeDirs.left ? "#ffffff" : "rgba(255, 255, 255, 0.45)"}
          strokeWidth={activeDirs.left ? "2.5" : "1.8"}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={activeDirs.left ? "drop-shadow(0 0 6px #4de8e8)" : undefined}
        />

        {/* Right Chevron (Right) */}
        <path
          d="M 87 45 L 93 50 L 87 55"
          stroke={activeDirs.right ? "#ffffff" : "rgba(255, 255, 255, 0.45)"}
          strokeWidth={activeDirs.right ? "2.5" : "1.8"}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={activeDirs.right ? "drop-shadow(0 0 6px #4de8e8)" : undefined}
        />
      </svg>

      {/* Central Metallic Thumb Hub / Knob */}
      <div
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "50%",
          backgroundColor: "#182030",
          backgroundImage: "radial-gradient(circle at center, #2a3854 0%, #172030 50%, #0d131f 100%)",
          border: "2px solid #3b4d6e",
          boxShadow: "0 3px 12px rgba(0,0,0,0.8), inset 0 1px 3px rgba(255,255,255,0.2)",
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          transition: isDraggingRef.current ? "none" : "transform 0.15s cubic-bezier(0.2, 0.9, 0.3, 1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        {/* Inner concentric ring with central indicator dot */}
        <div
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            backgroundColor: "#0d131f",
            border: "1px solid #233045",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              backgroundColor: hasAnyActive ? "#4de8e8" : "rgba(255,255,255,0.5)",
              boxShadow: hasAnyActive ? "0 0 6px #4de8e8" : "none",
            }}
          />
        </div>
      </div>
    </div>
  );
};

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

  // Mobile controller layout state ('classic' = 4-way DPad + A/B; 'dpad-4btn' = 4-way DPad + 4-button cluster)
  const [controlLayout, setControlLayout] = useState<"classic" | "dpad-4btn">("classic");
  const [isLayoutDropdownOpen, setIsLayoutDropdownOpen] = useState(false);
  const [showLayoutHint, setShowLayoutHint] = useState(false);
  const hintTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSwitchLayout = useCallback((layout: "classic" | "dpad-4btn") => {
    setControlLayout(layout);
    setIsLayoutDropdownOpen(false);
    setShowLayoutHint(true);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => {
      setShowLayoutHint(false);
    }, 2800);
  }, []);

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
        maxWidth: isFullscreen ? "100vw" : "min(1920px, 98vw)",
        height: isFullscreen ? "100vh" : "calc(100vh - var(--header-height, 64px) - 16px)",
        maxHeight: isFullscreen ? "100vh" : "calc(100vh - var(--header-height, 64px) - 16px)",
        display: "flex",
        flexDirection: isFullscreen ? "column" : "row",
        justifyContent: "center",
        alignItems: "stretch",
        gap: isFullscreen ? "0" : "clamp(12px, 1.5vw, 24px)",
        padding: isFullscreen ? "0" : "0 clamp(8px, 1.5vw, 24px) 12px clamp(8px, 1.5vw, 24px)",
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
            width: "clamp(240px, 18vw, 320px)",
            minWidth: "220px",
            maxWidth: "340px",
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
          maxWidth: isFullscreen ? "100%" : "min(1360px, 100%)",
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
              onClick={() => setCrtEnabled((prev) => !prev)}
              title={crtEnabled ? "Disable CRT Scanlines" : "Enable CRT Scanlines"}
              aria-label="Toggle CRT Scanlines"
              className="arcade-icon-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "34px",
                height: "34px",
                backgroundColor: crtEnabled ? "#1e355c" : "#101b30",
                color: crtEnabled ? "#4de8e8" : "#64748b",
                border: `1px solid ${crtEnabled ? "#4de8e8" : "#233860"}`,
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Tv size={16} />
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

        {/* Dynamic Responsive CRT Canvas Stage (Maximized to screen size) */}
        <div
          className="arcade-canvas-viewport"
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            flex: "1 1 0%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "0",
            overflow: "hidden",
          }}
        >
          <CRTOverlay
            enabled={crtEnabled}
            scanlines={crtEnabled}
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <canvas
              ref={canvasRef}
              width={600}
              height={700}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "fill",
                backgroundColor: "#050914",
                borderRadius: "4px",
              }}
            />
          </CRTOverlay>
        </div>

        {/* MOBILE CONTROLLER BAR (Exact 75-25 screen ratio on mobile screens) */}
        <div
          className="arcade-mobile-controller"
          style={{
            width: "100%",
            backgroundColor: "#080e1c",
            border: "1px solid #1a2b4c",
            borderRadius: "8px",
            padding: "26px 10px 6px 10px",
            boxSizing: "border-box",
            display: "none", // Displayed via media queries on mobile
            justifyContent: "space-between",
            alignItems: "center",
            touchAction: "none",
            userSelect: "none",
            position: "relative",
          }}
        >
          {/* TOP-MIDDLE: CONTROL LAYOUT SWITCHER DROPDOWN */}
          <div style={{ position: "absolute", top: "4px", left: "50%", transform: "translateX(-50%)", zIndex: 40 }}>
            <button
              onClick={() => setIsLayoutDropdownOpen(!isLayoutDropdownOpen)}
              className="virtual-layout-toggle-btn"
              title="Switch Touch Control Layout"
            >
              <Gamepad2 size={11} color="#4de8e8" />
              <span>{controlLayout === "classic" ? "CLASSIC D-PAD ▾" : "RADIAL DIAL ▾"}</span>
            </button>

            {isLayoutDropdownOpen && (
              <div className="virtual-layout-menu">
                <button
                  onClick={() => handleSwitchLayout("classic")}
                  className={`virtual-layout-menu-item ${controlLayout === "classic" ? "active" : ""}`}
                >
                  🎮 Layout 1: Classic D-Pad (A/B)
                </button>
                <button
                  onClick={() => handleSwitchLayout("dpad-4btn")}
                  className={`virtual-layout-menu-item ${controlLayout === "dpad-4btn" ? "active" : ""}`}
                >
                  🕹️ Layout 2: Radial 4-Way Dial + Buttons
                </button>
              </div>
            )}
          </div>

          {/* TOP OVERVIEW HUD BANNER (Displays for 2.8s after switching) */}
          {showLayoutHint && (
            <div className="layout-hud-banner">
              {controlLayout === "classic"
                ? "🎮 D-PAD [MOVE] · [A] ACTION · [B] ROTATE"
                : "🕹️ RADIAL [DRAG/TAP] · [X] ROTATE · [Y] HOLD · [A] FIRE · [B] DROP"}
            </div>
          )}

          {/* LEFT: DIRECTIONAL CONTROLS */}
          <div style={{ position: "relative" }}>
            {controlLayout === "classic" ? (
              /* Classic 3x3 D-Pad */
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 38px)",
                  gridTemplateRows: "repeat(3, 38px)",
                  gap: "3px",
                }}
              >
                <div />
                <button
                  onPointerDown={() => triggerAction("MOVE_UP", true)}
                  onPointerUp={() => triggerAction("MOVE_UP", false)}
                  onPointerLeave={() => triggerAction("MOVE_UP", false)}
                  aria-label="Up"
                  className="virtual-dpad-btn"
                  style={{ position: "relative" }}
                >
                  <ArrowUp size={18} />
                  {showLayoutHint && <span className="btn-hint-tag">UP</span>}
                </button>
                <div />

                <button
                  onPointerDown={() => triggerAction("MOVE_LEFT", true)}
                  onPointerUp={() => triggerAction("MOVE_LEFT", false)}
                  onPointerLeave={() => triggerAction("MOVE_LEFT", false)}
                  aria-label="Left"
                  className="virtual-dpad-btn"
                  style={{ position: "relative" }}
                >
                  <ArrowLeft size={18} />
                  {showLayoutHint && <span className="btn-hint-tag">LEFT</span>}
                </button>
                <div style={{ backgroundColor: "#0f1a30", borderRadius: "4px" }} />
                <button
                  onPointerDown={() => triggerAction("MOVE_RIGHT", true)}
                  onPointerUp={() => triggerAction("MOVE_RIGHT", false)}
                  onPointerLeave={() => triggerAction("MOVE_RIGHT", false)}
                  aria-label="Right"
                  className="virtual-dpad-btn"
                  style={{ position: "relative" }}
                >
                  <ArrowRight size={18} />
                  {showLayoutHint && <span className="btn-hint-tag">RIGHT</span>}
                </button>

                <div />
                <button
                  onPointerDown={() => triggerAction("MOVE_DOWN", true)}
                  onPointerUp={() => triggerAction("MOVE_DOWN", false)}
                  onPointerLeave={() => triggerAction("MOVE_DOWN", false)}
                  aria-label="Down"
                  className="virtual-dpad-btn"
                  style={{ position: "relative" }}
                >
                  <ArrowDown size={18} />
                  {showLayoutHint && <span className="btn-hint-tag">DOWN</span>}
                </button>
                <div />
              </div>
            ) : (
              /* Layout 2: Radial 4-Way Navigation Dial from Reference Image */
              <RadialNavigationDial onAction={triggerAction} showHints={showLayoutHint} />
            )}
          </div>

          {/* CENTER: SYSTEM CONTROLS (PAUSE & RESTART) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center", position: "relative" }}>
            <button
              onPointerDown={() => triggerAction("PAUSE", true)}
              onPointerUp={() => triggerAction("PAUSE", false)}
              className="virtual-sys-btn"
              style={{ position: "relative" }}
            >
              {isPaused ? "RESUME" : "PAUSE"}
              {showLayoutHint && <span className="btn-hint-tag">PAUSE</span>}
            </button>
            <button
              onPointerDown={() => triggerAction("RESTART", true)}
              onPointerUp={() => triggerAction("RESTART", false)}
              className="virtual-sys-btn"
              style={{ position: "relative" }}
            >
              RESTART
              {showLayoutHint && <span className="btn-hint-tag">RESET</span>}
            </button>
          </div>

          {/* RIGHT: ACTION BUTTONS */}
          <div style={{ position: "relative" }}>
            {controlLayout === "classic" ? (
              /* Layout 1: Dual A & B Buttons */
              <div style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative" }}>
                {/* Button B (Secondary / Rotate) */}
                <button
                  onPointerDown={() => {
                    triggerAction("ACTION_SECONDARY", true);
                    triggerAction("ROTATE", true);
                  }}
                  onPointerUp={() => {
                    triggerAction("ACTION_SECONDARY", false);
                    triggerAction("ROTATE", false);
                  }}
                  onPointerLeave={() => {
                    triggerAction("ACTION_SECONDARY", false);
                    triggerAction("ROTATE", false);
                  }}
                  className="virtual-action-btn action-b"
                  aria-label="Action B"
                  style={{ position: "relative" }}
                >
                  <span>B</span>
                  {showLayoutHint && <span className="btn-hint-tag">ROTATE</span>}
                </button>

                {/* Button A (Primary Action) */}
                <button
                  onPointerDown={() => triggerAction("ACTION_PRIMARY", true)}
                  onPointerUp={() => triggerAction("ACTION_PRIMARY", false)}
                  onPointerLeave={() => triggerAction("ACTION_PRIMARY", false)}
                  className="virtual-action-btn action-a"
                  aria-label="Action A"
                  style={{ position: "relative" }}
                >
                  <span>A</span>
                  {showLayoutHint && <span className="btn-hint-tag">ACTION</span>}
                </button>
              </div>
            ) : (
              /* Layout 2: 4-Button Diamond Action Cluster */
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 34px)",
                  gridTemplateRows: "repeat(3, 34px)",
                  gap: "3px",
                  alignItems: "center",
                  justifyItems: "center",
                  position: "relative",
                }}
              >
                <div />
                {/* Top: X (Rotate / Alt Action) */}
                <button
                  onPointerDown={() => triggerAction("ROTATE", true)}
                  onPointerUp={() => triggerAction("ROTATE", false)}
                  onPointerLeave={() => triggerAction("ROTATE", false)}
                  className="virtual-action-btn-sm action-x"
                  aria-label="Rotate / X"
                  title="Rotate / Action X"
                  style={{ position: "relative" }}
                >
                  <span>X</span>
                  {showLayoutHint && <span className="btn-hint-tag-sm">ROTATE</span>}
                </button>
                <div />

                {/* Left: Y (Hold / Secondary Action) */}
                <button
                  onPointerDown={() => triggerAction("ACTION_SECONDARY", true)}
                  onPointerUp={() => triggerAction("ACTION_SECONDARY", false)}
                  onPointerLeave={() => triggerAction("ACTION_SECONDARY", false)}
                  className="virtual-action-btn-sm action-y"
                  aria-label="Hold / Y"
                  title="Secondary / Action Y"
                  style={{ position: "relative" }}
                >
                  <span>Y</span>
                  {showLayoutHint && <span className="btn-hint-tag-sm">HOLD</span>}
                </button>
                <div />
                {/* Right: B (Secondary / Drop / Back) */}
                <button
                  onPointerDown={() => {
                    triggerAction("ACTION_SECONDARY", true);
                    triggerAction("MOVE_DOWN", true);
                  }}
                  onPointerUp={() => {
                    triggerAction("ACTION_SECONDARY", false);
                    triggerAction("MOVE_DOWN", false);
                  }}
                  onPointerLeave={() => {
                    triggerAction("ACTION_SECONDARY", false);
                    triggerAction("MOVE_DOWN", false);
                  }}
                  className="virtual-action-btn-sm action-b"
                  aria-label="Action B"
                  title="Action B"
                  style={{ position: "relative" }}
                >
                  <span>B</span>
                  {showLayoutHint && <span className="btn-hint-tag-sm">DROP</span>}
                </button>

                <div />
                {/* Bottom: A (Primary / Confirm / Jump) */}
                <button
                  onPointerDown={() => triggerAction("ACTION_PRIMARY", true)}
                  onPointerUp={() => triggerAction("ACTION_PRIMARY", false)}
                  onPointerLeave={() => triggerAction("ACTION_PRIMARY", false)}
                  className="virtual-action-btn-sm action-a"
                  aria-label="Action A"
                  title="Primary Action A"
                  style={{ position: "relative" }}
                >
                  <span>A</span>
                  {showLayoutHint && <span className="btn-hint-tag-sm">FIRE</span>}
                </button>
                <div />
              </div>
            )}
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

        .virtual-cross-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #101d36;
          color: #ffd84d;
          border: 1px solid #2a4374;
          border-radius: 4px;
          cursor: pointer;
          user-select: none;
          touch-action: manipulation;
        }
        .virtual-cross-btn:active {
          background-color: #ffd84d;
          color: #04060d;
        }

        .virtual-layout-toggle-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background-color: rgba(77, 232, 232, 0.1);
          color: #4de8e8;
          border: 1px solid rgba(77, 232, 232, 0.3);
          padding: 3px 8px;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 800;
          border-radius: 12px;
          cursor: pointer;
          touch-action: manipulation;
          transition: all 0.15s ease;
        }
        .virtual-layout-toggle-btn:active {
          background-color: rgba(77, 232, 232, 0.25);
        }

        .virtual-layout-menu {
          position: absolute;
          top: calc(100% + 4px);
          left: 50%;
          transform: translateX(-50%);
          background-color: #0b1528;
          border: 1px solid #233860;
          border-radius: 6px;
          padding: 4px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 190px;
          z-index: 100;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.8);
        }

        .virtual-layout-menu-item {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          padding: 6px 8px;
          text-align: left;
          border-radius: 4px;
          cursor: pointer;
          white-space: nowrap;
        }
        .virtual-layout-menu-item.active {
          background-color: rgba(77, 232, 232, 0.15);
          color: #4de8e8;
          font-weight: 900;
        }

        .virtual-sys-btn {
          background-color: #101b30;
          color: #94a3b8;
          border: 1px solid #233860;
          padding: 4px 8px;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 800;
          border-radius: 4px;
          cursor: pointer;
          touch-action: manipulation;
        }
        .virtual-sys-btn:active {
          background-color: #ffd84d;
          color: #04060d;
        }

        .virtual-action-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-pixel);
          font-size: 15px;
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

        .virtual-action-btn-sm {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-pixel);
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
          user-select: none;
          touch-action: manipulation;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.5);
          transition: transform 0.05s ease;
        }
        .virtual-action-btn-sm:active {
          transform: scale(0.92);
        }

        .btn-hint-tag {
          position: absolute;
          inset: 0;
          background: rgba(6, 12, 26, 0.95);
          color: #ffd84d;
          border: 1.5px solid #ffd84d;
          border-radius: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono);
          font-size: 8.5px;
          font-weight: 900;
          letter-spacing: 0.03em;
          pointer-events: none;
          z-index: 50;
          box-shadow: 0 0 10px rgba(255, 216, 77, 0.5);
          animation: hintTagAnim 2.8s ease-in-out forwards;
        }

        .btn-hint-tag-sm {
          position: absolute;
          inset: 0;
          background: rgba(6, 12, 26, 0.95);
          color: #4de8e8;
          border: 1.5px solid #4de8e8;
          border-radius: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono);
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.02em;
          pointer-events: none;
          z-index: 50;
          box-shadow: 0 0 8px rgba(77, 232, 232, 0.5);
          animation: hintTagAnim 2.8s ease-in-out forwards;
        }

        .layout-hud-banner {
          position: absolute;
          top: 26px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(4, 8, 18, 0.95);
          color: #ffd84d;
          border: 1px solid rgba(255, 216, 77, 0.6);
          padding: 2px 10px;
          border-radius: 10px;
          font-family: var(--font-mono);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.04em;
          white-space: nowrap;
          pointer-events: none;
          z-index: 45;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.9);
          animation: hintTagAnim 2.8s ease-in-out forwards;
        }

        @keyframes hintTagAnim {
          0% {
            opacity: 0;
            transform: scale(0.92);
          }
          10% {
            opacity: 1;
            transform: scale(1);
          }
          85% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.92);
          }
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
        .action-x {
          background: linear-gradient(180deg, #4de8e8 0%, #0284c7 100%);
          color: #04060d;
          border: 2px solid #e0f2fe;
        }
        .action-y {
          background: linear-gradient(180deg, #a879ff 0%, #7c3aed 100%);
          color: #ffffff;
          border: 2px solid #f3e8ff;
        }

        /* Medium screens (861px - 1080px): Compact sidebar to prioritize play area */
        @media (max-width: 1080px) and (min-width: 861px) {
          .arcade-info-box {
            width: 220px !important;
            min-width: 220px !important;
            padding: 10px !important;
          }
        }

        /* 75-25 Mobile Ratio Optimization */
        @media (max-width: 860px) {
          .arcade-info-box {
            display: none !important;
          }
          .arcade-cockpit-stage {
            height: calc(100dvh - var(--header-height, 64px) - 8px) !important;
            max-height: calc(100dvh - var(--header-height, 64px) - 8px) !important;
            padding: 2px 6px 6px 6px !important;
            gap: 4px !important;
          }
          .arcade-center-main {
            height: 100% !important;
            max-height: 100% !important;
            gap: 4px !important;
          }
          .arcade-canvas-viewport {
            flex: 3 1 0% !important; /* 75% screen ratio */
            min-height: 0 !important;
          }
          .arcade-mobile-controller {
            display: flex !important;
            flex: 1 0 auto !important; /* 25% screen ratio */
            padding: 24px 10px 8px 10px !important;
            margin-top: 0 !important;
            max-height: 25vh !important;
          }
        }

        /* Large & Ultra-Wide Displays (1440p / 4K / Ultrawides) */
        @media (min-width: 1600px) {
          .arcade-cockpit-stage {
            max-height: calc(100vh - var(--header-height, 64px) - 20px) !important;
          }
        }
      `}</style>
    </div>
  );
};
