import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";

type GateType = "INPUT" | "OUTPUT" | "AND" | "OR" | "NOT" | "XOR" | "NAND";

interface Node {
  id: number;
  type: GateType;
  inputs: number[];
  x: number;
  y: number;
  state: boolean;
  targetState?: boolean;
  label?: string;
}

interface LevelConfig {
  name: string;
  hint: string;
  nodes: Node[];
}

const GATE_DESCRIPTIONS: Record<string, string> = {
  AND: "AND GATE: Output is [1] only when BOTH inputs are [1]",
  OR: "OR GATE: Output is [1] if AT LEAST ONE input is [1]",
  NOT: "NOT GATE: Inverts the signal (0 becomes 1, 1 becomes 0)",
  XOR: "XOR GATE: Output is [1] if inputs are DIFFERENT",
  NAND: "NAND GATE: Inverted AND (Output is [0] only when BOTH are 1)",
};

const LEVELS: Record<number, LevelConfig> = {
  1: {
    name: "TUTORIAL 1: THE 'AND' GATE",
    hint: "AND needs BOTH inputs to be HIGH [1] to activate.",
    nodes: [
      { id: 0, type: "INPUT", inputs: [], x: 100, y: 200, state: false, label: "IN A" },
      { id: 1, type: "INPUT", inputs: [], x: 100, y: 340, state: false, label: "IN B" },
      { id: 2, type: "AND", inputs: [0, 1], x: 290, y: 270, state: false },
      { id: 3, type: "OUTPUT", inputs: [2], x: 480, y: 270, state: false, targetState: true, label: "TARGET: 1" },
    ],
  },
  2: {
    name: "TUTORIAL 2: THE 'OR' GATE",
    hint: "OR activates if ANY input is HIGH [1].",
    nodes: [
      { id: 0, type: "INPUT", inputs: [], x: 100, y: 200, state: false, label: "IN A" },
      { id: 1, type: "INPUT", inputs: [], x: 100, y: 340, state: false, label: "IN B" },
      { id: 2, type: "OR", inputs: [0, 1], x: 290, y: 270, state: false },
      { id: 3, type: "OUTPUT", inputs: [2], x: 480, y: 270, state: false, targetState: true, label: "TARGET: 1" },
    ],
  },
  3: {
    name: "TUTORIAL 3: THE 'NOT' INVERTER",
    hint: "NOT turns 0 into 1, and 1 into 0. Output target is LOW [0].",
    nodes: [
      { id: 0, type: "INPUT", inputs: [], x: 100, y: 270, state: false, label: "IN A" },
      { id: 1, type: "NOT", inputs: [0], x: 290, y: 270, state: true },
      { id: 2, type: "OUTPUT", inputs: [1], x: 480, y: 270, state: true, targetState: false, label: "TARGET: 0" },
    ],
  },
  4: {
    name: "TUTORIAL 4: THE 'XOR' (EXCLUSIVE OR)",
    hint: "XOR is HIGH only when inputs are DIFFERENT (one is 1, other is 0).",
    nodes: [
      { id: 0, type: "INPUT", inputs: [], x: 100, y: 200, state: true, label: "IN A" },
      { id: 1, type: "INPUT", inputs: [], x: 100, y: 340, state: true, label: "IN B" },
      { id: 2, type: "XOR", inputs: [0, 1], x: 290, y: 270, state: false },
      { id: 3, type: "OUTPUT", inputs: [2], x: 480, y: 270, state: false, targetState: true, label: "TARGET: 1" },
    ],
  },
  5: {
    name: "TUTORIAL 5: THE 'NAND' GATE",
    hint: "NAND is opposite of AND. It outputs 0 only when BOTH inputs are 1.",
    nodes: [
      { id: 0, type: "INPUT", inputs: [], x: 100, y: 200, state: false, label: "IN A" },
      { id: 1, type: "INPUT", inputs: [], x: 100, y: 340, state: true, label: "IN B" },
      { id: 2, type: "NAND", inputs: [0, 1], x: 290, y: 270, state: true },
      { id: 3, type: "OUTPUT", inputs: [2], x: 480, y: 270, state: true, targetState: false, label: "TARGET: 0" },
    ],
  },
  6: {
    name: "LEVEL 6: DUAL STAGE (AND + OR)",
    hint: "Route the signals through AND then combine with IN C via OR.",
    nodes: [
      { id: 0, type: "INPUT", inputs: [], x: 90, y: 170, state: false, label: "IN A" },
      { id: 1, type: "INPUT", inputs: [], x: 90, y: 270, state: false, label: "IN B" },
      { id: 2, type: "INPUT", inputs: [], x: 90, y: 370, state: false, label: "IN C" },
      { id: 3, type: "AND", inputs: [0, 1], x: 260, y: 220, state: false },
      { id: 4, type: "OR", inputs: [3, 2], x: 400, y: 300, state: false },
      { id: 5, type: "OUTPUT", inputs: [4], x: 520, y: 300, state: false, targetState: true, label: "TARGET: 1" },
    ],
  },
  7: {
    name: "LEVEL 7: INVERTED MASK (NOT + AND)",
    hint: "IN A is inverted before entering the AND gate.",
    nodes: [
      { id: 0, type: "INPUT", inputs: [], x: 90, y: 200, state: true, label: "IN A" },
      { id: 1, type: "INPUT", inputs: [], x: 90, y: 340, state: false, label: "IN B" },
      { id: 2, type: "NOT", inputs: [0], x: 240, y: 200, state: false },
      { id: 3, type: "AND", inputs: [2, 1], x: 380, y: 270, state: false },
      { id: 4, type: "OUTPUT", inputs: [3], x: 510, y: 270, state: false, targetState: true, label: "TARGET: 1" },
    ],
  },
  8: {
    name: "LEVEL 8: 3-INPUT MAJORITY VOTER",
    hint: "Output goes HIGH when at least 2 inputs agree.",
    nodes: [
      { id: 0, type: "INPUT", inputs: [], x: 90, y: 160, state: false, label: "IN A" },
      { id: 1, type: "INPUT", inputs: [], x: 90, y: 280, state: false, label: "IN B" },
      { id: 2, type: "INPUT", inputs: [], x: 90, y: 400, state: false, label: "IN C" },
      { id: 3, type: "AND", inputs: [0, 1], x: 240, y: 200, state: false },
      { id: 4, type: "AND", inputs: [1, 2], x: 240, y: 340, state: false },
      { id: 5, type: "OR", inputs: [3, 4], x: 380, y: 270, state: false },
      { id: 6, type: "OUTPUT", inputs: [5], x: 510, y: 270, state: false, targetState: true, label: "TARGET: 1" },
    ],
  },
  9: {
    name: "LEVEL 9: HALF-ADDER CIRCUIT",
    hint: "Make SUM [XOR] output 0 and CARRY [AND] output 1 simultaneously!",
    nodes: [
      { id: 0, type: "INPUT", inputs: [], x: 90, y: 210, state: false, label: "BIT A" },
      { id: 1, type: "INPUT", inputs: [], x: 90, y: 350, state: false, label: "BIT B" },
      { id: 2, type: "XOR", inputs: [0, 1], x: 280, y: 210, state: false },
      { id: 3, type: "AND", inputs: [0, 1], x: 280, y: 350, state: false },
      { id: 4, type: "OUTPUT", inputs: [2], x: 490, y: 210, state: false, targetState: false, label: "SUM: 0" },
      { id: 5, type: "OUTPUT", inputs: [3], x: 490, y: 350, state: false, targetState: true, label: "CARRY: 1" },
    ],
  },
  10: {
    name: "LEVEL 10: 2-TO-1 MULTIPLEXER (MUX)",
    hint: "SEL chooses which input (D0 or D1) routes to the output.",
    nodes: [
      { id: 0, type: "INPUT", inputs: [], x: 80, y: 150, state: true, label: "DATA 0" },
      { id: 1, type: "INPUT", inputs: [], x: 80, y: 260, state: false, label: "SELECT" },
      { id: 2, type: "INPUT", inputs: [], x: 80, y: 370, state: false, label: "DATA 1" },
      { id: 3, type: "NOT", inputs: [1], x: 210, y: 200, state: true },
      { id: 4, type: "AND", inputs: [0, 3], x: 330, y: 170, state: false },
      { id: 5, type: "AND", inputs: [2, 1], x: 330, y: 330, state: false },
      { id: 6, type: "OR", inputs: [4, 5], x: 440, y: 260, state: false },
      { id: 7, type: "OUTPUT", inputs: [6], x: 540, y: 260, state: false, targetState: true, label: "OUT: 1" },
    ],
  },
};

export class LogicGatesGame implements GameInstance {
  private ctx!: GameContext;
  private nodes: Node[] = [];
  private selectedInputIndex: number = 0;
  private inputNodes: Node[] = [];
  private currentLevel: number = 1;
  private maxLevel: number = 10;
  private score: number = 0;
  private winTimer: number = 0;
  private levelCleared: boolean = false;
  private animTime: number = 0;

  private boundPointerDown?: (e: MouseEvent | PointerEvent) => void;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
    this.attachPointerControls();
  }

  private attachPointerControls(): void {
    this.boundPointerDown = (e: MouseEvent | PointerEvent) => {
      if (this.levelCleared) return;

      const target = e.target as HTMLElement;
      if (target && target.tagName === "CANVAS") {
        const rect = target.getBoundingClientRect();
        const scaleX = 600 / rect.width;
        const scaleY = 700 / rect.height;
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;

        // Check if clicking directly on any INPUT Switch
        for (let i = 0; i < this.inputNodes.length; i++) {
          const inNode = this.inputNodes[i];
          const hitW = 74;
          const hitH = 50;

          if (
            clickX >= inNode.x - hitW / 2 &&
            clickX <= inNode.x + hitW / 2 &&
            clickY >= inNode.y - hitH / 2 &&
            clickY <= inNode.y + hitH / 2
          ) {
            this.selectedInputIndex = i;
            this.toggleInput(inNode);
            return;
          }
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("pointerdown", this.boundPointerDown);
    }
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.currentLevel = 1;
    this.score = 0;
    this.loadLevel(this.currentLevel);
  }

  private loadLevel(lvl: number): void {
    this.levelCleared = false;
    this.winTimer = 0;
    this.selectedInputIndex = 0;
    this.animTime = 0;

    const cfg = LEVELS[lvl] || LEVELS[1];
    this.nodes = JSON.parse(JSON.stringify(cfg.nodes));
    this.inputNodes = this.nodes.filter((n) => n.type === "INPUT");
    this.evaluateCircuit();

    globalParticles.emitText(`LEVEL ${lvl}: ${cfg.name}`, 300, 320, "#38BDF8", 20);
  }

  private toggleInput(node: Node): void {
    node.state = !node.state;
    const mainNode = this.nodes.find((n) => n.id === node.id);
    if (mainNode) mainNode.state = node.state;

    this.ctx.audio?.playRotate?.();
    globalParticles.emitBurst(node.x, node.y, 12, [node.state ? "#34D399" : "#64748B", "#FFFFFF"], 40, 150);
    this.evaluateCircuit();
  }

  private evaluateCircuit(): void {
    for (let iter = 0; iter < 5; iter++) {
      for (const node of this.nodes) {
        if (node.type === "AND" && node.inputs.length >= 2) {
          const in1 = this.nodes.find((n) => n.id === node.inputs[0])?.state || false;
          const in2 = this.nodes.find((n) => n.id === node.inputs[1])?.state || false;
          node.state = in1 && in2;
        } else if (node.type === "OR" && node.inputs.length >= 2) {
          const in1 = this.nodes.find((n) => n.id === node.inputs[0])?.state || false;
          const in2 = this.nodes.find((n) => n.id === node.inputs[1])?.state || false;
          node.state = in1 || in2;
        } else if (node.type === "NOT" && node.inputs.length >= 1) {
          const in1 = this.nodes.find((n) => n.id === node.inputs[0])?.state || false;
          node.state = !in1;
        } else if (node.type === "XOR" && node.inputs.length >= 2) {
          const in1 = this.nodes.find((n) => n.id === node.inputs[0])?.state || false;
          const in2 = this.nodes.find((n) => n.id === node.inputs[1])?.state || false;
          node.state = in1 !== in2;
        } else if (node.type === "NAND" && node.inputs.length >= 2) {
          const in1 = this.nodes.find((n) => n.id === node.inputs[0])?.state || false;
          const in2 = this.nodes.find((n) => n.id === node.inputs[1])?.state || false;
          node.state = !(in1 && in2);
        } else if (node.type === "OUTPUT" && node.inputs.length >= 1) {
          const in1 = this.nodes.find((n) => n.id === node.inputs[0])?.state || false;
          node.state = in1;
        }
      }
    }

    // Check if output matches target
    const outputNodes = this.nodes.filter((n) => n.type === "OUTPUT");
    const allOutputsMatch = outputNodes.every(
      (n) => n.targetState === undefined || n.state === n.targetState
    );

    if (allOutputsMatch && !this.levelCleared) {
      this.levelCleared = true;
      this.winTimer = 1.0;
      this.score += 500 * this.currentLevel;
      this.ctx.audio?.playVictory?.();
      globalParticles.emitBurst(300, 350, 45, ["#34D399", "#38BDF8", "#FBBF24", "#FFFFFF"], 80, 260);
      globalParticles.emitText("LOGIC SOLVED! +500", 300, 140, "#34D399", 22);
    }
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    this.animTime += dt;

    if (this.levelCleared) {
      this.winTimer -= dt;
      if (this.winTimer <= 0) {
        if (this.currentLevel < this.maxLevel) {
          this.currentLevel++;
          this.loadLevel(this.currentLevel);
        } else {
          this.score += 5000;
          this.currentLevel = 1;
          this.loadLevel(1);
        }
      }
    }
  }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const ctx2d = (pr as any).getContext?.() as CanvasRenderingContext2D | undefined;
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    const cfg = LEVELS[this.currentLevel] || LEVELS[1];

    // 1. Dark PCB Circuit Board Background
    if (ctx2d) {
      const bgGrad = ctx2d.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, "#08101E");
      bgGrad.addColorStop(0.5, "#0D1829");
      bgGrad.addColorStop(1, "#050B14");
      ctx2d.fillStyle = bgGrad;
      ctx2d.fillRect(0, 0, w, h);
    } else {
      pr.clear("#08101E");
    }

    // PCB Solder Grid Dots
    for (let gx = 40; gx < w; gx += 40) {
      for (let gy = 80; gy < h - 140; gy += 40) {
        pr.drawCircle(gx, gy, 1.5, "rgba(56, 189, 248, 0.08)", true);
      }
    }

    // 2. Header Info & Objective Banner
    pr.drawRect(16, 12, w - 32, 54, "rgba(15, 23, 42, 0.94)", true);
    pr.drawRect(16, 12, w - 32, 54, "#38BDF8", false);

    pr.drawText(`LEVEL ${this.currentLevel}/${this.maxLevel}: ${cfg.name}`, 28, 32, {
      size: 13,
      color: "#FBBF24",
      font: "system-ui, -apple-system, sans-serif",
    });

    pr.drawText(`SCORE: ${this.score}`, w - 28, 32, {
      size: 13,
      color: "#38BDF8",
      align: "right",
      font: "monospace",
    });

    pr.drawText(`HINT: ${cfg.hint}`, 28, 52, {
      size: 11,
      color: "#94A3B8",
      font: "monospace",
    });

    // 3. Draw Active Glowing Copper Circuit Traces (Wires)
    for (const node of this.nodes) {
      for (const inId of node.inputs) {
        const inNode = this.nodes.find((n) => n.id === inId);
        if (inNode) {
          const wireActive = inNode.state;
          const wireColor = wireActive ? "#34D399" : "#1E293B";
          const glowColor = wireActive ? "rgba(52, 211, 153, 0.5)" : "transparent";

          const startX = inNode.x + 36;
          const startY = inNode.y;
          const endX = node.x - 36;
          const endY = node.y;
          const midX = (startX + endX) / 2;

          if (ctx2d && wireActive) {
            ctx2d.save();
            ctx2d.shadowColor = glowColor;
            ctx2d.shadowBlur = 12;
            ctx2d.strokeStyle = wireColor;
            ctx2d.lineWidth = 3.5;
            ctx2d.beginPath();
            ctx2d.moveTo(startX, startY);
            ctx2d.lineTo(midX, startY);
            ctx2d.lineTo(midX, endY);
            ctx2d.lineTo(endX, endY);
            ctx2d.stroke();
            ctx2d.restore();
          } else {
            pr.drawLine(startX, startY, midX, startY, wireColor, 2.5);
            pr.drawLine(midX, startY, midX, endY, wireColor, 2.5);
            pr.drawLine(midX, endY, endX, endY, wireColor, 2.5);
          }

          // Flowing Signal Current Pulse
          if (wireActive) {
            const t = (this.animTime * 1.5) % 1.0;
            const pulseX = startX + (endX - startX) * t;
            const pulseY = t < 0.5 ? startY : endY;
            pr.drawCircle(pulseX, pulseY, 3.5, "#FFFFFF", true);
          }

          // Gold Solder Joint Terminals
          pr.drawCircle(startX, startY, 4, wireActive ? "#34D399" : "#475569", true);
          pr.drawCircle(endX, endY, 4, wireActive ? "#34D399" : "#475569", true);
        }
      }
    }

    // 4. Render Logic Gate IC Nodes & Interactive Tactile Switches
    for (const node of this.nodes) {
      if (node.type === "INPUT") {
        // --- Tactile Input Lever Switch (Clickable & Keyboard Selectable) ---
        const isSelected = this.inputNodes[this.selectedInputIndex]?.id === node.id;
        const isOn = node.state;

        if (ctx2d) {
          ctx2d.save();
          ctx2d.fillStyle = isOn ? "rgba(16, 185, 129, 0.25)" : "rgba(30, 41, 59, 0.7)";
          ctx2d.strokeStyle = isSelected ? "#FBBF24" : (isOn ? "#34D399" : "#475569");
          ctx2d.lineWidth = isSelected ? 3 : 2;
          ctx2d.shadowColor = isOn ? "rgba(52, 211, 153, 0.4)" : "transparent";
          ctx2d.shadowBlur = 14;
          ctx2d.beginPath();
          ctx2d.roundRect(node.x - 36, node.y - 24, 72, 48, 10);
          ctx2d.fill();
          ctx2d.stroke();
          ctx2d.restore();
        }

        // Switch Status Label
        pr.drawText(node.label || "INPUT", node.x, node.y - 10, {
          size: 9.5,
          color: "#94A3B8",
          align: "center",
          font: "monospace",
        });

        pr.drawText(isOn ? "[ 1 ] HIGH" : "[ 0 ] LOW", node.x, node.y + 11, {
          size: 11,
          color: isOn ? "#34D399" : "#64748B",
          align: "center",
          font: "bold monospace",
        });

        // Toggle Status LED
        pr.drawCircle(node.x + 24, node.y - 12, 3.5, isOn ? "#34D399" : "#334155", true);
      } else if (node.type === "OUTPUT") {
        // --- Output Terminal & Target Bulb ---
        const isMatched = node.targetState === undefined || node.state === node.targetState;
        const outColor = isMatched ? "#34D399" : "#EF4444";

        if (ctx2d) {
          ctx2d.save();
          ctx2d.fillStyle = "rgba(15, 23, 42, 0.95)";
          ctx2d.strokeStyle = outColor;
          ctx2d.lineWidth = 2.5;
          ctx2d.shadowColor = outColor;
          ctx2d.shadowBlur = 16;
          ctx2d.beginPath();
          ctx2d.roundRect(node.x - 36, node.y - 26, 72, 52, 10);
          ctx2d.fill();
          ctx2d.stroke();
          ctx2d.restore();
        }

        pr.drawText(node.label || "OUTPUT", node.x, node.y - 10, {
          size: 9.5,
          color: outColor,
          align: "center",
          font: "bold monospace",
        });

        pr.drawText(`CURRENT: [${node.state ? "1" : "0"}]`, node.x, node.y + 6, {
          size: 10,
          color: node.state ? "#34D399" : "#94A3B8",
          align: "center",
          font: "monospace",
        });

        pr.drawText(isMatched ? "MATCHED" : "UNMATCHED", node.x, node.y + 18, {
          size: 8.5,
          color: isMatched ? "#34D399" : "#EF4444",
          align: "center",
          font: "monospace",
        });
      } else {
        // --- Standard Logic Gate IC Chip (AND, OR, NOT, XOR, NAND) ---
        const isActive = node.state;
        const gateColor = isActive ? "#38BDF8" : "#64748B";

        if (ctx2d) {
          ctx2d.save();
          ctx2d.fillStyle = isActive ? "rgba(14, 116, 144, 0.3)" : "rgba(15, 23, 42, 0.9)";
          ctx2d.strokeStyle = gateColor;
          ctx2d.lineWidth = 2;
          ctx2d.shadowColor = isActive ? "rgba(56, 189, 248, 0.3)" : "transparent";
          ctx2d.shadowBlur = 10;
          ctx2d.beginPath();
          ctx2d.roundRect(node.x - 36, node.y - 24, 72, 48, 8);
          ctx2d.fill();
          ctx2d.stroke();
          ctx2d.restore();
        }

        // IC Chip Silver Pins
        for (let py = -12; py <= 12; py += 8) {
          pr.drawRect(node.x - 40, node.y + py - 2, 4, 4, "#94A3B8", true);
          pr.drawRect(node.x + 36, node.y + py - 2, 4, 4, "#94A3B8", true);
        }

        pr.drawText(node.type, node.x, node.y - 6, {
          size: 14,
          color: "#FFFFFF",
          align: "center",
          font: "bold system-ui, sans-serif",
        });

        pr.drawText(isActive ? "OUT: 1" : "OUT: 0", node.x, node.y + 12, {
          size: 10,
          color: isActive ? "#34D399" : "#64748B",
          align: "center",
          font: "monospace",
        });
      }
    }

    // 5. Particles
    globalParticles.render(pr);

    // 6. Bottom Interactive Help & Controls Bar
    pr.drawRect(16, h - 90, w - 32, 76, "rgba(15, 23, 42, 0.95)", true);
    pr.drawRect(16, h - 90, w - 32, 76, "#334155", false);

    // Gate Reference Tooltip
    const activeGateNode = this.nodes.find((n) => n.type !== "INPUT" && n.type !== "OUTPUT");
    const gateExpl = (activeGateNode && GATE_DESCRIPTIONS[activeGateNode.type]) || "FLIP INPUTS ON LEFT UNTIL OUTPUT MATCHES TARGET ON RIGHT";

    pr.drawText("LOGIC GATE RULE:", 28, h - 70, { size: 10.5, color: "#FBBF24", font: "bold monospace" });
    pr.drawText(gateExpl, 28, h - 54, { size: 10.5, color: "#38BDF8", font: "monospace" });

    pr.drawText("[HOW TO PLAY: CLICK INPUT SWITCHES ON LEFT  •  OR USE UP/DOWN + SPACE/ENTER]", w / 2, h - 26, {
      size: 9.5,
      color: "#94A3B8",
      align: "center",
      font: "monospace",
    });

    // 7. Victory Overlay
    if (this.levelCleared) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(8, 14, 28, 0.96)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, "#34D399", false);
      pr.drawText("CIRCUIT LOGIC VERIFIED!", w / 2, h / 2 - 12, {
        size: 22,
        color: "#34D399",
        align: "center",
        font: "system-ui, -apple-system, sans-serif",
      });
      pr.drawText("SYNCHRONIZING NEXT SCHEMATIC...", w / 2, h / 2 + 18, {
        size: 13,
        color: "#FFFFFF",
        align: "center",
        font: "monospace",
      });
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.levelCleared) return;

    if (action === "MOVE_UP") {
      this.selectedInputIndex =
        (this.selectedInputIndex - 1 + this.inputNodes.length) % this.inputNodes.length;
      this.ctx.audio?.playMove?.();
    } else if (action === "MOVE_DOWN") {
      this.selectedInputIndex = (this.selectedInputIndex + 1) % this.inputNodes.length;
      this.ctx.audio?.playMove?.();
    } else if (action === "ACTION_PRIMARY" || action === "CONFIRM" || action === "ROTATE") {
      const selected = this.inputNodes[this.selectedInputIndex];
      if (selected) {
        this.toggleInput(selected);
      }
    } else if (action === "RESTART") {
      this.reset();
    }
  }

  public getScore(): number { return this.score; }
  public getLevel(): number { return this.currentLevel; }
  public pause(): void {}
  public resume(): void {}
  public destroy(): void {
    if (this.boundPointerDown && typeof window !== "undefined") {
      window.removeEventListener("pointerdown", this.boundPointerDown);
    }
  }
}
