export interface PlayerSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  volume: number; // 0.0 to 1.0
  crtEnabled: boolean;
  scanlinesEnabled: boolean;
  reducedMotion: boolean;
  theme: "arcade" | "gameboy" | "nes" | "handheld";
}

export interface PlayerStats {
  gamesPlayed: number;
  totalPlayTimeSeconds: number;
  highScores: Record<string, number>;
  cartridgesUnlocked: string[];
  favorites: string[];
  lastPlayed?: {
    gameId: string;
    timestamp: number;
  };
}

export interface GameSessionSummary {
  gameId: string;
  seed: number;
  score: number;
  level: number;
  lines?: number;
  durationSeconds: number;
  completedAt: number;
}
