/** ARCADE_ v1.2.2 */
import type { GameContext } from "../../engine/GameContext";
import { RandomSource } from "../../core/math/random";
import type { Renderer } from "../../engine/rendering/Renderer";
import { vi } from "vitest";

if (typeof globalThis.ImageData === "undefined") {
  (globalThis as any).ImageData = class ImageData {
    width: number;
    height: number;
    data: Uint8ClampedArray;
    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
      this.data = new Uint8ClampedArray(width * height * 4);
    }
  };
}

if (typeof globalThis.Path2D === "undefined") {
  (globalThis as any).Path2D = class Path2D {
    moveTo = vi.fn();
    lineTo = vi.fn();
    arc = vi.fn();
    closePath = vi.fn();
    bezierCurveTo = vi.fn();
    quadraticCurveTo = vi.fn();
    addPath = vi.fn();
  };
}

export function createMockRenderer(): Renderer {
  return {
    getWidth: () => 800,
    getHeight: () => 600,
    clear: vi.fn(),
    drawRect: vi.fn(),
    drawCircle: vi.fn(),
    drawLine: vi.fn(),
    drawText: vi.fn(),
    drawGrid: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    drawPixelBlock: vi.fn(),
    drawPixelRect: vi.fn(),
    getContext: () => {
      const gradientMock = {
        addColorStop: vi.fn(),
      };
      const ctxMock = new Proxy(
        {
          canvas: { addEventListener: vi.fn(), removeEventListener: vi.fn() },
          createLinearGradient: vi.fn(() => gradientMock),
          createRadialGradient: vi.fn(() => gradientMock),
        } as any,
        {
          get: (target, prop: string) => {
            if (prop in target) return target[prop];
            target[prop] = vi.fn(() => target);
            return target[prop];
          },
          set: (target, prop: string, val: any) => {
            target[prop] = val;
            return true;
          },
        }
      );
      return ctxMock;
    },
  } as any;
}

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
    renderer: createMockRenderer() as any,
    audio: audioHandler as any,
    random: new RandomSource(seed),
  };
}
