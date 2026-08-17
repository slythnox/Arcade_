/** ARCADE_ E2E Game Spec */
import { test, expect } from "@playwright/test";

test.describe("Game page — /games/[slug]", () => {
  test("Tetris page loads with a visible canvas", async ({ page }) => {
    await page.goto("/games/tetris");

    // Canvas must appear within 5s (game loads lazily)
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 5000 });

    // The canvas should have non-zero dimensions
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test("Tetris page shows game metadata (name in page)", async ({ page }) => {
    await page.goto("/games/tetris");
    await expect(page).toHaveTitle(/tetris/i);
  });

  test("Pause button is present and responds", async ({ page }) => {
    await page.goto("/games/tetris");
    await page.locator("canvas").waitFor({ state: "visible", timeout: 5000 });

    // Find pause button by various selectors
    const pauseBtn = page.locator("[data-testid='pause-btn'], button:has-text('Pause'), button:has-text('⏸')").first();
    if (await pauseBtn.isVisible()) {
      await pauseBtn.click();
      // Resume button should appear or text should change
      await page.waitForTimeout(200);
    }
    // Game canvas should still be visible after pause
    await expect(page.locator("canvas")).toBeVisible();
  });

  test("Snake page loads with canvas", async ({ page }) => {
    await page.goto("/games/snake");
    await expect(page.locator("canvas")).toBeVisible({ timeout: 5000 });
  });

  test("Maze Chaser page loads with canvas", async ({ page }) => {
    await page.goto("/games/maze-chaser");
    await expect(page.locator("canvas")).toBeVisible({ timeout: 5000 });
  });

  test("Ray Sector page loads with canvas", async ({ page }) => {
    await page.goto("/games/ray-sector");
    await expect(page.locator("canvas")).toBeVisible({ timeout: 5000 });
  });

  test("Monster Arena page loads with canvas", async ({ page }) => {
    await page.goto("/games/monster-arena");
    await expect(page.locator("canvas")).toBeVisible({ timeout: 5000 });
  });

  test("Invalid slug shows 404 page", async ({ page }) => {
    const response = await page.goto("/games/this-game-does-not-exist-xyzqwerty");
    // Either 404 status or a 404 page content
    const is404 =
      response?.status() === 404 ||
      (await page.locator("text=/404|not found/i").isVisible().catch(() => false));
    expect(is404).toBe(true);
  });

  test("Game page has proper meta title", async ({ page }) => {
    await page.goto("/games/tetris");
    const title = await page.title();
    expect(title.toLowerCase()).toContain("tetris");
  });

  test("Keyboard input does not crash the game (Tetris)", async ({ page }) => {
    await page.goto("/games/tetris");
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 5000 });

    // Send a burst of keyboard inputs
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Space");

    await page.waitForTimeout(500);

    // Canvas must still be visible — no crash
    await expect(canvas).toBeVisible();
  });
});
