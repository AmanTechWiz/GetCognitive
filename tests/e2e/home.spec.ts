import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/cognitive/i);
  });

  test('renders the hero section with main heading', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText(/AI concept/i);
  });

  test('has a "Start Learning" link pointing to /docs', async ({ page }) => {
    const link = page.getByRole('link', { name: /start learning/i }).first();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/docs');
  });

  test('has a "Browse Library" link', async ({ page }) => {
    const link = page.getByRole('link', { name: /browse library/i }).first();
    await expect(link).toBeVisible();
  });

  test('page loads without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });
});

test.describe('Navigation', () => {
  test('navigates to docs page from home', async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('link', { name: /start learning/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/docs/);
  });
});

test.describe('Docs page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs');
  });

  test('renders doc content', async ({ page }) => {
    // Page should have some content rendered
    await expect(page.locator('main, article, [role="main"]').first()).toBeVisible();
  });

  test('has a sidebar or navigation', async ({ page }) => {
    // The docs layout has a sidebar
    const nav = page.locator('nav, aside').first();
    await expect(nav).toBeVisible();
  });

  test('does not show site header (header hidden on /docs)', async ({ page }) => {
    // SiteHeader returns null when pathname starts with /docs
    const siteHeader = page.locator('#nd-nav');
    await expect(siteHeader).not.toBeVisible();
  });
});

test.describe('404 handling', () => {
  test('shows a not-found page for unknown routes', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist-12345');
    // Static export serves a 404 page
    expect(response?.status()).toBe(404);
  });
});
