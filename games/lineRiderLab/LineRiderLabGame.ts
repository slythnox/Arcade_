import type { GameInstance } from '../types';
import type { GameContext } from '../../engine/GameContext';
import type { Renderer } from '../../engine/rendering/Renderer';
import type { GameAction } from '../../core/types/game';

export class LineRiderLabGame implements GameInstance {
  private ctx!: GameContext; private score = 0; private level = 1;
  private cx = 400; private cy = 300; private drawing = false; private sim = false;
  private lines: {x1:number,y1:number,x2:number,y2:number}[] = [];
  private rx = 400; private ry = 100; private rvx = 0; private rvy = 0;
  
  public init(ctx: GameContext) { this.ctx = ctx; }
  public reset(seed?: number) { this.lines = []; this.sim = false; this.rx = 400; this.ry = 100; this.rvx = 0; this.rvy = 0; }
  public update(dt: number) {
    if (this.sim) {
      this.rvy += 600 * dt; this.rx += this.rvx * dt; this.ry += this.rvy * dt;
      if (this.ry > 800) this.ry = 800; // Floor safety
    }
  }
  public handleInput(action: GameAction, isPressed: boolean) {
    const s = 10;
    if (action === 'MOVE_LEFT' && isPressed) this.cx -= s;
    if (action === 'MOVE_RIGHT' && isPressed) this.cx += s;
    if (action === 'MOVE_UP' && isPressed) this.cy -= s;
    if (action === 'MOVE_DOWN' && isPressed) this.cy += s;
    if (action === 'ACTION_PRIMARY') {
      if (isPressed && !this.drawing) { this.drawing = true; }
      else if (!isPressed && this.drawing) { this.drawing = false; }
    }
    if (action === 'ACTION_SECONDARY' && isPressed) this.sim = !this.sim;
    if (action === 'RESTART' && isPressed) this.reset();
  }
  public render(r: Renderer) {
    r.clear('#FFFFFF'); r.drawGrid(80, 60, 10, '#EEEEEE');
    for (const l of this.lines) r.drawLine(l.x1, l.y1, l.x2, l.y2, '#000', 3);
    if (!this.sim) {
      r.drawLine(this.cx-5, this.cy, this.cx+5, this.cy, '#F00');
      r.drawLine(this.cx, this.cy-5, this.cx, this.cy+5, '#F00');
    } else {
      r.drawCircle(this.rx, this.ry, 5, '#F00', true);
    }
  }
  public pause() {} public resume() {} public destroy() {}
  public getScore() { return this.score; } public getLevel() { return this.level; }
}
