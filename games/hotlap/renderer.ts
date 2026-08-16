/** ARCADE_ v1.2.2 */
import type { Renderer } from "../../engine/rendering/Renderer";
import type { CarPhysicsState, CircuitDefinition, SkidMark, SmokeParticle, CrashDebrisParticle, SectorSplit } from "./types";
import type { TrackSpline } from "./spline";

export class HotlapRenderer {
  public static renderTrack(
    renderer: Renderer,
    spline: TrackSpline,
    circuit: CircuitDefinition,
    cameraX: number,
    cameraY: number,
    zoom: number
  ): void {
    // 1. ALWAYS clear full canvas in untransformed screen coordinates first
    renderer.clear(circuit.colors.grass);

    const ctx = (renderer as unknown as { getContext?: () => CanvasRenderingContext2D }).getContext?.();
    if (!ctx || typeof ctx.save !== "function") return;

    const screenW = renderer.getWidth();
    const screenH = renderer.getHeight();
    const samples = spline.samples;
    const n = samples.length;
    if (n < 3) return;

    ctx.save();
    // Transform to world coordinates centered on player camera
    ctx.translate(screenW / 2, screenH / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-cameraX, -cameraY);

    // 2. Build the smooth centerline spline Path2D
    const trackPath = new Path2D();
    trackPath.moveTo(samples[0].pos.x, samples[0].pos.y);
    for (let i = 1; i < n; i++) {
      trackPath.lineTo(samples[i].pos.x, samples[i].pos.y);
    }
    trackPath.closePath();

    // 3. Draw Outer Barrier / Runoff Border
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = circuit.colors.barrier;
    ctx.lineWidth = circuit.width + 36;
    ctx.stroke(trackPath);

    // 4. Draw Alternating Red & White Kerbs
    ctx.strokeStyle = circuit.colors.kerbRed;
    ctx.lineWidth = circuit.width + 24;
    ctx.stroke(trackPath);

    ctx.strokeStyle = circuit.colors.kerbWhite;
    ctx.lineWidth = circuit.width + 24;
    ctx.setLineDash([28, 28]);
    ctx.stroke(trackPath);
    ctx.setLineDash([]);

    // 5. Draw Asphalt Ribbon
    ctx.strokeStyle = circuit.colors.asphalt;
    ctx.lineWidth = circuit.width;
    ctx.stroke(trackPath);

    // 6. Draw Asphalt Edge Boundaries (White/Cyan accent guidelines)
    ctx.strokeStyle = circuit.colors.line;
    ctx.lineWidth = circuit.width - 8;
    ctx.stroke(trackPath);

    ctx.strokeStyle = circuit.colors.asphaltDark;
    ctx.lineWidth = circuit.width - 12;
    ctx.stroke(trackPath);

    // 7. Draw Center Dashed Guideline
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 24]);
    ctx.stroke(trackPath);
    ctx.setLineDash([]);

    // 8. Start / Finish Line Checkered Gate (Progress 0.0)
    HotlapRenderer.drawCheckeredFinish(ctx, samples[0], circuit.width);

    // 9. Sector 1 Split Gate (Progress 0.33)
    const s1Idx = Math.floor(n * 0.33);
    HotlapRenderer.drawSectorGate(ctx, samples[s1Idx], circuit.width, "#ffd84d", "SECTOR 1");

    // 10. Sector 2 Split Gate (Progress 0.66)
    const s2Idx = Math.floor(n * 0.66);
    HotlapRenderer.drawSectorGate(ctx, samples[s2Idx], circuit.width, "#a879ff", "SECTOR 2");

    ctx.restore();
  }

  private static drawCheckeredFinish(ctx: CanvasRenderingContext2D, sample: { pos: { x: number; y: number }; normal: { x: number; y: number } }, trackWidth: number): void {
    ctx.save();
    const half = trackWidth / 2;
    const p1X = sample.pos.x + sample.normal.x * half;
    const p1Y = sample.pos.y + sample.normal.y * half;
    const p2X = sample.pos.x - sample.normal.x * half;
    const p2Y = sample.pos.y - sample.normal.y * half;

    // Checkered banner
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 14;
    ctx.setLineDash([14, 14]);
    ctx.beginPath();
    ctx.moveTo(p1X, p1Y);
    ctx.lineTo(p2X, p2Y);
    ctx.stroke();

    ctx.strokeStyle = "#0d1017";
    ctx.lineWidth = 14;
    ctx.lineDashOffset = 14;
    ctx.beginPath();
    ctx.moveTo(p1X, p1Y);
    ctx.lineTo(p2X, p2Y);
    ctx.stroke();

    ctx.restore();
  }

  private static drawSectorGate(ctx: CanvasRenderingContext2D, sample: { pos: { x: number; y: number }; normal: { x: number; y: number } }, trackWidth: number, color: string, label: string): void {
    ctx.save();
    const half = trackWidth / 2;
    const p1X = sample.pos.x + sample.normal.x * half;
    const p1Y = sample.pos.y + sample.normal.y * half;
    const p2X = sample.pos.x - sample.normal.x * half;
    const p2Y = sample.pos.y - sample.normal.y * half;

    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(p1X, p1Y);
    ctx.lineTo(p2X, p2Y);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = "center";
    ctx.fillText(label, sample.pos.x, sample.pos.y - 12);
    ctx.restore();
  }

  public static renderSkidsAndSmoke(
    renderer: Renderer,
    skidBuffer: SkidMark[],
    smokeBuffer: SmokeParticle[],
    debrisBuffer: CrashDebrisParticle[],
    cameraX: number,
    cameraY: number,
    zoom: number
  ): void {
    const ctx = (renderer as unknown as { getContext?: () => CanvasRenderingContext2D }).getContext?.();
    if (!ctx || typeof ctx.save !== "function") return;

    ctx.save();
    ctx.translate(renderer.getWidth() / 2, renderer.getHeight() / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-cameraX, -cameraY);

    // Skid marks
    for (const skid of skidBuffer) {
      ctx.strokeStyle = `rgba(15, 18, 24, ${skid.alpha})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(skid.x1, skid.y1);
      ctx.lineTo(skid.x2, skid.y2);
      ctx.stroke();
    }

    // Tire smoke
    for (const p of smokeBuffer) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Crash Debris
    for (const d of debrisBuffer) {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rotation);
      ctx.fillStyle = d.color;
      ctx.globalAlpha = d.alpha;
      ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size);
      ctx.restore();
    }

    ctx.globalAlpha = 1.0;
    ctx.restore();
  }

  public static renderCar(
    renderer: Renderer,
    car: CarPhysicsState,
    isGhost: boolean,
    cameraX: number,
    cameraY: number,
    zoom: number
  ): void {
    const ctx = (renderer as unknown as { getContext?: () => CanvasRenderingContext2D }).getContext?.();
    if (!ctx || typeof ctx.save !== "function") return;

    ctx.save();
    ctx.translate(renderer.getWidth() / 2, renderer.getHeight() / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-cameraX, -cameraY);

    ctx.translate(car.pos.x, car.pos.y);
    ctx.rotate(car.angle);

    if (isGhost) {
      ctx.globalAlpha = 0.45;
    } else {
      ctx.globalAlpha = 1.0;
    }

    // ─── COLOR PALETTE ───
    // Primary body colors (Papaya racing orange matching reference, or cyan for ghost)
    const cBody = isGhost ? "#4de8e8" : (car.isCrashed ? "#ff4d4f" : "#ff7a45");
    const cBodyHi = isGhost ? "#87e8de" : (car.isCrashed ? "#ff7875" : "#ffa940");
    const cBodyDark = isGhost ? "#13c2c2" : (car.isCrashed ? "#a8071a" : "#d4380d");
    const cAccent = isGhost ? "#ffffff" : "#fffb8f"; // Pale yellow livery decals
    const cCarbon = isGhost ? "#2a4d5a" : "#1f242e";
    const cTire = isGhost ? "#1b3842" : "#282d37";
    const cTireRim = isGhost ? "#4de8e8" : "#4b5363";

    // 1. Aerodynamic Ground-Effect Shadow
    if (!isGhost) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.ellipse(0, 2, 23, 13, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Carbon Suspension Wishbones & Axles
    ctx.strokeStyle = cCarbon;
    ctx.lineWidth = 1.8;
    // Front Wishbones
    ctx.beginPath();
    ctx.moveTo(8, -4);
    ctx.lineTo(12, -11);
    ctx.moveTo(8, 4);
    ctx.lineTo(12, 11);
    ctx.moveTo(14, -3);
    ctx.lineTo(12, -11);
    ctx.moveTo(14, 3);
    ctx.lineTo(12, 11);
    // Rear Wishbones
    ctx.moveTo(-10, -5);
    ctx.lineTo(-14, -11);
    ctx.moveTo(-10, 5);
    ctx.lineTo(-14, 11);
    ctx.moveTo(-16, -4);
    ctx.lineTo(-14, -11);
    ctx.moveTo(-16, 4);
    ctx.lineTo(-14, 11);
    ctx.stroke();

    // 3. Four Wide Slick Tires (with dynamic steering on front wheels)
    // Rear Left Wheel
    ctx.fillStyle = cTire;
    ctx.fillRect(-20, -15, 12, 7);
    ctx.fillStyle = cTireRim;
    ctx.fillRect(-17, -14, 6, 5);

    // Rear Right Wheel
    ctx.fillStyle = cTire;
    ctx.fillRect(-20, 8, 12, 7);
    ctx.fillStyle = cTireRim;
    ctx.fillRect(-17, 9, 6, 5);

    // Front Steered Wheels
    // Front Left Wheel
    ctx.save();
    ctx.translate(12, -11);
    ctx.rotate(car.steerAngle * 0.45);
    ctx.fillStyle = cTire;
    ctx.fillRect(-5.5, -3.5, 11, 6.5);
    ctx.fillStyle = cTireRim;
    ctx.fillRect(-3, -2.5, 6, 4.5);
    ctx.restore();

    // Front Right Wheel
    ctx.save();
    ctx.translate(12, 11);
    ctx.rotate(car.steerAngle * 0.45);
    ctx.fillStyle = cTire;
    ctx.fillRect(-5.5, -3, 11, 6.5);
    ctx.fillStyle = cTireRim;
    ctx.fillRect(-3, -2, 6, 4.5);
    ctx.restore();

    // 4. Rear Wing Assembly & Endplates
    ctx.fillStyle = cBodyDark;
    ctx.fillRect(-22, -13, 5, 26); // Lower mainplane
    ctx.fillStyle = cBody;
    ctx.fillRect(-24, -12, 4, 24); // Upper wing flap
    ctx.fillStyle = cCarbon;
    ctx.fillRect(-25, -13, 6, 2);  // Left endplate
    ctx.fillRect(-25, 11, 6, 2);   // Right endplate
    // Rear Rain Light
    ctx.fillStyle = isGhost ? "#4de8e8" : (car.isCrashed ? "#ff4d4f" : "#ff3838");
    ctx.fillRect(-23, -1, 2, 2);

    // 5. Curved Aerodynamic Sidepods & Bargeboards
    ctx.fillStyle = cBodyDark;
    // Sidepod Underbody Floor
    ctx.fillRect(-12, -9.5, 17, 19);
    // Main Curved Sidepods
    ctx.fillStyle = cBody;
    ctx.beginPath();
    ctx.roundRect(-10, -9, 14, 18, 4);
    ctx.fill();

    // Sidepod Top Highlights
    ctx.fillStyle = cBodyHi;
    ctx.fillRect(-8, -8, 10, 3);
    ctx.fillRect(-8, 5, 10, 3);

    // Radiator Cooling Inlets / Louvers
    ctx.fillStyle = cCarbon;
    ctx.fillRect(2, -7.5, 3, 4); // Left intake
    ctx.fillRect(2, 3.5, 3, 4);  // Right intake
    // Cooling vent slits
    ctx.fillRect(-4, -6.5, 1.5, 2);
    ctx.fillRect(-1, -6.5, 1.5, 2);
    ctx.fillRect(-4, 4.5, 1.5, 2);
    ctx.fillRect(-1, 4.5, 1.5, 2);

    // Livery Yellow Side Decals (Matching reference image)
    ctx.fillStyle = cAccent;
    ctx.fillRect(-7, -8.5, 3, 2);
    ctx.fillRect(-7, 6.5, 3, 2);

    // 6. Central Monocoque, Airbox & Dorsal Shark Fin
    ctx.fillStyle = cBody;
    ctx.fillRect(-14, -4, 18, 8); // Engine cover spine
    // Dorsal Fin
    ctx.fillStyle = cBodyHi;
    ctx.fillRect(-16, -1, 10, 2);
    // Airbox intake above driver head
    ctx.fillStyle = cCarbon;
    ctx.fillRect(-3, -2, 3, 4);

    // 7. Tapered Front Nosecone
    ctx.fillStyle = cBody;
    ctx.beginPath();
    ctx.moveTo(4, -4);
    ctx.lineTo(21, -2);
    ctx.lineTo(23, 0);
    ctx.lineTo(21, 2);
    ctx.lineTo(4, 4);
    ctx.closePath();
    ctx.fill();

    // Nosecone Top Highlight Stripe
    ctx.fillStyle = cBodyHi;
    ctx.beginPath();
    ctx.moveTo(5, -1.5);
    ctx.lineTo(19, -0.8);
    ctx.lineTo(19, 0.8);
    ctx.lineTo(5, 1.5);
    ctx.closePath();
    ctx.fill();

    // Nose Livery Badge (Pale yellow racing stripe)
    ctx.fillStyle = cAccent;
    ctx.fillRect(13, -1.5, 3, 3);

    // 8. Cockpit & Driver Helmet
    ctx.fillStyle = cCarbon;
    ctx.beginPath();
    ctx.roundRect(-2, -3, 6, 6, 2);
    ctx.fill();

    // Driver Helmet (Yellow with visor)
    ctx.fillStyle = isGhost ? "#ffffff" : "#ffd666";
    ctx.beginPath();
    ctx.arc(0.5, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();
    // Visor
    ctx.fillStyle = "#0c1018";
    ctx.fillRect(1.2, -1.2, 1.5, 2.4);

    // Halo Safety Structure
    ctx.strokeStyle = cCarbon;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 3.2, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    // 9. Swept Front Wing Assembly
    // Front wing mainplane (swept wings matching reference)
    ctx.fillStyle = cBodyDark;
    ctx.beginPath();
    ctx.moveTo(17, -13);
    ctx.lineTo(23, -6);
    ctx.lineTo(24, 0);
    ctx.lineTo(23, 6);
    ctx.lineTo(17, 13);
    ctx.lineTo(21, 13);
    ctx.lineTo(26, 6);
    ctx.lineTo(27, 0);
    ctx.lineTo(26, -6);
    ctx.lineTo(21, -13);
    ctx.closePath();
    ctx.fill();

    // Front Wing Upper Flaps
    ctx.fillStyle = cBody;
    ctx.fillRect(19, -12, 3, 8);
    ctx.fillRect(19, 4, 3, 8);

    // White Aerodynamic Endplate Winglets
    ctx.fillStyle = cAccent;
    ctx.fillRect(17, -13.5, 4, 2);
    ctx.fillRect(17, 11.5, 4, 2);

    // 10. Exhaust Flames (animated on throttle)
    if (!isGhost && !car.isCrashed && car.exhaustFlame > 0.1) {
      const flameLen = 5 + Math.random() * 9 * car.exhaustFlame;
      ctx.fillStyle = "#ffd84d";
      ctx.fillRect(-24 - flameLen, -2, flameLen, 4);
      ctx.fillStyle = "#ff7a45";
      ctx.fillRect(-24 - flameLen * 0.7, -1, flameLen * 0.7, 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-24 - flameLen * 0.3, -0.5, flameLen * 0.3, 1);
    }

    ctx.restore();
  }

  public static renderHUD(
    renderer: Renderer,
    currentLap: number,
    lapTime: number,
    bestLapTime: number | null,
    liveDelta: number | null,
    sectors: SectorSplit,
    carSpeed: number,
    circuit: CircuitDefinition,
    spline: TrackSpline,
    carProgress: number,
    isCrashed: boolean
  ): void {
    const screenW = renderer.getWidth();
    const screenH = renderer.getHeight();

    // 1. Top Telemetry Header Bar
    renderer.drawRect(0, 0, screenW, 46, "rgba(6, 14, 28, 0.90)", true);
    renderer.drawLine(0, 46, screenW, 46, "#1e3060", 1);

    // Track Name & Lap Counter
    renderer.drawText(circuit.name.toUpperCase(), 16, 20, {
      color: "#ffd84d",
      size: 11,
      font: "var(--font-mono, monospace)",
    });
    renderer.drawText(`LAP ${currentLap}`, 16, 36, {
      color: "#f3f6fc",
      size: 13,
      font: "var(--font-mono, monospace)",
    });

    // 2. Timers & Live Delta
    const formattedCurrent = formatLapTime(lapTime);
    renderer.drawText("TIME", screenW / 2 - 70, 18, {
      color: "#9bb0d4",
      size: 9,
      align: "center",
      font: "var(--font-mono, monospace)",
    });
    renderer.drawText(formattedCurrent, screenW / 2 - 70, 36, {
      color: "#ffffff",
      size: 14,
      align: "center",
      font: "var(--font-mono, monospace)",
    });

    // Best Lap
    const formattedBest = bestLapTime !== null ? formatLapTime(bestLapTime) : "--:--.---";
    renderer.drawText("BEST", screenW / 2 + 10, 18, {
      color: "#9bb0d4",
      size: 9,
      align: "center",
      font: "var(--font-mono, monospace)",
    });
    renderer.drawText(formattedBest, screenW / 2 + 10, 36, {
      color: "#a879ff",
      size: 14,
      align: "center",
      font: "var(--font-mono, monospace)",
    });

    // Live Delta
    if (liveDelta !== null && !isCrashed) {
      const isAhead = liveDelta < 0;
      const deltaStr = (isAhead ? "-" : "+") + Math.abs(liveDelta).toFixed(3);
      const deltaColor = isAhead ? "#63e66d" : "#ff5c8a";

      renderer.drawRect(screenW / 2 + 70, 12, 65, 26, isAhead ? "rgba(99, 230, 109, 0.15)" : "rgba(255, 92, 138, 0.15)", true);
      renderer.drawRect(screenW / 2 + 70, 12, 65, 26, deltaColor, false);
      renderer.drawText(deltaStr, screenW / 2 + 102, 29, {
        color: deltaColor,
        size: 12,
        align: "center",
        font: "var(--font-mono, monospace)",
      });
    }

    // 3. Right Speedometer
    const speedKmh = Math.floor((carSpeed / 680) * 320);
    renderer.drawText("SPEED", screenW - 20, 18, {
      color: "#9bb0d4",
      size: 9,
      align: "right",
      font: "var(--font-mono, monospace)",
    });
    renderer.drawText(`${speedKmh} KM/H`, screenW - 20, 36, {
      color: "#4de8e8",
      size: 14,
      align: "right",
      font: "var(--font-mono, monospace)",
    });

    // 4. Sector Split Times
    renderer.drawRect(16, screenH - 58, 140, 44, "rgba(6, 14, 28, 0.85)", true);
    renderer.drawRect(16, screenH - 58, 140, 44, "#1e3060", false);
    renderer.drawText(`S1: ${sectors.s1Time !== null ? sectors.s1Time.toFixed(2) : "--.--"}`, 24, screenH - 42, {
      color: sectors.s1Time !== null ? "#63e66d" : "#9bb0d4",
      size: 9,
      font: "var(--font-mono, monospace)",
    });
    renderer.drawText(`S2: ${sectors.s2Time !== null ? sectors.s2Time.toFixed(2) : "--.--"}`, 24, screenH - 26, {
      color: sectors.s2Time !== null ? "#a879ff" : "#9bb0d4",
      size: 9,
      font: "var(--font-mono, monospace)",
    });

    // 5. Crash Warning Banner
    if (isCrashed) {
      renderer.drawRect(screenW / 2 - 140, screenH / 2 - 28, 280, 56, "rgba(180, 20, 40, 0.92)", true);
      renderer.drawRect(screenW / 2 - 140, screenH / 2 - 28, 280, 56, "#ffffff", false);
      renderer.drawText("CRASHED — BARRIER IMPACT", screenW / 2, screenH / 2 - 6, {
        color: "#ffffff",
        size: 14,
        align: "center",
        font: "var(--font-mono, monospace)",
      });
      renderer.drawText("REPOSITIONING TO TRACK...", screenW / 2, screenH / 2 + 14, {
        color: "#ffd84d",
        size: 11,
        align: "center",
        font: "var(--font-mono, monospace)",
      });
    }

    // 6. Minimap Radar
    HotlapRenderer.renderMinimap(renderer, spline, circuit, carProgress, screenW - 95, screenH - 95, 80);
  }

  private static renderMinimap(
    renderer: Renderer,
    spline: TrackSpline,
    circuit: CircuitDefinition,
    carProgress: number,
    x: number,
    y: number,
    size: number
  ): void {
    const ctx = (renderer as unknown as { getContext?: () => CanvasRenderingContext2D }).getContext?.();
    if (!ctx || typeof ctx.save !== "function") return;

    renderer.drawRect(x - 5, y - 5, size + 10, size + 10, "rgba(6, 14, 28, 0.85)", true);
    renderer.drawRect(x - 5, y - 5, size + 10, size + 10, "#1e3060", false);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of circuit.points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    const scale = (size - 10) / Math.max(spanX, spanY);

    ctx.save();
    ctx.translate(x + 5, y + 5);

    ctx.strokeStyle = circuit.colors.accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const pts = spline.samples;
    if (pts.length > 0) {
      ctx.moveTo((pts[0].pos.x - minX) * scale, (pts[0].pos.y - minY) * scale);
      for (let i = 1; i < pts.length; i += 4) {
        ctx.lineTo((pts[i].pos.x - minX) * scale, (pts[i].pos.y - minY) * scale);
      }
      ctx.closePath();
      ctx.stroke();
    }

    const sample = spline.getSampleAtProgress(carProgress);
    const dotX = (sample.pos.x - minX) * scale;
    const dotY = (sample.pos.y - minY) * scale;
    ctx.fillStyle = "#ff5c8a";
    ctx.beginPath();
    ctx.arc(dotX, dotY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function formatLapTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${mins}:${secs.padStart(6, "0")}`;
}
