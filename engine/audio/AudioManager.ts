/**
 * Procedural Retro Audio Synthesizer utilizing HTML5 Web Audio API.
 * Synthesizes 8-bit chip tunes and SFX in real time without external audio files.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.7;

  constructor() {
    // Lazy AudioContext initialization on first user interaction to comply with browser autoplay policies
  }

  private initContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    return this.ctx;
  }

  private muteListeners: Set<(muted: boolean) => void> = new Set();

  public subscribeMuteChange(listener: (muted: boolean) => void): () => void {
    this.muteListeners.add(listener);
    listener(this.isMuted);
    return () => {
      this.muteListeners.delete(listener);
    };
  }

  private notifyMuteListeners(): void {
    this.muteListeners.forEach((listener) => listener(this.isMuted));
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
    this.notifyMuteListeners();
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Generates custom retro tone with envelope.
   */
  public playTone(
    frequency: number,
    type: OscillatorType,
    durationMs: number,
    gainLevel: number = 0.3,
    frequencySlideTo?: number
  ): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      if (frequencySlideTo !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(1, frequencySlideTo),
          ctx.currentTime + durationMs / 1000
        );
      }

      // Quick attack and decay
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(gainLevel, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000 + 0.05);
    } catch {
      // Ignore Web Audio context errors
    }
  }

  // --- Retro Sound Presets ---

  public playMove(): void {
    this.playTone(220, "square", 40, 0.15);
  }

  public playRotate(): void {
    this.playTone(330, "triangle", 60, 0.2, 440);
  }

  public playDrop(): void {
    this.playTone(150, "square", 80, 0.25, 80);
  }

  public playCoin(): void {
    this.playTone(987.77, "square", 70, 0.2);
    setTimeout(() => {
      this.playTone(1318.51, "square", 120, 0.25);
    }, 70);
  }

  public playLineClear(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, "square", 90, 0.25);
      }, i * 60);
    });
  }

  public playHit(): void {
    this.playTone(400, "square", 50, 0.2, 100);
  }

  public playExplosion(): void {
    this.playTone(180, "sawtooth", 200, 0.3, 30);
  }

  public playGameOver(): void {
    const notes = [440, 415.3, 392, 349.23];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, "sawtooth", 180, 0.3);
      }, i * 150);
    });
  }

  public playLaser(): void {
    this.playTone(880, "sawtooth", 70, 0.2, 110);
  }

  public playPowerUp(): void {
    const notes = [330, 392, 659, 523, 587, 784];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, "triangle", 60, 0.2);
      }, i * 45);
    });
  }

  public playVictory(): void {
    const notes = [587.33, 587.33, 587.33, 880];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, "square", 100, 0.25);
      }, i * 100);
    });
  }

  public destroy(): void {
    try {
      this.masterGain?.disconnect();
      this.ctx?.close();
    } catch {
      // Best-effort cleanup
    }
    // Null out refs so GC can collect
    (this as any).ctx = null;
    (this as any).masterGain = null;
  }
}

let sharedAudio: AudioManager | null = null;

export function getAudioManager(): AudioManager {
  if (!sharedAudio) {
    sharedAudio = new AudioManager();
  }
  return sharedAudio;
}
