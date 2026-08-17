import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";
import { globalParticles } from "../../engine/particles/ParticleSystem";

interface ColonyNode {
  id: number;
  pos: Vector2;
  radius: number;
  owner: "player" | "enemy" | "neutral";
  count: number;
  maxCount: number;
  growthRate: number; // units per second
  pulsePhase: number;
}

interface SporeUnit {
  pos: Vector2;
  targetPos: Vector2;
  targetNodeId: number;
  owner: "player" | "enemy";
  speed: number;
  radius: number;
}

export class CellColonyGame implements GameInstance {
  private ctx!: GameContext;
  private nodes: ColonyNode[] = [];
  private spores: SporeUnit[] = [];
  private selectedNodeId: number | null = null;
  private targetHoverNodeId: number | null = null;

  private level: number = 1;
  private score: number = 0;
  private isWon: boolean = false;
  private isGameOver: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;
  private enemyAiTimer: number = 0;

  private boundPointerDown?: (e: MouseEvent | PointerEvent) => void;
  private boundPointerMove?: (e: MouseEvent | PointerEvent) => void;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
    this.attachPointerControls();
  }

  private attachPointerControls(): void {
    const getCanvasPos = (e: MouseEvent | PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === "CANVAS") {
        const rect = target.getBoundingClientRect();
        const scaleX = 600 / rect.width;
        const scaleY = 700 / rect.height;
        return new Vector2((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
      }
      return null;
    };

    this.boundPointerMove = (e: MouseEvent | PointerEvent) => {
      if (this.isWon || this.isGameOver || this.isPaused) return;
      const mousePos = getCanvasPos(e);
      if (mousePos) {
        let hoverId: number | null = null;
        for (const n of this.nodes) {
          if (mousePos.distance(n.pos) <= n.radius + 10) {
            hoverId = n.id;
            break;
          }
        }
        this.targetHoverNodeId = hoverId;
      }
    };

    this.boundPointerDown = (e: MouseEvent | PointerEvent) => {
      if (this.isWon || this.isGameOver) {
        if (this.isWon) this.nextLevel();
        else this.reset();
        return;
      }

      const mousePos = getCanvasPos(e);
      if (!mousePos) return;

      let clickedNode: ColonyNode | null = null;
      for (const n of this.nodes) {
        if (mousePos.distance(n.pos) <= n.radius + 12) {
          clickedNode = n;
          break;
        }
      }

      if (clickedNode) {
        if (this.selectedNodeId === null) {
          // Select player source node
          if (clickedNode.owner === "player") {
            this.selectedNodeId = clickedNode.id;
            this.ctx.audio?.playMove?.();
          }
        } else {
          // If clicking the same node, deselect
          if (clickedNode.id === this.selectedNodeId) {
            this.selectedNodeId = null;
          } else {
            // Launch attack / transfer from selected to clicked
            this.launchSpores(this.selectedNodeId, clickedNode.id, "player");
            this.selectedNodeId = null;
          }
        }
      } else {
        this.selectedNodeId = null;
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("pointerdown", this.boundPointerDown);
      window.addEventListener("pointermove", this.boundPointerMove);
    }
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.score = 0;
    this.level = 1;
    this.startLevel(this.level);
  }

  private startLevel(lvl: number): void {
    this.level = lvl;
    this.isWon = false;
    this.isGameOver = false;
    this.isPaused = false;
    this.selectedNodeId = null;
    this.targetHoverNodeId = null;
    this.spores = [];
    this.animTime = 0;
    this.enemyAiTimer = 0;

    this.nodes = [];

    if (lvl === 1) {
      // Tutorial: 1 Player Node vs 1 Neutral vs 1 Enemy
      this.nodes.push(
        { id: 0, pos: new Vector2(140, 360), radius: 36, owner: "player", count: 25, maxCount: 60, growthRate: 3, pulsePhase: 0 },
        { id: 1, pos: new Vector2(300, 360), radius: 30, owner: "neutral", count: 12, maxCount: 45, growthRate: 1, pulsePhase: 1 },
        { id: 2, pos: new Vector2(460, 360), radius: 36, owner: "enemy", count: 20, maxCount: 60, growthRate: 2.5, pulsePhase: 2 }
      );
    } else if (lvl === 2) {
      // 4-Node Cross Matrix
      this.nodes.push(
        { id: 0, pos: new Vector2(150, 360), radius: 38, owner: "player", count: 30, maxCount: 70, growthRate: 3.5, pulsePhase: 0 },
        { id: 1, pos: new Vector2(300, 240), radius: 28, owner: "neutral", count: 15, maxCount: 40, growthRate: 1.5, pulsePhase: 1 },
        { id: 2, pos: new Vector2(300, 480), radius: 28, owner: "neutral", count: 15, maxCount: 40, growthRate: 1.5, pulsePhase: 2 },
        { id: 3, pos: new Vector2(450, 360), radius: 38, owner: "enemy", count: 28, maxCount: 70, growthRate: 3.2, pulsePhase: 3 }
      );
    } else {
      // Multi-Front Complex Lab Dish
      this.nodes.push(
        { id: 0, pos: new Vector2(130, 260), radius: 36, owner: "player", count: 30, maxCount: 65, growthRate: 3.5, pulsePhase: 0 },
        { id: 1, pos: new Vector2(130, 460), radius: 32, owner: "player", count: 20, maxCount: 50, growthRate: 2.8, pulsePhase: 1 },
        { id: 2, pos: new Vector2(300, 360), radius: 44, owner: "neutral", count: 30, maxCount: 90, growthRate: 4.5, pulsePhase: 2 },
        { id: 3, pos: new Vector2(470, 260), radius: 36, owner: "enemy", count: 25, maxCount: 65, growthRate: 3.2, pulsePhase: 3 },
        { id: 4, pos: new Vector2(470, 460), radius: 32, owner: "enemy", count: 25, maxCount: 50, growthRate: 3.0, pulsePhase: 4 }
      );
    }

    globalParticles.emitText(`STAGE ${this.level}: BIOSPHERE EXPEDITION`, 300, 340, "#38BDF8", 22);
  }

  private launchSpores(fromId: number, toId: number, owner: "player" | "enemy"): void {
    const fromNode = this.nodes.find((n) => n.id === fromId);
    const toNode = this.nodes.find((n) => n.id === toId);
    if (!fromNode || !toNode || fromNode.count <= 2) return;

    // Dispatch half the population
    const sendCount = Math.floor(fromNode.count / 2);
    fromNode.count -= sendCount;

    for (let i = 0; i < sendCount; i++) {
      const offsetAngle = Math.random() * Math.PI * 2;
      const offsetDist = Math.random() * (fromNode.radius * 0.5);
      const startPos = fromNode.pos.add(new Vector2(Math.cos(offsetAngle) * offsetDist, Math.sin(offsetAngle) * offsetDist));

      this.spores.push({
        pos: startPos,
        targetPos: toNode.pos,
        targetNodeId: toNode.id,
        owner,
        speed: 160 + Math.random() * 40,
        radius: 3.5,
      });
    }

    this.ctx.audio?.playRotate?.();
    globalParticles.emitBurst(fromNode.pos.x, fromNode.pos.y, 8, [owner === "player" ? "#38BDF8" : "#EF4444", "#FFFFFF"], 30, 100);
  }

  public nextLevel(): void {
    this.startLevel(this.level + 1);
  }

  public update(dt: number): void {
    if (this.isPaused) return;
    globalParticles.update(dt);
    this.animTime += dt;

    // 1. Biological Growth on Nodes
    for (const node of this.nodes) {
      node.pulsePhase += dt * 3;
      if (node.owner !== "neutral" && node.count < node.maxCount) {
        node.count = Math.min(node.maxCount, node.count + node.growthRate * dt);
      }
    }

    // 2. Enemy AI Behavior
    if (!this.isWon && !this.isGameOver) {
      this.enemyAiTimer += dt;
      if (this.enemyAiTimer >= 2.5) {
        this.enemyAiTimer = 0;
        this.runEnemyAi();
      }
    }

    // 3. Move & Resolve Spore Units
    for (let i = this.spores.length - 1; i >= 0; i--) {
      const spore = this.spores[i];
      const targetNode = this.nodes.find((n) => n.id === spore.targetNodeId);

      if (!targetNode) {
        this.spores.splice(i, 1);
        continue;
      }

      const dir = targetNode.pos.sub(spore.pos).normalize();
      spore.pos = spore.pos.add(dir.scale(spore.speed * dt));

      if (spore.pos.distance(targetNode.pos) <= targetNode.radius) {
        // Spore arrived at destination node
        if (targetNode.owner === spore.owner) {
          // Friendly reinforcement
          targetNode.count = Math.min(targetNode.maxCount, targetNode.count + 1);
        } else {
          // Attack / invasion
          targetNode.count -= 1;
          if (targetNode.count <= 0) {
            // Node conquered!
            targetNode.owner = spore.owner;
            targetNode.count = 5;
            this.ctx.audio?.playPowerUp?.();

            const winCol = spore.owner === "player" ? "#34D399" : "#EF4444";
            globalParticles.emitBurst(targetNode.pos.x, targetNode.pos.y, 25, [winCol, "#FFFFFF"], 60, 200);
            globalParticles.emitText(spore.owner === "player" ? "+NODE CONQUERED!" : "NODE LOST!", targetNode.pos.x, targetNode.pos.y - 30, winCol, 15);
          }
        }

        this.spores.splice(i, 1);
      }
    }

    // 4. Check Victory / Defeat Conditions
    const playerNodes = this.nodes.filter((n) => n.owner === "player");
    const enemyNodes = this.nodes.filter((n) => n.owner === "enemy");

    if (enemyNodes.length === 0 && this.spores.every((s) => s.owner !== "enemy") && !this.isWon) {
      this.isWon = true;
      this.score += 2500 * this.level;
      this.ctx.session.setStatus("ready");
      this.ctx.audio?.playVictory?.();
      globalParticles.emitBurst(300, 350, 60, ["#34D399", "#38BDF8", "#FBBF24", "#FFFFFF"], 100, 320);
      globalParticles.emitText("COLONY EXPANSION COMPLETE!", 300, 140, "#34D399", 24);
    } else if (playerNodes.length === 0 && this.spores.every((s) => s.owner !== "player") && !this.isGameOver) {
      this.isGameOver = true;
      this.ctx.session.setStatus("ready");
      this.ctx.audio?.playExplosion?.();
      globalParticles.emitText("COLONY OVERRUN!", 300, 140, "#EF4444", 24);
    }
  }

  private runEnemyAi(): void {
    const enemyNodes = this.nodes.filter((n) => n.owner === "enemy" && n.count >= 12);
    if (enemyNodes.length === 0) return;

    // Pick a strong enemy node
    const source = enemyNodes[Math.floor(Math.random() * enemyNodes.length)];

    // Find nearest vulnerable non-enemy node
    const candidates = this.nodes.filter((n) => n.id !== source.id && n.owner !== "enemy");
    if (candidates.length > 0) {
      candidates.sort((a, b) => a.count - b.count);
      const target = candidates[0];
      this.launchSpores(source.id, target.id, "enemy");
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (this.isWon) {
      if (action === "ACTION_PRIMARY" || action === "CONFIRM") {
        this.nextLevel();
      } else if (action === "RESTART") {
        this.reset();
      }
      return;
    }

    if (action === "RESTART") {
      this.reset();
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {
    if (typeof window !== "undefined") {
      if (this.boundPointerDown) window.removeEventListener("pointerdown", this.boundPointerDown);
      if (this.boundPointerMove) window.removeEventListener("pointermove", this.boundPointerMove);
    }
  }

  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const ctx2d = (pr as any).getContext?.() as CanvasRenderingContext2D | undefined;
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Dark-Field Bioluminescent Cytology Petri Dish
    if (ctx2d) {
      const bgGrad = ctx2d.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, 380);
      bgGrad.addColorStop(0, "#08101E");
      bgGrad.addColorStop(0.6, "#040912");
      bgGrad.addColorStop(1, "#020408");
      ctx2d.fillStyle = bgGrad;
      ctx2d.fillRect(0, 0, w, h);

      // Glass Petri Dish Rim
      ctx2d.save();
      ctx2d.strokeStyle = "rgba(56, 189, 248, 0.25)";
      ctx2d.lineWidth = 3;
      ctx2d.shadowColor = "rgba(56, 189, 248, 0.2)";
      ctx2d.shadowBlur = 20;
      ctx2d.beginPath();
      ctx2d.arc(w / 2, h / 2 + 10, 275, 0, Math.PI * 2);
      ctx2d.stroke();
      ctx2d.restore();
    } else {
      pr.clear("#08101E");
    }

    // Micro-Grid Reticle Crosshairs
    pr.drawGrid(12, 14, 48, "rgba(56, 189, 248, 0.04)", 12, 12);

    // 2. Trajectory Attack Arrow (from selected node to hover target)
    if (this.selectedNodeId !== null && ctx2d) {
      const selNode = this.nodes.find((n) => n.id === this.selectedNodeId);
      if (selNode) {
        ctx2d.save();
        ctx2d.setLineDash([4, 6]);
        ctx2d.strokeStyle = "#38BDF8";
        ctx2d.lineWidth = 2;
        ctx2d.shadowColor = "#38BDF8";
        ctx2d.shadowBlur = 10;

        if (this.targetHoverNodeId !== null && this.targetHoverNodeId !== this.selectedNodeId) {
          const hoverNode = this.nodes.find((n) => n.id === this.targetHoverNodeId);
          if (hoverNode) {
            ctx2d.beginPath();
            ctx2d.moveTo(selNode.pos.x, selNode.pos.y);
            ctx2d.lineTo(hoverNode.pos.x, hoverNode.pos.y);
            ctx2d.stroke();
          }
        }
        ctx2d.restore();
      }
    }

    // 3. Render Colony Membrane Nodes
    for (const node of this.nodes) {
      const isSelected = this.selectedNodeId === node.id;
      const isHover = this.targetHoverNodeId === node.id;
      const pulse = Math.sin(node.pulsePhase) * 2;

      let baseColor = "#FBBF24"; // Neutral (Amber)
      let glowColor = "rgba(251, 191, 36, 0.4)";
      if (node.owner === "player") {
        baseColor = "#38BDF8"; // Player (Cyan / Blue)
        glowColor = "rgba(56, 189, 248, 0.6)";
      } else if (node.owner === "enemy") {
        baseColor = "#F43F5E"; // Enemy (Crimson Red)
        glowColor = "rgba(244, 63, 94, 0.6)";
      }

      if (ctx2d) {
        ctx2d.save();

        // Membrane Ambient Glow
        ctx2d.shadowColor = glowColor;
        ctx2d.shadowBlur = isSelected ? 24 : 14;

        // Fluid Biological Outer Membrane
        const radGrad = ctx2d.createRadialGradient(
          node.pos.x - 6,
          node.pos.y - 6,
          4,
          node.pos.x,
          node.pos.y,
          node.radius + pulse
        );
        radGrad.addColorStop(0, "#FFFFFF");
        radGrad.addColorStop(0.35, baseColor);
        radGrad.addColorStop(1, "#0A101C");
        ctx2d.fillStyle = radGrad;

        ctx2d.beginPath();
        ctx2d.arc(node.pos.x, node.pos.y, node.radius + pulse, 0, Math.PI * 2);
        ctx2d.fill();

        // Concentric Nucleus Rings
        ctx2d.strokeStyle = isSelected ? "#FFFFFF" : baseColor;
        ctx2d.lineWidth = isSelected ? 3.5 : 2;
        ctx2d.stroke();

        // Inner DNA Ribosome Core
        ctx2d.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx2d.beginPath();
        ctx2d.arc(node.pos.x, node.pos.y, (node.radius + pulse) * 0.45, 0, Math.PI * 2);
        ctx2d.fill();

        ctx2d.restore();
      }

      // Energy Population Count
      pr.drawText(Math.floor(node.count).toString(), node.pos.x, node.pos.y + 4, {
        size: 16,
        color: "#FFFFFF",
        align: "center",
        font: "bold monospace",
      });

      // Node Owner Sub-label
      const ownerLabel = node.owner === "player" ? "ALLIED" : node.owner === "enemy" ? "VIRUS" : "NEUTRAL";
      pr.drawText(ownerLabel, node.pos.x, node.pos.y + node.radius + 18, {
        size: 10,
        color: baseColor,
        align: "center",
        font: "monospace",
      });
    }

    // 4. Render Active Flowing Spore Swarms
    for (const spore of this.spores) {
      const sporeColor = spore.owner === "player" ? "#38BDF8" : "#F43F5E";
      if (ctx2d) {
        ctx2d.save();
        ctx2d.shadowColor = sporeColor;
        ctx2d.shadowBlur = 8;
        ctx2d.fillStyle = sporeColor;
        ctx2d.beginPath();
        ctx2d.arc(spore.pos.x, spore.pos.y, spore.radius, 0, Math.PI * 2);
        ctx2d.fill();

        // Spore tail
        ctx2d.fillStyle = "#FFFFFF";
        ctx2d.beginPath();
        ctx2d.arc(spore.pos.x, spore.pos.y, spore.radius * 0.5, 0, Math.PI * 2);
        ctx2d.fill();
        ctx2d.restore();
      } else {
        pr.drawCircle(spore.pos.x, spore.pos.y, spore.radius, sporeColor, true);
      }
    }

    // 5. Particle FX
    globalParticles.render(pr);

    // 6. Top Tactical HUD
    pr.drawRect(16, 12, w - 32, 44, "rgba(15, 23, 42, 0.94)", true);
    pr.drawRect(16, 12, w - 32, 44, "#38BDF8", false);

    pr.drawText(`STAGE ${this.level} • BIOSPHERE CONQUEST`, 28, 28, {
      size: 12.5,
      color: "#38BDF8",
      font: "system-ui, -apple-system, sans-serif",
    });

    pr.drawText(`SCORE: ${this.score}`, w - 28, 28, {
      size: 13,
      color: "#FBBF24",
      align: "right",
      font: "monospace",
    });

    // 7. Sub-Dish Controls & Instructions
    pr.drawRect(16, h - 54, w - 32, 42, "rgba(15, 23, 42, 0.94)", true);
    pr.drawRect(16, h - 54, w - 32, 42, "#334155", false);

    pr.drawText("[HOW TO PLAY: CLICK YOUR BLUE NODE  $\to$  CLICK TARGET TO SEND SPORES]", w / 2, h - 28, {
      size: 11,
      color: "#FBBF24",
      align: "center",
      font: "monospace",
    });

    // 8. Victory / Defeat Overlay
    if (this.isWon) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(8, 14, 28, 0.96)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, "#34D399", false);
      pr.drawText("STAGE CONQUERED — VIRUS ERADICATED!", w / 2, h / 2 - 12, {
        size: 20,
        color: "#34D399",
        align: "center",
        font: "system-ui, -apple-system, sans-serif",
      });
      pr.drawText("CLICK ANYWHERE OR PRESS [SPACE] FOR NEXT STAGE", w / 2, h / 2 + 18, {
        size: 13,
        color: "#FFFFFF",
        align: "center",
        font: "monospace",
      });
    } else if (this.isGameOver) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(8, 14, 28, 0.96)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, "#EF4444", false);
      pr.drawText("COLONY EXTINCT — OVERRUN BY VIRUS", w / 2, h / 2 - 12, {
        size: 20,
        color: "#EF4444",
        align: "center",
        font: "system-ui, -apple-system, sans-serif",
      });
      pr.drawText("CLICK ANYWHERE OR PRESS [R] TO RETRY", w / 2, h / 2 + 18, {
        size: 13,
        color: "#CBD5E1",
        align: "center",
        font: "monospace",
      });
    }
  }
}
