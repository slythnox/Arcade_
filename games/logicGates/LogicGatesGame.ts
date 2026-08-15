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

    // Draw Wire Connections
    for (const node of this.nodes) {
      for (const inId of node.inputs) {
        const inNode = this.nodes.find((n) => n.id === inId);
        if (inNode) {
          const wireColor = inNode.state ? "#4de8e8" : "#1e3050";
          pr.drawLine(inNode.x + 24, inNode.y, node.x - 24, node.y, wireColor, inNode.state ? 3 : 2);
        }
      }
    }

    // Draw Logic Gate Nodes
    for (const node of this.nodes) {
      const isSelectedInput =
        node.type === "INPUT" && this.inputNodes[this.selectedInputIndex]?.id === node.id;

      let bgColor = node.state ? "#103248" : "#0d1828";
      let borderColor = node.state ? "#4de8e8" : "#243b60";

      if (node.type === "INPUT") {
        bgColor = node.state ? "#1e4d2b" : "#1e293b";
        borderColor = isSelectedInput ? "#ffd84d" : node.state ? "#63e66d" : "#475569";
      } else if (node.type === "OUTPUT") {
        const isMatched = node.targetState === undefined || node.state === node.targetState;
        bgColor = isMatched ? "#1e4d2b" : "#4c1d24";
        borderColor = isMatched ? "#63e66d" : "#ff5c8a";
      }

      pr.drawRect(node.x - 24, node.y - 18, 48, 36, bgColor, true);
      pr.drawRect(node.x - 24, node.y - 18, 48, 36, borderColor, false);

      if (isSelectedInput) {
        pr.drawRect(node.x - 28, node.y - 22, 56, 44, "#ffd84d", false);
      }

      // Gate text label
      let label: string = node.type;
      if (node.type === "INPUT") label = node.state ? "IN: 1" : "IN: 0";
      if (node.type === "OUTPUT") label = `OUT: ${node.state ? "1" : "0"}`;

      pr.drawText(label, node.x, node.y - 2, {
        size: 9,
        align: "center",
        color: node.state ? "#ffffff" : "#94a3b8",
      });

      if (node.type === "OUTPUT" && node.targetState !== undefined) {
        pr.drawText(`REQ: ${node.targetState ? "1" : "0"}`, node.x, node.y + 10, {
          size: 8,
          align: "center",
          color: node.state === node.targetState ? "#63e66d" : "#ff5c8a",
        });
      }
    }

    if (this.levelCleared) {
      pr.drawRect(150, 240, 300, 70, "#081224", true);
      pr.drawRect(150, 240, 300, 70, "#63e66d", false);
      pr.drawText("CIRCUIT SOLVED!", 300, 268, { size: 16, align: "center", color: "#63e66d" });
      pr.drawText("ADVANCING TO NEXT LEVEL...", 300, 292, { size: 10, align: "center", color: "#e2e8f0" });
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
