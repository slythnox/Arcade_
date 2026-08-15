import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GameLoop } from "../../engine/GameLoop";
import { FIXED_DT, MAX_FRAME_DELTA } from "../../core/constants/timing";

describe("GameLoop", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", vi.fn((cb) => 123));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("start() begins running and stop() halts", () => {
    const loop = new GameLoop(() => {}, () => {});
    expect(loop.getIsRunning()).toBe(false);
    
    let time = 0;
    vi.stubGlobal("performance", { now: () => time });

    loop.start();
    expect(loop.getIsRunning()).toBe(true);

    loop.stop();
    expect(loop.getIsRunning()).toBe(false);
  });

  it("pause() prevents update calls while allowing render", async () => {
    let updates = 0;
    let renders = 0;
    const loop = new GameLoop(
      () => updates++,
      () => renders++
    );

    let time = 0;
    vi.stubGlobal("performance", { now: () => time });

    loop.start();
    const initialRenders = renders;
    loop.pause();
    expect(loop.getIsPaused()).toBe(true);

    // simulate RAF firing
    const rafCb = vi.mocked(requestAnimationFrame).mock.calls[0][0];
    time += 1000;
    rafCb(time);

    expect(updates).toBe(0);
    expect(renders).toBe(initialRenders + 1);

    loop.resume();
    expect(loop.getIsPaused()).toBe(false);
  });

  it("fixed timestep and delta clamping", () => {
    let updates = 0;
    let dtPassed = 0;
    const loop = new GameLoop(
      (dt) => {
        updates++;
        dtPassed = dt;
      },
      () => {}
    );

    let time = 0;
    vi.stubGlobal("performance", { now: () => time });

    loop.start();
    
    // Simulate 1 second gap (spiral of death test)
    time += 1000;
    const rafCb = vi.mocked(requestAnimationFrame).mock.calls[0][0];
    rafCb(time);

    const expectedUpdates = Math.floor(MAX_FRAME_DELTA / FIXED_DT);
    expect(updates).toBe(expectedUpdates);
    expect(dtPassed).toBe(FIXED_DT);
  });
});
