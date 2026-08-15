import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";

type MonsterType = "fire" | "water" | "earth" | "wind" | "normal";

interface Move {
  name: string;
  type: MonsterType;
  power: number;
  accuracy: number;
  category: "attack" | "status" | "heal";
  effect?: "burn" | "freeze" | "paralyze" | "stun" | "heal-self";
}

interface Creature {
  id: string;
  name: string;
  type: MonsterType;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  level: number;
  xp: number;
  xpToNext: number;
  moves: Move[];
  status?: "burn" | "freeze" | "paralyze" | "none";
}

const ALL_MOVES: Record<string, Move> = {
  tackle: { name: "Tackle", type: "normal", power: 40, accuracy: 1.0, category: "attack" },
  ember: { name: "Ember", type: "fire", power: 40, accuracy: 1.0, category: "attack", effect: "burn" },
  waterGun: { name: "Water Gun", type: "water", power: 40, accuracy: 1.0, category: "attack" },
  rockThrow: { name: "Rock Throw", type: "earth", power: 50, accuracy: 0.9, category: "attack" },
  gust: { name: "Gust", type: "wind", power: 40, accuracy: 1.0, category: "attack" },
  flamethrower: { name: "Flamethrower", type: "fire", power: 90, accuracy: 0.9, category: "attack", effect: "burn" },
  surf: { name: "Surf", type: "water", power: 90, accuracy: 1.0, category: "attack" },
  earthquake: { name: "Earthquake", type: "earth", power: 100, accuracy: 1.0, category: "attack" },
  hurricane: { name: "Hurricane", type: "wind", power: 110, accuracy: 0.7, category: "attack" },
  fireBlast: { name: "Fire Blast", type: "fire", power: 110, accuracy: 0.8, category: "attack" },
  hydroPump: { name: "Hydro Pump", type: "water", power: 110, accuracy: 0.8, category: "attack" },
  stoneEdge: { name: "Stone Edge", type: "earth", power: 100, accuracy: 0.8, category: "attack" },
  airSlash: { name: "Air Slash", type: "wind", power: 75, accuracy: 0.95, category: "attack" },
  heal: { name: "Heal", type: "normal", power: 0, accuracy: 1.0, category: "heal", effect: "heal-self" },
  stunSpore: { name: "Stun Spore", type: "earth", power: 0, accuracy: 0.75, category: "status", effect: "paralyze" },
  blizzard: { name: "Blizzard", type: "water", power: 110, accuracy: 0.7, category: "attack", effect: "freeze" },
  bite: { name: "Bite", type: "normal", power: 60, accuracy: 1.0, category: "attack" },
  scratch: { name: "Scratch", type: "normal", power: 40, accuracy: 1.0, category: "attack" },
  slash: { name: "Slash", type: "normal", power: 70, accuracy: 1.0, category: "attack" },
  hyperBeam: { name: "Hyper Beam", type: "normal", power: 120, accuracy: 0.8, category: "attack" }
};

const BASE_CREATURES: Omit<Creature, "hp" | "level" | "xp" | "xpToNext" | "status">[] = [
  { id: "c1", name: "Emberfang", type: "fire", maxHp: 45, attack: 55, defense: 40, speed: 60, moves: [ALL_MOVES.tackle, ALL_MOVES.ember, ALL_MOVES.bite, ALL_MOVES.scratch] },
  { id: "c2", name: "Aquathorn", type: "water", maxHp: 50, attack: 48, defense: 65, speed: 43, moves: [ALL_MOVES.tackle, ALL_MOVES.waterGun, ALL_MOVES.heal, ALL_MOVES.scratch] },
  { id: "c3", name: "Stoneclaw", type: "earth", maxHp: 60, attack: 50, defense: 70, speed: 30, moves: [ALL_MOVES.tackle, ALL_MOVES.rockThrow, ALL_MOVES.stunSpore, ALL_MOVES.scratch] },
  { id: "c4", name: "Galewolf", type: "wind", maxHp: 40, attack: 60, defense: 35, speed: 70, moves: [ALL_MOVES.tackle, ALL_MOVES.gust, ALL_MOVES.bite, ALL_MOVES.scratch] },
  { id: "c5", name: "Pyroslug", type: "fire", maxHp: 55, attack: 40, defense: 50, speed: 20, moves: [ALL_MOVES.tackle, ALL_MOVES.ember, ALL_MOVES.heal, ALL_MOVES.scratch] },
  { id: "c6", name: "Tidecrab", type: "water", maxHp: 45, attack: 55, defense: 60, speed: 35, moves: [ALL_MOVES.tackle, ALL_MOVES.waterGun, ALL_MOVES.bite, ALL_MOVES.slash] },
  { id: "c7", name: "Dustmole", type: "earth", maxHp: 50, attack: 60, defense: 50, speed: 45, moves: [ALL_MOVES.tackle, ALL_MOVES.rockThrow, ALL_MOVES.slash, ALL_MOVES.scratch] },
  { id: "c8", name: "Cyclofox", type: "wind", maxHp: 45, attack: 50, defense: 40, speed: 65, moves: [ALL_MOVES.tackle, ALL_MOVES.gust, ALL_MOVES.bite, ALL_MOVES.airSlash] },
  { id: "c9", name: "Blazekin", type: "fire", maxHp: 60, attack: 75, defense: 50, speed: 75, moves: [ALL_MOVES.flamethrower, ALL_MOVES.slash, ALL_MOVES.fireBlast, ALL_MOVES.hyperBeam] },
  { id: "c10", name: "Deepfin", type: "water", maxHp: 70, attack: 60, defense: 80, speed: 50, moves: [ALL_MOVES.surf, ALL_MOVES.bite, ALL_MOVES.hydroPump, ALL_MOVES.blizzard] },
  { id: "c11", name: "Bouldrake", type: "earth", maxHp: 80, attack: 70, defense: 90, speed: 40, moves: [ALL_MOVES.earthquake, ALL_MOVES.slash, ALL_MOVES.stoneEdge, ALL_MOVES.hyperBeam] },
  { id: "c12", name: "Tempestfly", type: "wind", maxHp: 55, attack: 80, defense: 50, speed: 90, moves: [ALL_MOVES.hurricane, ALL_MOVES.airSlash, ALL_MOVES.gust, ALL_MOVES.hyperBeam] },
  { id: "c13", name: "Ashpaw", type: "fire", maxHp: 40, attack: 50, defense: 35, speed: 60, moves: [ALL_MOVES.scratch, ALL_MOVES.ember, ALL_MOVES.bite, ALL_MOVES.slash] },
  { id: "c14", name: "Surgeeel", type: "water", maxHp: 50, attack: 60, defense: 45, speed: 70, moves: [ALL_MOVES.waterGun, ALL_MOVES.bite, ALL_MOVES.surf, ALL_MOVES.slash] },
  { id: "c15", name: "Terrapede", type: "earth", maxHp: 55, attack: 55, defense: 65, speed: 30, moves: [ALL_MOVES.rockThrow, ALL_MOVES.scratch, ALL_MOVES.earthquake, ALL_MOVES.bite] },
  { id: "c16", name: "Stormhawk", type: "wind", maxHp: 65, attack: 75, defense: 60, speed: 85, moves: [ALL_MOVES.gust, ALL_MOVES.airSlash, ALL_MOVES.hurricane, ALL_MOVES.slash] }
];

function createCreature(id: string, level: number): Creature {
  const base = BASE_CREATURES.find(c => c.id === id) || BASE_CREATURES[0];
  const hp = Math.floor(base.maxHp * (1 + (level - 1) * 0.1));
  return {
    ...base,
    level,
    hp,
    maxHp: hp,
    attack: Math.floor(base.attack * (1 + (level - 1) * 0.1)),
    defense: Math.floor(base.defense * (1 + (level - 1) * 0.1)),
    speed: Math.floor(base.speed * (1 + (level - 1) * 0.1)),
    xp: 0,
    xpToNext: level * 100,
    status: "none"
  };
}

const TYPE_COLORS: Record<MonsterType, string> = {
  fire: "#FF4500",
  water: "#1E90FF",
  earth: "#8B4513",
  wind: "#32CD32",
  normal: "#A9A9A9"
};

export class MonsterArenaGame implements GameInstance {
  private ctx!: GameContext;
  private playerCreature!: Creature;
  private enemyCreature!: Creature;
  
  private score: number = 0;
  private area: number = 1;
  private enemiesDefeated: number = 0;
  
  private selectedMoveIndex: number = 0;
  private combatLog: string[] = ["Wild enemy appeared!"];
  
  private isPlayerTurn: boolean = true;
  private isPaused: boolean = false;
  private gameOver: boolean = false;
  private battleOver: boolean = false;
  private stateDelay: number = 0;
  
  private enemyQueue: string[] = [];
  
  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }
  
  public reset(seed?: number): void {
    if (seed !== undefined) {
      this.ctx.random.reset(seed);
    }
    this.score = 0;
    this.area = 1;
    this.enemiesDefeated = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.playerCreature = createCreature("c1", 1);
    this.setupArea();
    this.nextBattle();
  }
  
  private setupArea(): void {
    if (this.area === 1) {
      this.enemyQueue = ["c5", "c6", "c7", "c8", "c2"];
    } else if (this.area === 2) {
      this.enemyQueue = ["c13", "c14", "c15", "c16", "c3", "c4"];
    } else {
      this.enemyQueue = ["c9", "c10", "c11", "c12"];
    }
  }
  
  private nextBattle(): void {
    if (this.enemyQueue.length === 0) {
      this.area++;
      if (this.area > 3) {
        this.winGame();
        return;
      }
      this.setupArea();
    }
    const nextEnemyId = this.enemyQueue.shift()!;
    this.enemyCreature = createCreature(nextEnemyId, this.playerCreature.level);
    this.playerCreature.hp = this.playerCreature.maxHp;
    this.playerCreature.status = "none";
    this.battleOver = false;
    this.isPlayerTurn = true;
    this.log(`Wild ${this.enemyCreature.name} appeared!`);
  }
  
  private winGame(): void {
    this.gameOver = true;
    this.ctx.session.setStatus("game-over");
    this.log("You became the Arena Champion!");
  }
  
  private log(msg: string): void {
    this.combatLog.push(msg);
    if (this.combatLog.length > 3) {
      this.combatLog.shift();
    }
  }
  
  private getMultiplier(attackType: MonsterType, defendType: MonsterType): number {
    if (attackType === "fire" && defendType === "earth") return 2.0;
    if (attackType === "water" && defendType === "fire") return 2.0;
    if (attackType === "earth" && defendType === "wind") return 2.0;
    if (attackType === "wind" && defendType === "water") return 2.0;
    
    if (attackType === "earth" && defendType === "fire") return 0.5;
    if (attackType === "fire" && defendType === "water") return 0.5;
    if (attackType === "wind" && defendType === "earth") return 0.5;
    if (attackType === "water" && defendType === "wind") return 0.5;
    
    return 1.0;
  }
  
  private applyMove(attacker: Creature, defender: Creature, move: Move): void {
    if (move.category === "heal") {
      const healAmt = Math.floor(attacker.maxHp * 0.3);
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + healAmt);
      this.log(`${attacker.name} used ${move.name} and healed!`);
      return;
    }
    
    const isHit = this.ctx.random.nextFloat() <= move.accuracy;
    if (!isHit) {
      this.log(`${attacker.name}'s attack missed!`);
      return;
    }
    
    if (move.category === "status") {
      if (move.effect && defender.status === "none") {
        defender.status = move.effect as any;
        this.log(`${defender.name} was inflicted with ${move.effect}!`);
      } else {
        this.log(`${move.name} had no effect.`);
      }
      return;
    }
    
    const mult = this.getMultiplier(move.type, defender.type);
    const randomFactor = 0.85 + this.ctx.random.nextFloat() * 0.15;
    const damage = Math.max(1, Math.floor(((attacker.attack * move.power / 100) / (defender.defense * 0.5)) * mult * randomFactor));
    
    defender.hp -= damage;
    this.log(`${attacker.name} used ${move.name}!`);
    if (mult > 1) this.log("It's super effective!");
    if (mult < 1) this.log("It's not very effective...");
    
    if (move.effect && defender.status === "none" && this.ctx.random.nextFloat() < 0.3) {
      defender.status = move.effect as any;
      this.log(`${defender.name} was inflicted with ${move.effect}!`);
    }
  }
  
  private processStatus(c: Creature): boolean {
    if (c.status === "burn") {
      const dmg = Math.max(1, Math.floor(c.maxHp * 0.06));
      c.hp -= dmg;
      this.log(`${c.name} takes burn damage!`);
      if (c.hp <= 0) return true;
    } else if (c.status === "paralyze") {
      if (this.ctx.random.nextFloat() < 0.25) {
        this.log(`${c.name} is fully paralyzed!`);
        return true; // Skip turn
      }
    } else if (c.status === "freeze") {
      if (this.ctx.random.nextFloat() < 0.2) {
        c.status = "none";
        this.log(`${c.name} thawed out!`);
      } else {
        this.log(`${c.name} is frozen solid!`);
        return true; // Skip turn
      }
    }
    return false;
  }
  
  public update(deltaTime: number): void {
    if (this.gameOver || this.isPaused) return;
    
    if (this.stateDelay > 0) {
      this.stateDelay -= deltaTime;
      if (this.stateDelay <= 0 && this.battleOver) {
        this.nextBattle();
      } else if (this.stateDelay <= 0 && !this.isPlayerTurn) {
        this.enemyTurn();
      }
      return;
    }
  }
  
  private enemyTurn(): void {
    if (this.battleOver || this.gameOver) return;
    
    const skip = this.processStatus(this.enemyCreature);
    
    if (!skip && this.enemyCreature.hp > 0) {
      // Basic AI: Random move, prefer high power/advantage
      const move = this.enemyCreature.moves[Math.floor(this.ctx.random.nextFloat() * this.enemyCreature.moves.length)];
      this.applyMove(this.enemyCreature, this.playerCreature, move);
    }
    
    this.checkWinLoss();
    if (!this.battleOver) {
      this.isPlayerTurn = true;
    }
  }
  
  private checkWinLoss(): void {
    if (this.playerCreature.hp <= 0) {
      this.gameOver = true;
      this.log("You blacked out!");
      this.ctx.session.setStatus("game-over");
    } else if (this.enemyCreature.hp <= 0) {
      this.battleOver = true;
      this.log(`Enemy ${this.enemyCreature.name} fainted!`);
      this.score += 100 * this.enemyCreature.level;
      this.gainXp(this.enemyCreature.level * 20);
      this.stateDelay = 1.5;
    }
  }
  
  private gainXp(amt: number): void {
    this.playerCreature.xp += amt;
    this.log(`${this.playerCreature.name} gained ${amt} XP!`);
    if (this.playerCreature.xp >= this.playerCreature.xpToNext) {
      this.playerCreature.level++;
      this.playerCreature.xp -= this.playerCreature.xpToNext;
      this.playerCreature.xpToNext = this.playerCreature.level * 100;
      
      this.playerCreature.maxHp = Math.floor(this.playerCreature.maxHp * 1.1);
      this.playerCreature.hp = this.playerCreature.maxHp;
      this.playerCreature.attack = Math.floor(this.playerCreature.attack * 1.1);
      this.playerCreature.defense = Math.floor(this.playerCreature.defense * 1.1);
      this.playerCreature.speed = Math.floor(this.playerCreature.speed * 1.1);
      this.log(`${this.playerCreature.name} grew to level ${this.playerCreature.level}!`);
    }
  }
  
  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.gameOver || this.isPaused || this.battleOver || this.stateDelay > 0) return;
    
    if (this.isPlayerTurn) {
      switch (action) {
        case "MOVE_UP":
          this.selectedMoveIndex = Math.max(0, this.selectedMoveIndex - 1);
          break;
        case "MOVE_DOWN":
          this.selectedMoveIndex = Math.min(this.playerCreature.moves.length - 1, this.selectedMoveIndex + 1);
          break;
        case "ACTION_PRIMARY":
          const skip = this.processStatus(this.playerCreature);
          if (!skip && this.playerCreature.hp > 0) {
            const move = this.playerCreature.moves[this.selectedMoveIndex];
            this.applyMove(this.playerCreature, this.enemyCreature, move);
          }
          this.isPlayerTurn = false;
          this.checkWinLoss();
          if (!this.battleOver) {
            this.stateDelay = 1.0;
          }
          break;
        case "ACTION_SECONDARY": // Flee
          this.score = Math.floor(this.score * 0.9);
          this.log("You fled! Score reduced.");
          this.battleOver = true;
          this.stateDelay = 1.0;
          break;
      }
    }
  }
  
  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.playerCreature.level; }
  
  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#1A1A1A");
    
    const w = pr.getWidth();
    const h = pr.getHeight();
    
    // Arena
    pr.drawRect(0, h * 0.4, w, h * 0.2, "#333333", true);
    
    // Player Creature
    const pColor = TYPE_COLORS[this.playerCreature.type];
    pr.drawPixelBlock(w * 0.2, h * 0.45, 60, pColor);
    
    // Enemy Creature
    const eColor = TYPE_COLORS[this.enemyCreature.type];
    pr.drawPixelBlock(w * 0.7, h * 0.35, 60, eColor);
    
    // HUDs
    this.drawHUD(pr, this.playerCreature, w * 0.05, h * 0.7, true);
    this.drawHUD(pr, this.enemyCreature, w * 0.55, h * 0.1, false);
    
    // Move Menu
    if (this.isPlayerTurn && !this.battleOver && !this.gameOver) {
      pr.drawRect(w * 0.5, h * 0.7, w * 0.45, h * 0.25, "#000000", true);
      pr.drawRect(w * 0.5, h * 0.7, w * 0.45, h * 0.25, "#FFFFFF", false);
      for (let i = 0; i < this.playerCreature.moves.length; i++) {
        const move = this.playerCreature.moves[i];
        const color = i === this.selectedMoveIndex ? "#FFFF00" : "#FFFFFF";
        pr.drawText(move.name, w * 0.55, h * 0.75 + i * 20, { color, size: 14 });
      }
    }
    
    // Combat Log
    pr.drawRect(w * 0.05, h * 0.05, w * 0.45, h * 0.15, "#000000", true);
    pr.drawRect(w * 0.05, h * 0.05, w * 0.45, h * 0.15, "#FFFFFF", false);
    for (let i = 0; i < this.combatLog.length; i++) {
      pr.drawText(this.combatLog[i], w * 0.06, h * 0.08 + i * 15, { color: "#FFFFFF", size: 12 });
    }
    
    if (this.gameOver) {
      pr.drawText("GAME OVER", w / 2, h / 2, { color: "#FF0000", size: 30, align: "center" });
    }
  }
  
  private drawHUD(pr: PixelRenderer, c: Creature, x: number, y: number, isPlayer: boolean): void {
    pr.drawRect(x, y, 160, 60, "#000000", true);
    pr.drawRect(x, y, 160, 60, "#FFFFFF", false);
    
    pr.drawText(`${c.name} Lv${c.level}`, x + 5, y + 15, { color: "#FFFFFF", size: 14 });
    
    // HP Bar
    const hpPct = Math.max(0, c.hp / c.maxHp);
    pr.drawRect(x + 5, y + 25, 150, 10, "#FF0000", true);
    pr.drawRect(x + 5, y + 25, 150 * hpPct, 10, "#00FF00", true);
    pr.drawText(`${Math.max(0, c.hp)}/${c.maxHp}`, x + 5, y + 45, { color: "#FFFFFF", size: 12 });
    
    if (isPlayer) {
      const xpPct = c.xp / c.xpToNext;
      pr.drawRect(x + 5, y + 50, 150, 4, "#555555", true);
      pr.drawRect(x + 5, y + 50, 150 * xpPct, 4, "#00FFFF", true);
    }
    
    if (c.status !== "none") {
      pr.drawText(c.status!.toUpperCase(), x + 100, y + 45, { color: "#FFFF00", size: 12 });
    }
  }
}
