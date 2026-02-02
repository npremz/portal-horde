import { test, expect } from "@playwright/test";

test.describe("Contact Form", () => {
  test("contact page loads", async ({ page }) => {
    await page.goto("/contact");

    await expect(page.locator("body")).toBeVisible();
  });

  test("contact form has required fields", async ({ page }) => {
    await page.goto("/contact");

    // Check for name field
    const nameInput = page.locator("input[name='name'], input[placeholder*='nom' i]");
    await expect(nameInput).toBeVisible();

    // Check for email field
    const emailInput = page.locator("input[name='email'], input[type='email']");
    await expect(emailInput).toBeVisible();

    // Check for message field
    const messageInput = page.locator("textarea[name='message'], textarea");
    await expect(messageInput).toBeVisible();
  });

  test("contact form has submit button", async ({ page }) => {
    await page.goto("/contact");

    const submitButton = page.locator("button[type='submit'], button:has-text('envoyer'), button:has-text('submit')");
    await expect(submitButton).toBeVisible();
  });
});

test.describe("Contact API", () => {
  test("POST /api/contact returns 400 for missing fields", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: {
        name: "Test User",
        // Missing email, category, subject, message
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Missing required fields");
  });

  test("POST /api/contact validates required fields", async ({ request }) => {
    // Test with partial data
    const testCases = [
      { name: "Test", email: "test@test.com" }, // Missing category, subject, message
      { name: "Test", email: "test@test.com", category: "general" }, // Missing subject, message
      { name: "Test", email: "test@test.com", category: "general", subject: "Test" }, // Missing message
    ];

    for (const data of testCases) {
      const response = await request.post("/api/contact", { data });
      expect(response.status()).toBe(400);
    }
  });
});
