# Procedural Audio Architecture

This document details the procedural sound synthesis engine, oscillator configurations, ADSR volume envelopes, sound presets, and browser autoplay lifecycle management in **ARCADE_** (`engine/audio/AudioManager.ts`).

---

## 1. Zero External Audio Files Architecture

Traditional web games download megabytes of `.mp3` or `.wav` sound files. ARCADE_ downloads **zero audio files**.

### Advantages:
1. **Instant Loading:** No network requests, buffering delays, or asset loading spinners for audio.
2. **Infinite Customization:** Pitch, frequency slides, envelopes, and durations are modulated dynamically at runtime based on game speed and score combos.
3. **Authentic 8-Bit Tone:** Oscillators produce raw, uncompressed square, sawtooth, and triangle waveforms mathematically identical to classic sound chips (e.g. NES 2A03, Game Boy LR35902).

---

## 2. Web Audio Synthesizer Pipeline

```text
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ OscillatorNode  │ ----> │    GainNode     │ ----> │   MasterGain    │ ----> │ AudioDestination│
│ (Wave Generator)│       │ (ADSR Envelope) │       │ (Volume & Mute) │       │ (Speakers/Output│
└─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘
```

### Synthesis Function (`AudioManager.playTone`)
```typescript
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

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);

  // 1. Dynamic Pitch Sliding (Lasers, Jumps, Drops)
  if (frequencySlideTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(1, frequencySlideTo),
      ctx.currentTime + durationMs / 1000
    );
  }

  // 2. Exponential ADSR Volume Envelope
  gain.gain.setValueAtTime(0.01, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(gainLevel, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

  // 3. Connect Graph & Play
  osc.connect(gain);
  gain.connect(this.masterGain);

  osc.start();
  osc.stop(ctx.currentTime + durationMs / 1000 + 0.05);
}
```

---

## 3. Waveform Types & Applications

- **Square Wave (`square`):** Harsh, rich harmonic spectrum. Used for classic 8-bit blips, coin pickups, moving blocks, and NES-style melody leads.
- **Triangle Wave (`triangle`):** Soft, muted fundamental tone. Used for smooth piece rotations, bass lines, and ambient notes.
- **Sawtooth Wave (`sawtooth`):** Bright, buzzy timbre. Used for laser discharges, explosive hits, enemy alarms, and game-over sequences.
- **Sine Wave (`sine`):** Pure harmonic frequency. Used for clean UI notifications and gentle tones.

---

## 4. Built-in Sound Presets

| Preset | Waveform | Base Freq | Duration | Dynamic Slide / Envelope |
|---|---|---|---|---|
| `playMove()` | `square` | 220 Hz | 40 ms | Short attack/decay blip |
| `playRotate()` | `triangle` | 330 Hz | 60 ms | Upward slide $330\text{Hz} \to 440\text{Hz}$ |
| `playDrop()` | `square` | 150 Hz | 80 ms | Downward thud $150\text{Hz} \to 80\text{Hz}$ |
| `playCoin()` | `square` | 987.77 Hz | 190 ms | 2-note arpeggio (B5 $\to$ E6 at +70ms) |
| `playLineClear()` | `square` | 523.25 Hz | 270 ms | 4-note major chord (C5, E5, G5, C6) |
| `playHit()` | `square` | 400 Hz | 50 ms | Rapid drop $400\text{Hz} \to 100\text{Hz}$ |
| `playExplosion()` | `sawtooth` | 180 Hz | 200 ms | Deep bass rumble $180\text{Hz} \to 30\text{Hz}$ |
| `playLaser()` | `sawtooth` | 880 Hz | 70 ms | Piercing pitch drop $880\text{Hz} \to 110\text{Hz}$ |
| `playPowerUp()` | `triangle` | 330 Hz | 300 ms | 6-note ascending sequence (E4, G4, E5, C5, D5, G5) |
| `playGameOver()` | `sawtooth` | 440 Hz | 600 ms | 4-note descending minor cadence |

---

## 5. Browser Autoplay Compliance & Teardown

### Autoplay Policies
Modern browsers block `AudioContext` from producing sound until the user interacts with the document (clicks, touches, or presses a key). 
- `AudioManager` uses **lazy initialization** in `initContext()`.
- On the first player action, `ctx.resume()` is called automatically to unlock audio playback without unhandled promise rejections.

### Memory & Context Cleanup
When exiting a game, `destroy()` disconnects all gain nodes and terminates the active `AudioContext` to prevent audio worker thread leaks:
```typescript
public destroy(): void {
  try {
    this.masterGain?.disconnect();
    this.ctx?.close();
  } catch {}
  this.ctx = null;
  this.masterGain = null;
}
```
