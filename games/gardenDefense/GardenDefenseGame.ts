import { GameInstance } from '../types';
import { GameContext } from '../../engine/GameContext';
import { Renderer } from '../../engine/rendering/Renderer';
import { GameAction } from '../../core/types/game';

export class GardenDefenseGame implements GameInstance {
  private ctx!: GameContext; private score = 0; private level = 1;
  private cx = 0; private cy = 0; private sun = 50;
  private plants: {x:number, y:number, type:number}[] = [];
  private enemies: {x:number, y:number, hp:number}[] = [];
  private ptype = 0;
  
  public init(ctx: GameContext) { this.ctx = ctx; }
  public reset(seed?: number) { this.plants = []; this.enemies = []; this.sun = 50; this.cx=0; this.cy=0; }
  public update(dt: number) {
    if (Math.random() < 0.01) this.enemies.push({x: 9, y: Math.floor(Math.random()*5), hp: 100});
    for (const e of this.enemies) e.x -= 0.5 * dt;
  }
  public handleInput(action: GameAction, isPressed: boolean) {
    if (!isPressed) return;
    if (action === 'MOVE_LEFT') this.cx = Math.max(0, this.cx - 1);
    if (action === 'MOVE_RIGHT') this.cx = Math.min(8, this.cx + 1);
    if (action === 'MOVE_UP') this.cy = Math.max(0, this.cy - 1);
    if (action === 'MOVE_DOWN') this.cy = Math.min(4, this.cy + 1);
    if (action === 'ACTION_PRIMARY' && this.sun >= 50) { this.plants.push({x:this.cx, y:this.cy, type:this.ptype}); this.sun-=50; }
    if (action === 'ACTION_SECONDARY') this.ptype = (this.ptype + 1) % 3;
  }
  public render(r: Renderer) {
    r.clear('#4CAF50');
    for (let i=0; i<5; i++) r.drawRect(0, i*100, 900, 98, i%2===0?'#388E3C':'#43A047', true);
    for (const p of this.plants) r.drawCircle(p.x*100 + 50, p.y*100 + 50, 30, p.type===0?'#FFEB3B':'#2196F3', true);
    for (const e of this.enemies) r.drawRect(e.x*100 + 20, e.y*100 + 20, 60, 60, '#9E9E9E', true);
    r.drawRect(this.cx*100, this.cy*100, 100, 100, 'rgba(255,255,255,0.5)', false);
    r.drawText('SUN: ' + this.sun, 10, 20);
  }
  public pause() {} public resume() {} public destroy() {}
  public getScore() { return this.score; } public getLevel() { return this.level; }
}
