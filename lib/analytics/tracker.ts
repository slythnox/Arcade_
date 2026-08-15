export type AnalyticsEventType =
  | "page_view"
  | "game_view"
  | "game_start"
  | "game_pause"
  | "game_restart"
  | "game_complete"
  | "game_exit"
  | "search"
  | "search_result_click"
  | "random_game"
  | "favorite_game"
  | "easter_egg_unlocked"
  | "daily_challenge_start";

export interface AnalyticsPayload {
  gameId?: string;
  query?: string;
  score?: number;
  level?: number;
  duration?: number;
  platform?: string;
  [key: string]: unknown;
}

/**
 * Centralized telemetry & analytics event dispatcher.
 */
export function track(event: AnalyticsEventType, payload: AnalyticsPayload = {}): void {
  if (typeof window === "undefined") return;

  // Local debug log in development
  if (process.env.NODE_ENV === "development") {
    // console.debug(`[ANALYTICS] ${event}:`, payload);
  }

  // Safe dispatch to custom window event or external privacy-conscious aggregator
  try {
    const customEvent = new CustomEvent("arcade_analytics", {
      detail: { event, payload, timestamp: Date.now() },
    });
    window.dispatchEvent(customEvent);
  } catch {}
}
