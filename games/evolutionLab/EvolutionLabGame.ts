import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

class DNA {
  genes: Vector2[] = [];
  constructor(genes?: Vector2[]) {
    if (genes) {
      this.genes = genes;
    } else {
      for (let i = 0; i < 200; i++) {
        const angle = Math.random() * Math.PI * 2;
        this.genes.push(new Vector2(Math.cos(angle) * 0.5, Math.sin(angle) * 0.5));
      }
    }
  }

  crossover(partner: DNA): DNA {
    const newgenes: Vector2[] = [];
    const mid = Math.floor(Math.random() * this.genes.length);
    for (let i = 0; i < this.genes.length; i++) {
      if (i > mid) newgenes[i] = this.genes[i].clone();
      else newgenes[i] = partner.genes[i].clone();
    }
    return new DNA(newgenes);
  }

  mutate(): void {
    for (let i = 0; i < this.genes.length; i++) {
      if (Math.random() < 0.02) {
        const angle = Math.random() * Math.PI * 2;
        this.genes[i] = new Vector2(Math.cos(angle) * 0.5, Math.sin(angle) * 0.5);
      }
    }
  }
}

class Agent {
  pos: Vector2;
  vel: Vector2;
  acc: Vector2;
  dna: DNA;
  fitness: number = 0;
  dead: boolean = false;

  constructor(dna?: DNA) {
    this.pos = new Vector2(400, 500);
    this.vel = new Vector2(0, 0);
    this.acc = new Vector2(0, 0);
    this.dna = dna || new DNA();
  }

  applyForce(force: Vector2): void {
    this.acc.addMut(force);
  }

  update(step: number, target: Vector2): void {
    if (!this.dead && step < this.dna.genes.length) {
      this.applyForce(this.dna.genes[step]);
      this.vel.addMut(this.acc);
      this.pos.addMut(this.vel);
      this.acc.set(0, 0);

      const d = this.pos.distance(target);
      if (d < 12 || this.pos.x < 0 || this.pos.x > 800 || this.pos.y < 0 || this.pos.y > 600) {
        this.dead = true;
      }
    }
  }

  calcFitness(target: Vector2): void {
    const d = this.pos.distance(target);
    this.fitness = 1 / (d * d + 1);
  }
}

export class EvolutionLabGame implements GameInstance {
  private ctx!: GameContext;
  private population: Agent[] = [];
  private target: Vector2 = new Vector2(400, 80);
  private step: number = 0;
  private generation: number = 1;
  private isPaused = false;
  private score = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) {
      this.ctx.random.reset(seed);
    }
    this.generation = 1;
    this.step = 0;
    this.score = 0;
    this.population = [];
    for (let i = 0; i < 60; i++) {
      this.population.push(new Agent());
    }
  }

  public update(_deltaTime: number): void {
    if (this.isPaused) return;

    if (this.step < 200) {
      for (const agent of this.population) {
        agent.update(this.step, this.target);
      }
      this.step++;
    } else {
      this.evaluateAndBreed();
      this.step = 0;
      this.generation++;
      this.score = this.generation;
    }
  }

  private evaluateAndBreed(): void {
    for (const agent of this.population) {
      agent.calcFitness(this.target);
    }

    const newPop: Agent[] = [];
    for (let i = 0; i < this.population.length; i++) {
      const parentA = this.tournamentSelection();
      const parentB = this.tournamentSelection();
      const childDNA = parentA.dna.crossover(parentB.dna);
      childDNA.mutate();
      newPop.push(new Agent(childDNA));
    }
    this.population = newPop;
  }

  private tournamentSelection(): Agent {
    let best: Agent | null = null;
    for (let i = 0; i < 4; i++) {
      const r = Math.floor(Math.random() * this.population.length);
      const contestant = this.population[r];
      if (!best || contestant.fitness > best.fitness) {
        best = contestant;
      }
    }
    return best!;
  }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#04060c");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // Target
    pr.drawRect(this.target.x - 8, this.target.y - 8, 16, 16, "#ffd84d", true);

    // Agents
    for (const agent of this.population) {
      pr.drawRect(agent.pos.x - 2, agent.pos.y - 2, 4, 4, agent.dead ? "#ff5c8a" : "#4de8e8", true);
    }

    // HUD
    pr.drawRect(0, h - 50, w, 50, "#080e1c", true);
    pr.drawText(
      `EVOLUTION LAB | Gen: ${this.generation} | Step: ${this.step}/200 | Population: ${this.population.length}`,
      16,
      h - 30,
      { color: "#ffd84d", size: 11 }
    );
    pr.drawText("[R] Restart Evolution", 16, h - 12, { color: "#4de8e8", size: 9 });
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed) return;
    if (action === "RESTART") this.reset();
  }

  public pause(): void {
    this.isPaused = true;
  }
  public resume(): void {
    this.isPaused = false;
  }
  public destroy(): void {}
  public getScore(): number {
    return this.score;
  }
  public getLevel(): number {
    return this.generation;
  }
}
