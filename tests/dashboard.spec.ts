import { test, expect } from "@playwright/test";

test.describe("Dashboard Features", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication and navigate to dashboard
    // Note: This requires setup with clerk/playwright dependencies or a storage state
    await page.goto("/dashboard");
  });

  test("should display streak badge", async ({ page }) => {
    const streakBadge = page.locator('[data-testid="streak-badge"]');
    // Check if streak badge is visible
    // Note: You need to add data-testid="streak-badge" to the StreakBadge component if not present
    await expect(page.getByText(/ Streak/)).toBeVisible();
    await expect(page.getByText(/today/)).toBeVisible();
  });

  test("should show notifications popover", async ({ page }) => {
    const bellIcon = page.locator("button:has(.lucide-bell)");
    await expect(bellIcon).toBeVisible();

    await bellIcon.click();
    const popover = page.getByRole("dialog"); // Popover content usually has dialog role or check for text
    await expect(page.getByText("Notifications")).toBeVisible();
    await expect(page.getByText("Mark all read")).toBeVisible();
  });

  test("should load recent courses", async ({ page }) => {
    await expect(page.getByText("Learning Journey")).toBeVisible();
    // Assuming mock data or seed data exists
    // await expect(page.getByText('Course Title')).toBeVisible();
  });
});
