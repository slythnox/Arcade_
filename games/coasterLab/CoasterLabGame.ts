import type { GameInstance } from '../types';
import type { GameContext } from '../../engine/GameContext';
import type { Renderer } from '../../engine/rendering/Renderer';
import type { GameAction } from '../../core/types/game';

export class CoasterLabGame implements GameInstance {
  private ctx!: GameContext; private score = 0; private level = 1;
  private cx = 400; private cy = 300; private sim = false;
  private pts: {x:number, y:number}[] = []; private cart = {t:0, v:0};
  
  public init(ctx: GameContext) { this.ctx = ctx; }
  public reset(seed?: number) { this.pts = []; this.sim = false; this.cart = {t:0, v:0}; }
  public update(dt: number) {
    if (this.sim && this.pts.length > 1) {
      this.cart.t += 0.1 * dt;
      if (this.cart.t >= this.pts.length - 1) this.cart.t = 0;
    }
  }
  public handleInput(action: GameAction, isPressed: boolean) {
    if (!isPressed) return;
    const s = 20;
    if (action === 'MOVE_LEFT') this.cx -= s;
    if (action === 'MOVE_RIGHT') this.cx += s;
    if (action === 'MOVE_UP') this.cy -= s;
    if (action === 'MOVE_DOWN') this.cy += s;
    if (action === 'ACTION_PRIMARY') this.pts.push({x:this.cx, y:this.cy});
    if (action === 'ACTION_SECONDARY') this.sim = !this.sim;
    if (action === 'RESTART') this.reset();
  }
  public render(r: Renderer) {
    r.clear('#87CEEB'); r.drawRect(0, 400, 800, 200, '#4CAF50', true);
    for (let i=0; i<this.pts.length-1; i++) r.drawLine(this.pts[i].x, this.pts[i].y, this.pts[i+1].x, this.pts[i+1].y, '#333', 4);
    if (!this.sim) {
      for (const p of this.pts) r.drawCircle(p.x, p.y, 5, '#FFEB3B', true);
      r.drawCircle(this.cx, this.cy, 5, '#F44336', false);
    } else if (this.pts.length > 1) {
      const idx = Math.floor(this.cart.t); const f = this.cart.t - idx;
      const p1 = this.pts[idx]; const p2 = this.pts[Math.min(idx+1, this.pts.length-1)];
      const x = p1.x + (p2.x - p1.x)*f; const y = p1.y + (p2.y - p1.y)*f;
      r.drawRect(x-10, y-10, 20, 10, '#E91E63', true);
    }
  }
  public pause() {} public resume() {} public destroy() {}
  public getScore() { return this.score; } public getLevel() { return this.level; }
}
