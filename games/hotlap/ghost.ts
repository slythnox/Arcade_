/** ARCADE_ v1.2.2 */
import type { GhostSample, SectorSplit } from "./types";
import { getStorageItem, setStorageItem } from "../../lib/storage/localStorage";

export class GhostManager {
  public currentLapSamples: GhostSample[] = [];
  public bestLapSamples: GhostSample[] = [];
  public bestLapTime: number | null = null;
  public bestSectors: SectorSplit = { s1Time: null, s2Time: null, s3Time: null, lapTime: null };
  private sampleTimer: number = 0;
  private readonly sampleInterval: number = 0.05; // 20Hz ghost recording frequency

  constructor(trackId: string) {
    this.loadBest(trackId);
  }

  public loadBest(trackId: string): void {
    const storageKey = `hotlap:ghost:${trackId}`;
    const data = getStorageItem<{
      lapTime: number;
      sectors: SectorSplit;
      samples: GhostSample[];
    } | null>(storageKey, null);

    if (data && data.samples && data.samples.length > 0) {
      this.bestLapTime = data.lapTime;
      this.bestSectors = data.sectors || { s1Time: null, s2Time: null, s3Time: null, lapTime: data.lapTime };
      this.bestLapSamples = data.samples;
    } else {
      this.bestLapTime = null;
      this.bestSectors = { s1Time: null, s2Time: null, s3Time: null, lapTime: null };
      this.bestLapSamples = [];
    }
  }

  public startNewLap(): void {
    this.currentLapSamples = [];
    this.sampleTimer = 0;
  }

  public recordTick(
    dt: number,
    progress: number,
    lapTime: number,
    x: number,
    y: number,
    angle: number,
    speed: number
  ): void {
    this.sampleTimer += dt;
    if (this.sampleTimer >= this.sampleInterval) {
      this.sampleTimer = 0;
      this.currentLapSamples.push({
        progress,
        time: lapTime,
        x,
        y,
        angle,
        speed,
      });
    }
  }

  public saveCompletedLapIfBest(trackId: string, lapTime: number, sectors: SectorSplit): boolean {
    const isBest = this.bestLapTime === null || lapTime < this.bestLapTime;
    if (isBest && this.currentLapSamples.length >= 2) {
      this.bestLapTime = lapTime;
      this.bestSectors = sectors;
      this.bestLapSamples = [...this.currentLapSamples];

      const storageKey = `hotlap:ghost:${trackId}`;
      setStorageItem(storageKey, {
        lapTime,
        sectors,
        samples: this.bestLapSamples,
      });
      return true;
    }
    return false;
  }

  /**
   * Interpolates the ghost car state at the given lap time.
   */
  public getGhostAtTime(time: number): { x: number; y: number; angle: number; speed: number; progress: number } | null {
    if (this.bestLapSamples.length < 2) return null;

    // Binary search or linear scan for time slice
    const samples = this.bestLapSamples;
    if (time <= samples[0].time) {
      return samples[0];
    }
    if (time >= samples[samples.length - 1].time) {
      return samples[samples.length - 1];
    }

    let low = 0;
    let high = samples.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (samples[mid].time < time) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const idx0 = Math.max(0, low - 1);
    const idx1 = Math.min(samples.length - 1, low);
    const s0 = samples[idx0];
    const s1 = samples[idx1];

    const span = s1.time - s0.time;
    const t = span > 0 ? (time - s0.time) / span : 0;

    return {
      x: s0.x + (s1.x - s0.x) * t,
      y: s0.y + (s1.y - s0.y) * t,
      angle: s0.angle + (s1.angle - s0.angle) * t,
      speed: s0.speed + (s1.speed - s0.speed) * t,
      progress: s0.progress + (s1.progress - s0.progress) * t,
    };
  }

  /**
   * Calculates live delta time between player's current progress and ghost time at same progress.
   * Returns negative (e.g. -0.35s = player is ahead of ghost, green) or positive (red).
   */
  public getLiveDelta(playerProgress: number, playerLapTime: number): number | null {
    if (this.bestLapSamples.length < 2 || this.bestLapTime === null) return null;

    // Find ghost sample closest to playerProgress
    const samples = this.bestLapSamples;
    let closestTime = samples[0].time;
    let minDiff = Infinity;

    for (let i = 0; i < samples.length; i++) {
      const diff = Math.abs(samples[i].progress - playerProgress);
      if (diff < minDiff) {
        minDiff = diff;
        closestTime = samples[i].time;
      }
    }

    // Delta = Player current time - Ghost time at this exact track point
    return playerLapTime - closestTime;
  }
}
