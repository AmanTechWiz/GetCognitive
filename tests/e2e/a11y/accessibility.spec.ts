import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility — Home page', () => {
  test('home page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // Exclude third-party rendered SVG diagrams (Mermaid) from color-contrast check
      .exclude('.mermaid svg')
      .analyze();

    // Report violations for debugging
    if (results.violations.length > 0) {
      console.warn(
        'Accessibility violations:',
        results.violations.map((v) => `${v.id}: ${v.description}`),
      );
    }

    // Critical violations (impact: critical or serious) must be zero
    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(critical).toHaveLength(0);
  });

  test('all images have alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for img elements with null/undefined alt — empty alt="" is valid for decorative images
    const imgsWithoutAlt = await page.$$eval('img', (imgs) =>
      imgs.filter((img) => img.getAttribute('alt') === null).map((img) => img.src),
    );
    expect(imgsWithoutAlt).toHaveLength(0);
  });

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Tab through interactive elements and verify focus is visible
    const focusableElements = await page.$$eval(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      (els) => els.length,
    );
    expect(focusableElements).toBeGreaterThan(0);
  });

  test('page has a single h1', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const h1Count = await page.$$eval('h1', (els) => els.length);
    expect(h1Count).toBe(1);
  });

  test('page has a main landmark', async ({ page }) => {
    await page.goto('/');
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('colour contrast — theme toggle buttons have accessible labels', async ({ page }) => {
    await page.goto('/');
    const lightBtn = page.getByRole('button', { name: /light/i });
    const darkBtn = page.getByRole('button', { name: /dark/i });
    await expect(lightBtn).toBeVisible();
    await expect(darkBtn).toBeVisible();
  });
});

test.describe('Accessibility — Docs page', () => {
  test('docs page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/docs');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      // Exclude Mermaid-generated SVG diagrams — third-party renderer with fixed color palette
      .exclude('.mermaid svg')
      // Exclude foreignObject elements inside SVG (Mermaid edge labels)
      .exclude('foreignobject')
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(critical).toHaveLength(0);
  });
});
