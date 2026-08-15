/**
 * Fixed-capacity object pool.
 * Recycles dead objects instead of allocating new ones.
 * Reduces GC pressure in entity-heavy game loops.
 */
export class ObjectPool<T> {
  private readonly pool: T[];
  private readonly active: Set<T>;
  private readonly create: () => T;
  private readonly reset: (obj: T) => void;

  constructor(size: number, create: () => T, reset: (obj: T) => void) {
    this.create = create;
    this.reset = reset;
    this.active = new Set();
    this.pool = Array.from({ length: size }, () => create());
  }

  /** Retrieves an object from the pool, creating one if pool is empty. */
  public acquire(): T {
    const obj = this.pool.pop() ?? this.create();
    this.active.add(obj);
    return obj;
  }

  /** Returns an object to the pool for reuse. */
  public release(obj: T): void {
    if (!this.active.has(obj)) return;
    this.active.delete(obj);
    this.reset(obj);
    this.pool.push(obj);
  }

  /** Releases all active objects back to the pool. */
  public releaseAll(): void {
    for (const obj of this.active) {
      this.reset(obj);
      this.pool.push(obj);
    }
    this.active.clear();
  }

  public get activeCount(): number {
    return this.active.size;
  }

  public get poolSize(): number {
    return this.pool.length;
  }

  public getActive(): ReadonlySet<T> {
    return this.active;
  }
}
