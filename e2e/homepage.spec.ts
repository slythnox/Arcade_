import { test, expect } from "@playwright/test";

test.describe("Homepage — arcade shell", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("loads with game grid visible", async ({ page }) => {
    // Hero headline
    await expect(page.locator("h1")).toBeVisible();

    // At least one game card renders
    const cards = page.locator("[data-testid='game-card']");
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(10);
  });

  test("search filters game cards live", async ({ page }) => {
    const input = page.locator("input[type='text']");
    await expect(input).toBeVisible();

    const initialCards = await page.locator("[data-testid='game-card']").count();
    expect(initialCards).toBeGreaterThan(0);

    await input.fill("tetris");
    await page.waitForTimeout(300); // debounce

    const filteredCards = await page.locator("[data-testid='game-card']").count();
    expect(filteredCards).toBeLessThan(initialCards);
    expect(filteredCards).toBeGreaterThanOrEqual(1);

    // Tetris card should appear in results
    await expect(page.locator("[data-testid='game-card']").first()).toContainText(/tetris/i);
  });

  test("clears search to restore full grid", async ({ page }) => {
    const input = page.locator("input[type='text']");
    await input.fill("tetris");
    await page.waitForTimeout(300);

    await input.fill("");
    await page.waitForTimeout(300);

    const cards = await page.locator("[data-testid='game-card']").count();
    expect(cards).toBeGreaterThan(50);
  });

  test("LABS tab shows lab experiments", async ({ page }) => {
    const labsTab = page.locator("button", { hasText: /labs/i });
    await expect(labsTab).toBeVisible();
    await labsTab.click();

    // Labs cards should appear
    const cards = page.locator("[data-testid='game-card']");
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(14);
  });

  test("GAMES tab restores arcade games", async ({ page }) => {
    // Switch to labs
    const labsTab = page.locator("button", { hasText: /labs/i });
    await labsTab.click();
    await page.waitForTimeout(200);

    // Switch back to games
    const gamesTab = page.locator("button", { hasText: /games/i });
    await gamesTab.click();
    await page.waitForTimeout(200);

    const count = await page.locator("[data-testid='game-card']").count();
    expect(count).toBeGreaterThan(50);
  });

  test("clicking a game card navigates to /games/[slug]", async ({ page }) => {
    const firstCard = page.locator("[data-testid='game-card']").first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/games\//);
  });

  test("LABS tab — clicking a card navigates to /labs/[slug]", async ({ page }) => {
    const labsTab = page.locator("button", { hasText: /labs/i });
    await labsTab.click();

    const firstCard = page.locator("[data-testid='game-card']").first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/labs\//);
  });
});
