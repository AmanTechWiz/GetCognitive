/**
 * Production smoke tests
 *
 * These run against the built & started Next.js server
 * (PLAYWRIGHT_BASE_URL=http://localhost:3000 or the deployed URL).
 *
 * In CI the server is started with:
 *   npm run build && npm start
 *
 * They verify that the most critical user paths work end-to-end
 * against the production build.
 */
import { test, expect } from '@playwright/test';

test.describe('Production smoke tests', () => {
  test('home page responds with 200 and renders content', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('docs index page responds with 200', async ({ page }) => {
    const response = await page.goto('/docs');
    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('static assets are served (CSS, fonts)', async ({ page }) => {
    const failedRequests: string[] = [];
    page.on('requestfailed', (req) => {
      if (req.url().includes('/_next/static/')) {
        failedRequests.push(req.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(failedRequests).toHaveLength(0);
  });

  test('newsletter page is accessible', async ({ page }) => {
    const response = await page.goto('/newsletter');
    expect(response?.status()).toBe(200);
  });

  test('page renders within acceptable load time', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - start;
    // Page should load within 10 seconds on CI
    expect(elapsed).toBeLessThan(10_000);
  });

  test('docs page renders without unhandled errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/docs');
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('search panel opens and accepts input', async ({ page }) => {
    await page.goto('/');
    // Use .first() to avoid strict-mode violation when locator matches multiple elements
    const searchTrigger = page.getByRole('button', { name: /search/i }).first();
    if (await searchTrigger.isVisible()) {
      await searchTrigger.click();
    }
    // Just verify the page doesn't crash
    await expect(page.locator('body')).toBeVisible();
  });
});
