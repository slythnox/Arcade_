import { GameInstance } from '../types';
import { GameContext } from '../../engine/GameContext';
import { Renderer } from '../../engine/rendering/Renderer';
import { GameAction } from '../../core/types/game';

export class MarbleRushGame implements GameInstance {
  private ctx!: GameContext;
  private score = 0; private level = 1; private lives = 3; private gameOver = false;
  private aimAngle = -Math.PI / 2; private aimDir = 0;
  private marbles: { color: string, t: number }[] = [];
  private projectiles: { x: number, y: number, vx: number, vy: number, color: string }[] = [];
  private path: { x: number, y: number }[] = [];
  private colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316'];
  private currentColors: string[] = []; private nextColor = '';

  public init(ctx: GameContext) { this.ctx = ctx; this.reset(); }
  public reset(seed?: number) { this.score=0; this.level=1; this.lives=3; this.gameOver=false; this.initLevel(); }
  
  private initLevel() {
    this.path = []; const w = 600, h = 600;
    for (let i = 0; i <= 40; i++) {
      const p = i / 40;
      this.path.push({ x: w*0.1 + w*0.8*p, y: h*0.2 + h*0.6*p + Math.sin(p*Math.PI*4)*100 });
    }
    const colorCount = Math.min(4 + Math.floor(this.level/4), 6);
    this.currentColors = this.colors.slice(0, colorCount);
    this.marbles = []; const chainLen = 15 + this.level*2;
    for (let i = 0; i < chainLen; i++) {
      this.marbles.push({ color: this.currentColors[Math.floor(Math.random() * colorCount)], t: (chainLen - 1 - i) * 0.015 });
    }
    this.nextColor = this.currentColors[0];
    this.projectiles = [];
  }
  
  private getPathPoint(t: number) {
    if (t <= 0) return this.path[0]; if (t >= 1) return this.path[this.path.length - 1];
    const p = t * (this.path.length - 1); const i = Math.floor(p); const f = p - i;
    const p1 = this.path[i]; const p2 = this.path[Math.min(i + 1, this.path.length - 1)];
    return { x: p1.x + (p2.x - p1.x) * f, y: p1.y + (p2.y - p1.y) * f };
  }
  
  public update(dt: number) {
    if (this.gameOver) return;
    if (this.aimDir !== 0) this.aimAngle += this.aimDir * 3 * dt;
    const speed = 0.02 + this.level * 0.002;
    for (const m of this.marbles) m.t += speed * dt;
    
    if (this.marbles.length > 0 && this.marbles[0].t >= 1) {
      this.lives--;
      if (this.lives <= 0) this.gameOver = true;
      else this.initLevel();
      return;
    }
    
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      let hit = false;
      for (let j = 0; j < this.marbles.length; j++) {
        const mp = this.getPathPoint(this.marbles[j].t);
        const dx = p.x - mp.x, dy = p.y - mp.y;
        if (dx*dx + dy*dy < 400) {
          this.marbles.splice(j, 0, { color: p.color, t: this.marbles[j].t - 0.001 });
          this.projectiles.splice(i, 1);
          this.checkMatches(j);
          hit = true; break;
        }
      }
      if (!hit && (p.x < 0 || p.x > 800 || p.y < 0 || p.y > 800)) this.projectiles.splice(i, 1);
    }
    if (this.marbles.length === 0) { this.level++; this.score += 1000; this.initLevel(); }
  }
  
  private checkMatches(idx: number) {
    let s = idx, e = idx; const c = this.marbles[idx].color;
    while (s > 0 && this.marbles[s-1].color === c) s--;
    while (e < this.marbles.length-1 && this.marbles[e+1].color === c) e++;
    const count = e - s + 1;
    if (count >= 3) { this.marbles.splice(s, count); this.score += count * 100; }
  }
  
  public handleInput(action: GameAction, isPressed: boolean) {
    if (action === 'MOVE_LEFT') this.aimDir = isPressed ? -1 : 0;
    if (action === 'MOVE_RIGHT') this.aimDir = isPressed ? 1 : 0;
    if (action === 'ACTION_PRIMARY' && isPressed && !this.gameOver) {
      this.projectiles.push({ x: 300, y: 300, vx: Math.cos(this.aimAngle)*500, vy: Math.sin(this.aimAngle)*500, color: this.nextColor });
      this.nextColor = this.currentColors[Math.floor(Math.random() * this.currentColors.length)];
    }
  }
  public render(r: Renderer) {
    r.clear('#111827');
    for (let i = 0; i < this.path.length - 1; i++) r.drawLine(this.path[i].x, this.path[i].y, this.path[i+1].x, this.path[i+1].y, '#374151', 4);
    for (const m of this.marbles) { const p = this.getPathPoint(m.t); r.drawCircle(p.x, p.y, 12, m.color, true); }
    r.drawCircle(300, 300, 20, '#4b5563', true); r.drawCircle(300, 300, 10, this.nextColor, true);
    r.drawLine(300, 300, 300 + Math.cos(this.aimAngle)*40, 300 + Math.sin(this.aimAngle)*40, '#ef4444', 2);
    for (const p of this.projectiles) r.drawCircle(p.x, p.y, 10, p.color, true);
    r.drawText('SCORE: ' + this.score, 10, 20); r.drawText('LEVEL: ' + this.level, 10, 40);
  }
  public pause() {} public resume() {} public destroy() {}
  public getScore() { return this.score; } public getLevel() { return this.level; }
}
