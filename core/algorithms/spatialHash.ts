/** Point or entity with a position. */
export interface Positioned {
  x: number;
  y: number;
}

/**
 * Spatial hash grid.
 * Divides world space into fixed cells and tracks which entities occupy each cell.
 * Provides average-case constant-time neighbor queries — O(k) where k is entities per cell.
 *
 * Used by: bullet-hell games, swarm AI, particle systems with density checks.
 */
export class SpatialHash<T extends Positioned> {
  private readonly cellSize: number;
  private readonly cells: Map<number, Set<T>>;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  private cellKey(cx: number, cy: number): number {
    // Cantor pairing function for unique integer key from two integers
    return ((cx + cy) * (cx + cy + 1)) / 2 + cy;
  }

  private toCellCoords(x: number, y: number): [number, number] {
    return [Math.floor(x / this.cellSize), Math.floor(y / this.cellSize)];
  }

  /** Insert an entity into the spatial hash. */
  public insert(entity: T): void {
    const [cx, cy] = this.toCellCoords(entity.x, entity.y);
    const key = this.cellKey(cx, cy);
    let cell = this.cells.get(key);
    if (!cell) {
      cell = new Set();
      this.cells.set(key, cell);
    }
    cell.add(entity);
  }

  /** Remove an entity from the spatial hash. */
  public remove(entity: T): void {
    const [cx, cy] = this.toCellCoords(entity.x, entity.y);
    const key = this.cellKey(cx, cy);
    this.cells.get(key)?.delete(entity);
  }

  /** Query all entities within radius of a point. */
  public query(x: number, y: number, radius: number): T[] {
    const results: T[] = [];
    const radiusSq = radius * radius;

    const minCX = Math.floor((x - radius) / this.cellSize);
    const maxCX = Math.floor((x + radius) / this.cellSize);
    const minCY = Math.floor((y - radius) / this.cellSize);
    const maxCY = Math.floor((y + radius) / this.cellSize);

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const cell = this.cells.get(this.cellKey(cx, cy));
        if (!cell) continue;
        for (const entity of cell) {
          const dx = entity.x - x;
          const dy = entity.y - y;
          if (dx * dx + dy * dy <= radiusSq) {
            results.push(entity);
          }
        }
      }
    }

    return results;
  }

  /** Clear all entities from the hash. */
  public clear(): void {
    this.cells.clear();
  }

  public get cellCount(): number {
    return this.cells.size;
  }
}
