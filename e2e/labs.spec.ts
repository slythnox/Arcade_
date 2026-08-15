import { test, expect } from "@playwright/test";

test.describe("Labs page — /labs", () => {
  test("loads with Labs branding", async ({ page }) => {
    await page.goto("/labs");

    // Should have some Labs heading
    const heading = page.locator("h1, h2").filter({ hasText: /lab/i }).first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test("shows at least 14 lab experiment cards", async ({ page }) => {
    await page.goto("/labs");

    const cards = page.locator("[data-testid='game-card']");
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(14);
  });

  test("Fractal Garden experiment page loads with canvas", async ({ page }) => {
    await page.goto("/labs/fractal-garden");
    await expect(page.locator("canvas")).toBeVisible({ timeout: 5000 });
  });

  test("Gravity Well experiment page loads with canvas", async ({ page }) => {
    await page.goto("/labs/gravity-well");
    await expect(page.locator("canvas")).toBeVisible({ timeout: 5000 });
  });

  test("Invalid lab slug shows 404", async ({ page }) => {
    const response = await page.goto("/labs/this-does-not-exist-xyzqwerty");
    const is404 =
      response?.status() === 404 ||
      (await page.locator("text=/404|not found/i").isVisible().catch(() => false));
    expect(is404).toBe(true);
  });

  test("Category filter pills are present", async ({ page }) => {
    await page.goto("/labs");

    // Look for filter pills (Fractals, Physics Sim, etc.)
    const filterPills = page.locator("button, [role='button']").filter({ hasText: /fractals|physics|algorithms|procedural/i });
    const count = await filterPills.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe("Error handling", () => {
  test("Non-existent top-level route shows 404", async ({ page }) => {
    const response = await page.goto("/totally-invalid-page-xyzqwerty");
    const is404 =
      response?.status() === 404 ||
      (await page.locator("text=/404|not found/i").isVisible().catch(() => false));
    expect(is404).toBe(true);
  });

  test("Homepage is reachable and not a 404", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).not.toBe(404);
    expect(response?.status()).toBe(200);
  });
});
