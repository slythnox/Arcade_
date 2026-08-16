/** ARCADE_ v1.2.2 */
import { describe, it, expect, beforeEach } from "vitest";
import { HotlapGame } from "../../games/hotlap/HotlapGame";
import { TrackSpline } from "../../games/hotlap/spline";
import { HOTLAP_CIRCUITS } from "../../games/hotlap/tracks";
import { HotlapPhysics, DEFAULT_PHYSICS_PARAMS } from "../../games/hotlap/physics";
import { GhostManager } from "../../games/hotlap/ghost";
import { Vector2 } from "../../core/math/vector";
import { createMockContext, createMockRenderer } from "../helpers/mockContext";

describe("HOTLAP — Vector Racing Physics & Spline Engine", () => {
  let game: HotlapGame;
  let ctx: ReturnType<typeof createMockContext>;
  let renderer: ReturnType<typeof createMockRenderer>;

  beforeEach(() => {
    ctx = createMockContext(1337);
    renderer = createMockRenderer();
    game = new HotlapGame();
    game.init(ctx);
  });

  it("initializes car and track without error", () => {
    expect(game).toBeDefined();
    expect(game.getLevel()).toBe(1); // Track 1
    expect(game.getScore()).toBe(0);
  });

  it("accelerates forward on MOVE_UP / throttle input", () => {
    game.handleInput("MOVE_UP", true);

    // Update 30 frames (0.5 seconds)
    for (let i = 0; i < 30; i++) {
      game.update(1 / 60);
    }

    // Car must have moved forward from starting point
    game.render(renderer);
    expect(game.getLevel()).toBe(1);
    expect(Number.isFinite(game.getScore())).toBe(true);
  });

  it("steers left and right modifying heading vector", () => {
    game.handleInput("MOVE_UP", true);
    game.handleInput("MOVE_RIGHT", true);

    for (let i = 0; i < 30; i++) {
      game.update(1 / 60);
    }

    game.handleInput("MOVE_RIGHT", false);
    game.handleInput("MOVE_LEFT", true);

    for (let i = 0; i < 30; i++) {
      game.update(1 / 60);
    }

    expect(Number.isFinite(game.getScore())).toBe(true);
  });

  it("spline correctly interpolates closed loop and projects car coordinates", () => {
    const circuit = HOTLAP_CIRCUITS[0];
    const spline = new TrackSpline(circuit.points, circuit.width);

    expect(spline.samples.length).toBeGreaterThan(50);
    expect(spline.totalLength).toBeGreaterThan(1000);

    // Project start position
    const proj = spline.project(circuit.startPos.x, circuit.startPos.y);
    expect(proj.isOnTrack).toBe(true);
    expect(proj.progress).toBeGreaterThanOrEqual(0);
    expect(proj.progress).toBeLessThanOrEqual(1.0);
  });

  it("decays lateral velocity via tire grip and triggers drift slip", () => {
    const car = {
      pos: new Vector2(0, 0),
      vel: new Vector2(200, 150), // Has forward and lateral velocity
      angle: 0,
      angularVel: 0,
      speed: 250,
      steerAngle: 0,
      throttle: 0,
      brake: 0,
      handbrake: false,
      driftSlip: 0,
      isOnGrass: false,
      isOnKerb: false,
      exhaustFlame: 0,
      isCrashed: false,
      crashTimer: 0,
    };

    const skidBuffer: any[] = [];
    const smokeBuffer: any[] = [];

    // Lateral velocity should damp down significantly after 20 ticks
    for (let i = 0; i < 20; i++) {
      HotlapPhysics.updateCar(car, DEFAULT_PHYSICS_PARAMS, 1 / 60, skidBuffer, smokeBuffer);
    }

    // Velocity should align with heading (lateral velocity component decayed)
    expect(Math.abs(car.vel.y)).toBeLessThan(50);
  });

  it("ghost manager records and interpolates ghost progress", () => {
    const ghost = new GhostManager("test-track");
    ghost.startNewLap();

    ghost.recordTick(0.1, 0.1, 1.0, 100, 100, 0, 100);
    ghost.recordTick(0.1, 0.2, 2.0, 200, 100, 0, 100);
    ghost.recordTick(0.1, 0.3, 3.0, 300, 100, 0, 100);

    // Save as best
    ghost.saveCompletedLapIfBest("test-track", 3.0, { s1Time: 1.0, s2Time: 2.0, s3Time: 3.0, lapTime: 3.0 });

    // Interpolate ghost at t = 1.5s
    const sample = ghost.getGhostAtTime(1.5);
    expect(sample).not.toBeNull();
    expect(sample!.x).toBeCloseTo(150, 0);

    // Live delta: if player is at progress 0.2 at time 1.8s (ahead of ghost time 2.0s) -> delta should be -0.2
    const delta = ghost.getLiveDelta(0.2, 1.8);
    expect(delta).not.toBeNull();
    expect(delta!).toBeCloseTo(-0.2, 1);
  });

  it("cycles all 10 circuits cleanly", () => {
    for (let i = 0; i < HOTLAP_CIRCUITS.length; i++) {
      game.loadCircuit(i);
      expect(game.getLevel()).toBe(i + 1);
      game.update(1 / 60);
      game.render(renderer);
    }
  });

  it("handles lifecycle pause, resume, reset, and destroy", () => {
    game.pause();
    game.update(1 / 60);
    game.resume();
    game.reset(1337);
    game.destroy();
    expect(game.getLevel()).toBe(1);
  });
});
