import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("shows login page", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/connexion|login/i);
  });

  test("login form has email input", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/admin");

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated user cannot access dashboard", async ({ page }) => {
    await page.goto("/admin/dashboard");

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page is accessible", async ({ page }) => {
    await page.goto("/login");

    // Check page loads without errors
    await expect(page.locator("body")).toBeVisible();

    // No error messages should be visible on fresh load
    await expect(page.getByText(/erreur|error/i)).not.toBeVisible();
  });
});

test.describe("Public Pages", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");

    // Page should load
    await expect(page.locator("body")).toBeVisible();
  });

  test("legal pages are accessible", async ({ page }) => {
    // Privacy policy
    await page.goto("/privacy");
    await expect(page.locator("body")).toBeVisible();

    // Terms of service
    await page.goto("/terms");
    await expect(page.locator("body")).toBeVisible();
  });
});
