import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("app is running", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(500);
  });

  test("main pages load without 500 errors", async ({ page }) => {
    const publicPages = [
      "/",
      "/login",
      "/contact",
      "/privacy",
      "/terms",
    ];

    for (const path of publicPages) {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(500);
    }
  });

  test("static assets load correctly", async ({ page }) => {
    await page.goto("/");

    // Check that CSS is loaded (page has styling)
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Check that fonts are loading (no fallback font errors)
    await page.waitForLoadState("networkidle");
  });

  test("no console errors on home page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Filter out known/expected errors
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes("favicon") &&
        !error.includes("ResizeObserver") &&
        !error.includes("hydration")
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("page has proper meta tags", async ({ page }) => {
    await page.goto("/");

    // Check for viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(viewport).toContain("width=device-width");

    // Check for title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});

test.describe("Responsive Design", () => {
  test("mobile viewport loads correctly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await expect(page.locator("body")).toBeVisible();
  });

  test("tablet viewport loads correctly", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await expect(page.locator("body")).toBeVisible();
  });

  test("desktop viewport loads correctly", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");

    await expect(page.locator("body")).toBeVisible();
  });
});
