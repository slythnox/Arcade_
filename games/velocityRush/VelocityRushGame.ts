import { GameInstance } from '../types';
import { GameContext } from '../../engine/GameContext';
import { Renderer } from '../../engine/rendering/Renderer';
import { GameAction } from '../../core/types/game';

export class VelocityRushGame implements GameInstance {
  private ctx!: GameContext; private score = 0; private level = 1;
  private px = 50; private py = 200; private vx = 0; private vy = 0;
  private inputX = 0; private onGround = false; private rings: {x:number, y:number}[] = [];
  
  public init(ctx: GameContext) { this.ctx = ctx; this.reset(); }
  public reset(seed?: number) { this.px = 50; this.py = 200; this.vx = 0; this.vy = 0; this.score = 0; this.rings = [{x:300, y:200}, {x:400, y:200}]; }
  public update(dt: number) {
    this.vx += this.inputX * 800 * dt;
    if (this.inputX === 0) this.vx *= 0.95;
    this.vy += 900 * dt;
    this.px += this.vx * dt; this.py += this.vy * dt;
    if (this.py > 300) { this.py = 300; this.vy = 0; this.onGround = true; } else { this.onGround = false; }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      if (Math.hypot(this.px - r.x, this.py - r.y) < 20) { this.rings.splice(i, 1); this.score += 10; }
    }
  }
  public handleInput(action: GameAction, isPressed: boolean) {
    if (action === 'MOVE_LEFT') this.inputX = isPressed ? -1 : 0;
    if (action === 'MOVE_RIGHT') this.inputX = isPressed ? 1 : 0;
    if (action === 'ACTION_PRIMARY' && isPressed && this.onGround) { this.vy = -620; this.onGround = false; }
  }
  public render(r: Renderer) {
    r.clear('#87CEEB');
    r.drawRect(0, 310, 800, 300, '#228B22', true);
    for (const rg of this.rings) r.drawCircle(rg.x - this.px + 400, rg.y, 10, '#FFD700', false);
    r.drawCircle(400, this.py, 15, '#0000FF', true);
    r.drawText('SCORE: ' + this.score, 10, 20);
  }
  public pause() {} public resume() {} public destroy() {}
  public getScore() { return this.score; } public getLevel() { return this.level; }
}
