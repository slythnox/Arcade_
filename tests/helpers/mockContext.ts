import { GameContext } from "../../engine/GameContext";
import { RandomSource } from "../../core/math/random";
import { vi } from "vitest";

export function createMockContext(seed = 1337): GameContext {
  const audioMocks: Record<string, ReturnType<typeof vi.fn>> = {};
  const audioHandler = new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        if (!audioMocks[prop]) {
          audioMocks[prop] = vi.fn();
        }
        return audioMocks[prop];
      },
    }
  );

  return {
    session: {
      setStatus: vi.fn(),
      recordInput: vi.fn(),
      setScore: vi.fn(),
      setLevel: vi.fn(),
      setLines: vi.fn(),
      setLives: vi.fn(),
    } as any,
    input: {
      isPressed: vi.fn(() => false),
      addListener: vi.fn(() => () => {}),
    } as any,
    renderer: {
      getWidth: () => 800,
      getHeight: () => 600,
      clear: vi.fn(),
      drawRect: vi.fn(),
      drawText: vi.fn(),
      drawGrid: vi.fn(),
      drawPixelBlock: vi.fn(),
      getContext: () => ({ canvas: { addEventListener: vi.fn(), removeEventListener: vi.fn() } }),
    } as any,
    audio: audioHandler as any,
    random: new RandomSource(seed),
  };
}
