import { test, expect } from "@playwright/test";

test.describe("Permission Checks (Unauthenticated)", () => {
  test("admin routes redirect to login", async ({ page }) => {
    const adminRoutes = [
      "/admin",
      "/admin/dashboard",
      "/admin/clients",
      "/admin/projects",
      "/admin/users",
    ];

    for (const route of adminRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("client portal routes require authentication", async ({ page }) => {
    await page.goto("/projects");

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test("API routes return 401 for unauthenticated requests", async ({ request }) => {
    const apiRoutes = [
      "/api/dashboard/stats",
    ];

    for (const route of apiRoutes) {
      const response = await request.get(route);
      expect(response.status()).toBe(401);
    }
  });
});

test.describe("Navigation Elements", () => {
  test("login page has proper form elements", async ({ page }) => {
    await page.goto("/login");

    // Should have form elements
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator("input[type='email'], input[name='email']")).toBeVisible();
  });

  test("no admin navigation visible on public pages", async ({ page }) => {
    await page.goto("/");

    // Admin navigation should not be visible
    await expect(page.getByText("Dashboard")).not.toBeVisible();
    await expect(page.getByText("Gestion des clients")).not.toBeVisible();
  });
});
