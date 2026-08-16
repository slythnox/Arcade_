import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

type GateType = "INPUT" | "OUTPUT" | "AND" | "OR" | "NOT" | "XOR" | "NAND";

interface Node {
  id: number;
  type: GateType;
  inputs: number[];
  x: number;
  y: number;
  state: boolean;
  targetState?: boolean; // For OUTPUT nodes: expected solution
}

interface LevelConfig {
  name: string;
  nodes: Node[];
}

export class LogicGatesGame implements GameInstance {
  private ctx!: GameContext;
  private nodes: Node[] = [];
  private selectedInputIndex: number = 0;
  private inputNodes: Node[] = [];
  private currentLevel: number = 1;
  private maxLevel: number = 15;
  private score: number = 0;
  private winTimer: number = 0;
  private levelCleared: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(): void {
    this.currentLevel = 1;
    this.score = 0;
    this.loadLevel(this.currentLevel);
  }

  private loadLevel(lvl: number): void {
    this.levelCleared = false;
    this.winTimer = 0;
    this.selectedInputIndex = 0;

    const levels: Record<number, LevelConfig> = {
      1: {
        name: "Intro: AND Gate (Target: ON)",
        nodes: [
          { id: 0, type: "INPUT", inputs: [], x: 120, y: 220, state: false },
          { id: 1, type: "INPUT", inputs: [], x: 120, y: 340, state: true },
          { id: 2, type: "AND", inputs: [0, 1], x: 300, y: 280, state: false },
          { id: 3, type: "OUTPUT", inputs: [2], x: 480, y: 280, state: false, targetState: true },
        ],
      },
      2: {
        name: "Level 2: OR Gate (Target: ON)",
        nodes: [
          { id: 0, type: "INPUT", inputs: [], x: 120, y: 220, state: false },
          { id: 1, type: "INPUT", inputs: [], x: 120, y: 340, state: false },
          { id: 2, type: "OR", inputs: [0, 1], x: 300, y: 280, state: false },
          { id: 3, type: "OUTPUT", inputs: [2], x: 480, y: 280, state: false, targetState: true },
        ],
      },
      3: {
        name: "Level 3: NOT Inverter (Target: OFF)",
        nodes: [
          { id: 0, type: "INPUT", inputs: [], x: 120, y: 280, state: false },
          { id: 1, type: "NOT", inputs: [0], x: 300, y: 280, state: true },
          { id: 2, type: "OUTPUT", inputs: [1], x: 480, y: 280, state: true, targetState: false },
        ],
      },
      4: {
        name: "Level 4: XOR Parity (Target: ON)",
        nodes: [
          { id: 0, type: "INPUT", inputs: [], x: 120, y: 220, state: true },
          { id: 1, type: "INPUT", inputs: [], x: 120, y: 340, state: true },
          { id: 2, type: "XOR", inputs: [0, 1], x: 300, y: 280, state: false },
          { id: 3, type: "OUTPUT", inputs: [2], x: 480, y: 280, state: false, targetState: true },
        ],
      },
      5: {
        name: "Level 5: NAND Universal (Target: OFF)",
        nodes: [
          { id: 0, type: "INPUT", inputs: [], x: 120, y: 220, state: false },
          { id: 1, type: "INPUT", inputs: [], x: 120, y: 340, state: true },
          { id: 2, type: "NAND", inputs: [0, 1], x: 300, y: 280, state: true },
          { id: 3, type: "OUTPUT", inputs: [2], x: 480, y: 280, state: true, targetState: false },
        ],
      },
      6: {
        name: "Level 6: Dual Stage AND-OR",
        nodes: [
          { id: 0, type: "INPUT", inputs: [], x: 100, y: 180, state: false },
          { id: 1, type: "INPUT", inputs: [], x: 100, y: 260, state: false },
          { id: 2, type: "INPUT", inputs: [], x: 100, y: 360, state: false },
          { id: 3, type: "AND", inputs: [0, 1], x: 260, y: 220, state: false },
          { id: 4, type: "OR", inputs: [3, 2], x: 400, y: 290, state: false },
          { id: 5, type: "OUTPUT", inputs: [4], x: 520, y: 290, state: false, targetState: true },
        ],
      },
      7: {
        name: "Level 7: Inverted AND Mask",
        nodes: [
          { id: 0, type: "INPUT", inputs: [], x: 100, y: 200, state: true },
          { id: 1, type: "INPUT", inputs: [], x: 100, y: 340, state: false },
          { id: 2, type: "NOT", inputs: [0], x: 240, y: 200, state: false },
          { id: 3, type: "AND", inputs: [2, 1], x: 380, y: 270, state: false },
          { id: 4, type: "OUTPUT", inputs: [3], x: 500, y: 270, state: false, targetState: true },
        ],
      },
      8: {
        name: "Level 8: 3-Input Majority Voter",
        nodes: [
          { id: 0, type: "INPUT", inputs: [], x: 90, y: 160, state: false },
          { id: 1, type: "INPUT", inputs: [], x: 90, y: 280, state: false },
          { id: 2, type: "INPUT", inputs: [], x: 90, y: 400, state: false },
          { id: 3, type: "AND", inputs: [0, 1], x: 240, y: 200, state: false },
          { id: 4, type: "AND", inputs: [1, 2], x: 240, y: 340, state: false },
          { id: 5, type: "OR", inputs: [3, 4], x: 380, y: 270, state: false },
          { id: 6, type: "OUTPUT", inputs: [5], x: 500, y: 270, state: false, targetState: true },
        ],
      },
      9: {
        name: "Level 9: Half-Adder Sum & Carry",
        nodes: [
          { id: 0, type: "INPUT", inputs: [], x: 100, y: 220, state: false },
          { id: 1, type: "INPUT", inputs: [], x: 100, y: 340, state: false },
          { id: 2, type: "XOR", inputs: [0, 1], x: 280, y: 220, state: false },
          { id: 3, type: "AND", inputs: [0, 1], x: 280, y: 340, state: false },
          { id: 4, type: "OUTPUT", inputs: [2], x: 480, y: 220, state: false, targetState: false },
          { id: 5, type: "OUTPUT", inputs: [3], x: 480, y: 340, state: false, targetState: true },
        ],
      },
      10: {
        name: "Level 10: Exclusive NOR Matrix",
        nodes: [
          { id: 0, type: "INPUT", inputs: [], x: 100, y: 200, state: true },
          { id: 1, type: "INPUT", inputs: [], x: 100, y: 340, state: false },
          { id: 2, type: "XOR", inputs: [0, 1], x: 260, y: 270, state: false },
          { id: 3, type: "NOT", inputs: [2], x: 380, y: 270, state: true },
          { id: 4, type: "OUTPUT", inputs: [3], x: 500, y: 270, state: true, targetState: true },
        ],
      },
      11: {
        name: "Level 11: 2-to-1 Multiplexer (Select Line)",
        nodes: [
          { id: 0, type: "INPUT", inputs: [], x: 90, y: 160, state: true },  // Data 0
          { id: 1, type: "INPUT", inputs: [], x: 90, y: 260, state: false }, // Sel
          { id: 2, type: "INPUT", inputs: [], x: 90, y: 360, state: false }, // Data 1
          { id: 3, type: "NOT", inputs: [1], x: 220, y: 210, state: true },
          { id: 4, type: "AND", inputs: [0, 3], x: 330, y: 180, state: false },
          { id: 5, type: "AND", inputs: [2, 1], x: 330, y: 320, state: false },
          { id: 6, type: "OR", inputs: [4, 5], x: 440, y: 260, state: false },
          { id: 7, type: "OUTPUT", inputs: [6], x: 540, y: 260, state: false, targetState: true },
        ],
      },
      12: {
        name: "Level 12: Dual Cross Inhibitor",
        nodes: [
          { id: 0, type: "INPUT", inputs: [], x: 100, y: 180, state: false },
          { id: 1, type: "INPUT", inputs: [], x: 100, y: 340, state: false },
          { id: 2, type: "NOT", inputs: [1], x: 240, y: 220, state: true },
          { id: 3, type: "AND", inputs: [0, 2], x: 380, y: 200, state: false },
          { id: 4, type: "OUTPUT", inputs: [3], x: 500, y: 200, state: false, targetState: true },
        ],
      },
      13: {
        name: "Level 13: 4-Input Parity Network",
        nodes: [
          { id: 0, type: "INPUT", inputs: [], x: 80, y: 140, state: false },
          { id: 1, type: "INPUT", inputs: [], x: 80, y: 230, state: false },
          { id: 2, type: "INPUT", inputs: [], x: 80, y: 320, state: false },
          { id: 3, type: "INPUT", inputs: [], x: 80, y: 410, state: false },
          { id: 4, type: "XOR", inputs: [0, 1], x: 240, y: 185, state: false },
          { id: 5, type: "XOR", inputs: [2, 3], x: 240, y: 365, state: false },
          { id: 6, type: "XOR", inputs: [4, 5], x: 390, y: 275, state: false },
          { id: 7, type: "OUTPUT", inputs: [6], x: 520, y: 275, state: false, targetState: true },
        ],
      },
      14: {
        name: "Level 14: Complex Comparator",
        nodes: [
          { id: 0, type: "INPUT", inputs: [], x: 90, y: 160, state: false },
          { id: 1, type: "INPUT", inputs: [], x: 90, y: 260, state: false },
          { id: 2, type: "INPUT", inputs: [], x: 90, y: 360, state: false },
          { id: 3, type: "NAND", inputs: [0, 1], x: 250, y: 200, state: true },
          { id: 4, type: "OR", inputs: [1, 2], x: 250, y: 320, state: false },
          { id: 5, type: "AND", inputs: [3, 4], x: 400, y: 260, state: false },
          { id: 6, type: "OUTPUT", inputs: [5], x: 520, y: 260, state: false, targetState: true },
        ],
      },
      15: {
        name: "Level 15: Grand Master Logic Gate",
        nodes: [
          { id: 0, type: "INPUT", inputs: [], x: 80, y: 140, state: false },
          { id: 1, type: "INPUT", inputs: [], x: 80, y: 220, state: true },
          { id: 2, type: "INPUT", inputs: [], x: 80, y: 300, state: false },
          { id: 3, type: "INPUT", inputs: [], x: 80, y: 380, state: false },
          { id: 4, type: "AND", inputs: [0, 1], x: 220, y: 180, state: false },
          { id: 5, type: "XOR", inputs: [2, 3], x: 220, y: 340, state: false },
          { id: 6, type: "NOT", inputs: [5], x: 340, y: 340, state: true },
          { id: 7, type: "OR", inputs: [4, 6], x: 440, y: 260, state: false },
          { id: 8, type: "OUTPUT", inputs: [7], x: 540, y: 260, state: false, targetState: true },
        ],
      },
    };

    const cfg = levels[lvl] || levels[1];
    this.nodes = JSON.parse(JSON.stringify(cfg.nodes));
    this.inputNodes = this.nodes.filter((n) => n.type === "INPUT");
    this.evaluateCircuit();
  }

  private evaluateCircuit(): void {
    // Topological evaluation of gate nodes
    for (let iter = 0; iter < 4; iter++) {
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

    // Check win condition
    const outputNodes = this.nodes.filter((n) => n.type === "OUTPUT");
    const allOutputsMatch = outputNodes.every(
      (n) => n.targetState === undefined || n.state === n.targetState
    );

    if (allOutputsMatch && !this.levelCleared) {
      this.levelCleared = true;
      this.winTimer = 0.8;
      this.score += 500 * this.currentLevel;
      this.ctx.audio?.playLineClear?.();
    }
  }

  public update(dt: number): void {
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
    pr.clear("#060a14");

    // Header Info
    pr.drawText(`LEVEL ${this.currentLevel} / ${this.maxLevel}`, 300, 36, {
      size: 16,
      align: "center",
      color: "#ffd84d",
    });
    pr.drawText(`[UP/DOWN] SELECT INPUT   [SPACE/ENTER] TOGGLE VALUE`, 300, 64, {
      size: 10,
      align: "center",
      color: "#94a3b8",
    });

    // Draw PCB Circuit Copper Traces (Wires)
    for (const node of this.nodes) {
      for (const inId of node.inputs) {
        const inNode = this.nodes.find((n) => n.id === inId);
        if (inNode) {
          const wireActive = inNode.state;
          const wireColor = wireActive ? "#00F0FF" : "#1e3a5f";
          
          // Orthogonal PCB trace routing
          const midX = (inNode.x + node.x) / 2;
          pr.drawLine(inNode.x + 28, inNode.y, midX, inNode.y, wireColor, wireActive ? 3 : 2);
          pr.drawLine(midX, inNode.y, midX, node.y, wireColor, wireActive ? 3 : 2);
          pr.drawLine(midX, node.y, node.x - 28, node.y, wireColor, wireActive ? 3 : 2);

          // Solder joint pads
          pr.drawCircle(inNode.x + 28, inNode.y, 3, wireActive ? "#38bdf8" : "#334155", true);
          pr.drawCircle(node.x - 28, node.y, 3, wireActive ? "#38bdf8" : "#334155", true);
        }
      }
    }

    // Draw Logic Gate DIP IC Chips
    for (const node of this.nodes) {
      const isSelectedInput =
        node.type === "INPUT" && this.inputNodes[this.selectedInputIndex]?.id === node.id;

      let bgColor = node.state ? "#0f2e42" : "#0f172a";
      let borderColor = node.state ? "#00F0FF" : "#334155";

      if (node.type === "INPUT") {
        bgColor = node.state ? "#14532d" : "#1e293b";
        borderColor = isSelectedInput ? "#ffd84d" : (node.state ? "#22c55e" : "#475569");
      } else if (node.type === "OUTPUT") {
        const isMatched = node.targetState === undefined || node.state === node.targetState;
        bgColor = isMatched ? "#14532d" : "#4c0519";
        borderColor = isMatched ? "#22c55e" : "#f43f5e";
      }

      // Ceramic IC Package Base
      pr.drawPixelBlock(node.x - 28, node.y - 20, 56, bgColor, "#475569", "#020617");
      pr.drawRect(node.x - 28, node.y - 20, 56, 40, borderColor, false);

      // Silver IC Pin Contacts on sides
      for (let py = -12; py <= 12; py += 8) {
        pr.drawRect(node.x - 32, node.y + py - 2, 4, 4, "#94a3b8", true);
        pr.drawRect(node.x + 28, node.y + py - 2, 4, 4, "#94a3b8", true);
      }

      if (isSelectedInput) {
        pr.drawRect(node.x - 34, node.y - 24, 68, 48, "#ffd84d", false);
      }

      // Gate text label
      let label: string = node.type;
      if (node.type === "INPUT") label = node.state ? "HIGH [1]" : "LOW [0]";
      if (node.type === "OUTPUT") label = `OUT [${node.state ? "1" : "0"}]`;

      pr.drawText(label, node.x, node.y - 2, {
        size: 9,
        align: "center",
        color: node.state ? "#ffffff" : "#94a3b8",
        font: "monospace",
      });

      if (node.type === "OUTPUT" && node.targetState !== undefined) {
        pr.drawText(`TARGET: ${node.targetState ? "1" : "0"}`, node.x, node.y + 11, {
          size: 8,
          align: "center",
          color: node.state === node.targetState ? "#22c55e" : "#f43f5e",
          font: "monospace",
        });
      }
    }

    if (this.levelCleared) {
      pr.drawRect(120, 240, 360, 80, "rgba(8,14,28,0.95)", true);
      pr.drawRect(120, 240, 360, 80, "#22c55e", false);
      pr.drawText("CIRCUIT LOGIC VERIFIED!", 300, 268, { size: 18, align: "center", color: "#22c55e", font: "monospace" });
      pr.drawText("SYNCHRONIZING NEXT SCHEMATIC...", 300, 296, { size: 11, align: "center", color: "#cbd5e1", font: "monospace" });
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed) return;

    if (action === "MOVE_UP") {
      this.selectedInputIndex =
        (this.selectedInputIndex - 1 + this.inputNodes.length) % this.inputNodes.length;
      this.ctx.audio?.playMove?.();
    } else if (action === "MOVE_DOWN") {
      this.selectedInputIndex = (this.selectedInputIndex + 1) % this.inputNodes.length;
      this.ctx.audio?.playMove?.();
    } else if (action === "ACTION_PRIMARY" || action === "ACTION_SECONDARY") {
      const selected = this.inputNodes[this.selectedInputIndex];
      if (selected) {
        selected.state = !selected.state;
        const mainNode = this.nodes.find((n) => n.id === selected.id);
        if (mainNode) mainNode.state = selected.state;
        this.ctx.audio?.playRotate?.();
        this.evaluateCircuit();
      }
    }
  }

  public getScore(): number {
    return this.score;
  }

  public getLevel(): number {
    return this.currentLevel;
  }

  public pause(): void {}
  public resume(): void {}
  public destroy(): void {}
}
