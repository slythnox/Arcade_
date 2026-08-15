import type { PlayerSettings } from "../../core/types/player";
import { DEFAULT_PLAYER_SETTINGS } from "../../core/constants/game";
import { getStorageItem, setStorageItem } from "./localStorage";

export function loadPlayerSettings(): PlayerSettings {
  return getStorageItem<PlayerSettings>("settings", DEFAULT_PLAYER_SETTINGS);
}

export function savePlayerSettings(settings: Partial<PlayerSettings>): PlayerSettings {
  const current = loadPlayerSettings();
  const updated: PlayerSettings = { ...current, ...settings };
  setStorageItem("settings", updated);
  return updated;
}
