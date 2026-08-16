"use client";

import React, { useEffect, useRef, useState } from 'react';

type Phase = 'hidden' | 'glitch' | 'nature' | 'cabinet' | 'world' | 'boot' | 'logo' | 'zoom' | 'done';

const AUDIO_CTX = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

function playSound(type: 'beep' | 'glitch' | 'rise' | 'boot' | 'chord', timeScale: number) {
  if (!AUDIO_CTX) return;
  const ctx = AUDIO_CTX;
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  const t = ctx.currentTime;

  switch (type) {
    case 'beep':
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.1 * timeScale);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2 * timeScale);
      osc.start(t);
      osc.stop(t + 0.2 * timeScale);
      break;
    case 'glitch':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.linearRampToValueAtTime(100, t + 0.2 * timeScale);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.3 * timeScale);
      osc.start(t);
      osc.stop(t + 0.3 * timeScale);
      break;
    case 'rise':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(50, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 1.0 * timeScale);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.5 * timeScale);
      gain.gain.linearRampToValueAtTime(0, t + 1.0 * timeScale);
      osc.start(t);
      osc.stop(t + 1.0 * timeScale);
      break;
    case 'boot':
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, t);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1 * timeScale);
      osc.start(t);
      osc.stop(t + 0.1 * timeScale);
      break;
    case 'chord':
      // C major chord
      const freqs = [261.63, 329.63, 392.00];
      freqs.forEach(f => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = f;
        o.connect(g);
        g.connect(ctx.destination);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.1, t + 0.1 * timeScale);
        g.gain.exponentialRampToValueAtTime(0.01, t + 1.0 * timeScale);
        o.start(t);
        o.stop(t + 1.0 * timeScale);
      });
      break;
  }
}

export interface SteamLaunchOverlayProps {
  active: boolean;
  gameTitle?: string;
  onComplete?: () => void;
}

export function SteamLaunchOverlay({ active, gameTitle, onComplete }: SteamLaunchOverlayProps) {
  const [phase, setPhase] = useState<Phase>('hidden');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [bootText, setBootText] = useState('');
  
  const fullText = `ARCADE_ KERNEL v2026.8 LOADED
62 DETERMINISTIC CARTRIDGES: OK
WEB AUDIO CORE: SYNTHESIZED
DIGITAL WILDERNESS: GENERATED
LAUNCH SEQUENCE: READY`;

  useEffect(() => {
    if (!active) {
      setPhase('hidden');
      return;
    }

    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReducedMotion) {
      setPhase('zoom');
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 300);
      return;
    }

    const isMobile = window.innerWidth <= 768;
    const timeScale = isMobile ? 0.44 : 1.0;

    const startTime = performance.now();
    const currentPhase: Phase = 'hidden';

    // Canvas State
    const chunks: any[] = [];
    const vines: any[] = [];
    const voxels: any[] = [];
    const fireflies: any[] = [];
    const canvasW = window.innerWidth;
    const canvasH = window.innerHeight;

    const initCanvasState = () => {
      // Chunks
      for (let i = 0; i < 150; i++) {
        chunks.push({
          x: canvasW / 2,
          y: canvasH / 2,
          vx: (Math.random() - 0.5) * 20,
          vy: (Math.random() - 0.5) * 20,
          size: Math.random() * 20 + 5,
          color: ['#FFD84D', '#FF5C8A', '#4DE8E8', '#63E66D', '#A879FF'][Math.floor(Math.random() * 5)],
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 0.2,
          alpha: 1
        });
      }
      // Vines
      for (let i = 0; i < 50; i++) {
        vines.push({
          x: Math.random() * canvasW,
          targetHeight: Math.random() * (canvasH * 0.4) + 50,
          currentHeight: 0,
          color: '#63E66D',
          flowerColor: ['#FF5C8A', '#FFD84D'][Math.floor(Math.random() * 2)],
          width: Math.random() * 4 + 2
        });
      }
      // Voxels
      for (let i = 0; i < 100; i++) {
        voxels.push({
          x: (Math.random() - 0.5) * 2000,
          y: (Math.random() - 0.5) * 2000,
          z: Math.random() * 2000 + 500,
          color: ['#FFD84D', '#FF5C8A', '#4DE8E8', '#A879FF'][Math.floor(Math.random() * 4)]
        });
      }
      // Fireflies
      for (let i = 0; i < 60; i++) {
        fireflies.push({
          x: Math.random() * canvasW,
          y: Math.random() * canvasH,
          baseY: Math.random() * canvasH,
          offset: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.05 + 0.02,
          size: Math.random() * 3 + 1
        });
      }
    };
    initCanvasState();

    const draw = () => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const w = canvasRef.current.width = window.innerWidth;
      const h = canvasRef.current.height = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const elapsed = (performance.now() - startTime) / 1000 / timeScale;

      // Draw depending on phase
      if (elapsed >= 0) {
        // Chunks
        chunks.forEach(c => {
          c.x += c.vx;
          c.y += c.vy;
          c.vy += 0.2; // gravity
          c.rot += c.vrot;
          c.alpha = Math.max(0, c.alpha - 0.01);
          
          if (c.alpha > 0) {
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rot);
            ctx.globalAlpha = c.alpha;
            ctx.fillStyle = c.color;
            ctx.fillRect(-c.size/2, -c.size/2, c.size, c.size);
            ctx.restore();
          }
        });
      }

      if (elapsed >= 0.3) {
        // Vines
        vines.forEach(v => {
          v.currentHeight += (v.targetHeight - v.currentHeight) * 0.05;
          ctx.fillStyle = v.color;
          ctx.fillRect(v.x, h - v.currentHeight, v.width, v.currentHeight);
          if (v.currentHeight > v.targetHeight * 0.9) {
            ctx.fillStyle = v.flowerColor;
            ctx.fillRect(v.x - 2, h - v.currentHeight - 4, v.width + 4, 4);
          }
        });
      }

      if (elapsed >= 2.5) {
        // Voxels (3D projection)
        const fov = 600;
        voxels.forEach(v => {
          v.z -= 10;
          if (v.z < 1) v.z = 2500;
          const scale = fov / v.z;
          const px = v.x * scale + w / 2;
          const py = v.y * scale + h / 2;
          const size = 20 * scale;

          ctx.fillStyle = v.color;
          ctx.globalAlpha = Math.min(1, scale);
          ctx.fillRect(px, py, size, size);
          ctx.globalAlpha = 1;
        });

        // Fireflies
        fireflies.forEach(f => {
          f.offset += f.speed;
          f.x += Math.sin(f.offset) * 2;
          f.y = f.baseY + Math.cos(f.offset * 0.5) * 20;
          ctx.fillStyle = '#4DE8E8';
          ctx.shadowColor = '#4DE8E8';
          ctx.shadowBlur = 10;
          ctx.fillRect(f.x, f.y, f.size, f.size);
          ctx.shadowBlur = 0;
        });
      }

      if (elapsed >= 3.5) {
        // Scanlines
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        for (let y = 0; y < h; y += 4) {
          ctx.fillRect(0, y, w, 1);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    const schedule = [
      { t: 0, phase: 'glitch', sound: 'beep' },
      { t: 0.3, phase: 'nature' },
      { t: 0.8, sound: 'glitch' },
      { t: 1.5, phase: 'cabinet', sound: 'rise' },
      { t: 2.5, phase: 'world' },
      { t: 3.5, phase: 'boot', sound: 'boot' },
      { t: 4.2, phase: 'logo', sound: 'chord' },
      { t: 4.7, phase: 'zoom' },
      { t: 5.0, phase: 'done' }
    ] as { t: number; phase?: Phase; sound?: 'beep' | 'glitch' | 'rise' | 'boot' | 'chord' }[];

    const timeouts: NodeJS.Timeout[] = [];

    schedule.forEach(ev => {
      const ms = ev.t * 1000 * timeScale;
      timeouts.push(setTimeout(() => {
        if (ev.phase) setPhase(ev.phase as Phase);
        if (ev.sound) playSound(ev.sound, timeScale);

        if (ev.phase === 'boot') {
          // Start typewriter
          let idx = 0;
          const typeInterval = setInterval(() => {
            idx++;
            setBootText(fullText.substring(0, idx));
            if (idx % 10 === 0) playSound('boot', timeScale);
            if (idx >= fullText.length) clearInterval(typeInterval);
          }, 20 * timeScale);
          timeouts.push(typeInterval as any);
        }

        if (ev.phase === 'done') {
          if (onComplete) onComplete();
        }
      }, ms));
    });

    return () => {
      timeouts.forEach(clearTimeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, onComplete]);

  if (phase === 'hidden' || !active) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999,
      backgroundColor: '#080B12',
      overflow: 'hidden',
      pointerEvents: 'none',
      transition: 'transform 0.3s ease-in, opacity 0.3s ease-in',
      transform: phase === 'zoom' ? 'scale(2.5)' : 'scale(1)',
      opacity: phase === 'zoom' ? 0 : 1,
    }}>
      <canvas 
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />

      {/* Cabinet Phase */}
      {(phase === 'cabinet' || phase === 'world' || phase === 'boot' || phase === 'logo' || phase === 'zoom') && (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'cabinetAppear 1s steps(10) forwards',
        }}>
          <svg width="200" height="300" viewBox="0 0 200 300" style={{ filter: 'drop-shadow(0 0 20px rgba(77,232,232,0.5))' }}>
            <rect x="20" y="20" width="160" height="80" fill="#111" stroke="#4DE8E8" strokeWidth="4"/>
            <polygon points="20,100 180,100 160,140 40,140" fill="#222" stroke="#4DE8E8" strokeWidth="4"/>
            <rect x="40" y="140" width="120" height="140" fill="#111" stroke="#4DE8E8" strokeWidth="4"/>
            <rect x="60" y="160" width="20" height="10" fill="#FF5C8A" />
            <rect x="120" y="160" width="20" height="10" fill="#FFD84D" />
          </svg>
        </div>
      )}

      {/* Boot Phase */}
      {(phase === 'boot' || phase === 'logo' || phase === 'zoom') && (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0,0,0,0.8)',
          border: '2px solid #63E66D',
          padding: '20px',
          fontFamily: 'var(--font-mono, monospace)',
          color: '#63E66D',
          fontSize: '14px',
          whiteSpace: 'pre',
          width: '320px',
          textShadow: '0 0 5px #63E66D'
        }}>
          {bootText}
          <span style={{ animation: 'blink 1s step-end infinite' }}>_</span>
        </div>
      )}

      {/* Logo Phase */}
      {(phase === 'logo' || phase === 'zoom') && (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          animation: 'logoReveal 0.5s ease-out forwards',
        }}>
          <div style={{ width: 20, height: 20, backgroundColor: '#FFD84D', margin: '0 auto 20px', transform: 'rotate(45deg)', boxShadow: '0 0 30px #FFD84D' }} />
          <h1 style={{
            fontFamily: 'var(--font-pixel, monospace)',
            color: '#FF5C8A',
            fontSize: '48px',
            margin: '0 0 10px 0',
            textShadow: '4px 4px 0px #4DE8E8'
          }}>ARCADE_</h1>
          <h2 style={{
            fontFamily: 'var(--font-mono, monospace)',
            color: '#fff',
            fontSize: '18px',
            letterSpacing: '4px',
            margin: 0
          }}>{gameTitle ? `LOADING: ${gameTitle}` : 'ENTER THE WILDERNESS'}</h2>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes cabinetAppear {
          0% { transform: translate(-50%, -30%) scale(0.5); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes logoReveal {
          0% { transform: translate(-50%, -40%) scale(0.8); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
      `}} />
    </div>
  );
}
