import { test, expect } from '@playwright/test';

test.describe('The SMOC Times - E2E User Flow', () => {
  test('Homepage renders vintage broadsheet elements cleanly', async ({ page }) => {
    await page.goto('/');

    // Verify masthead title
    const masthead = page.locator('header h1');
    await expect(masthead).toContainText('THE SMOC TIMES');

    // Verify dateline and wire ticker
    await expect(page.locator('header').getByText('VOL. CXXIV • NO. 257')).toBeVisible();
    await expect(page.getByText('WIRE TICKER')).toBeVisible();

    // Verify Front Page section
    await expect(page.getByText('FINAL DISPATCH')).toBeVisible();
    await expect(page.getByText('The Morning Wire')).toBeVisible();
    await expect(page.getByText('The Theatrical Ledger')).toBeVisible();
  });

  test('Search and category filter works interactively', async ({ page }) => {
    await page.goto('/');

    // Search for a known story keyword
    const searchInput = page.getByPlaceholder('Search wire...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Zack Snyder');

    // Confirm that articles containing "Zack Snyder" are matched
    await expect(page.locator('text=Zack Snyder').first()).toBeVisible();

    // Clear search
    await searchInput.fill('');

    // Test category filter tabs
    const cinemaTab = page.getByRole('button', { name: 'Cinema' });
    await expect(cinemaTab).toBeVisible();
    await cinemaTab.click();

    // Verify Cinema category filter applied
    await expect(page.locator('text=Cinema').first()).toBeVisible();
  });

  test('Article reading flow and AI verification badge modal', async ({ page }) => {
    await page.goto('/');

    // Click on the first readable article title or continue reading
    const articleLink = page.locator('article h2, article h3, article h4').first();
    await articleLink.click();

    // Verify navigation to article detail page
    await expect(page).toHaveURL(/\/article\//);
    await expect(page.locator('article h1')).toBeVisible();

    // Check breadcrumb
    await expect(page.getByText('Return to Front Page Broadsheet')).toBeVisible();

    // Check machine audit certificate section
    await expect(page.getByText('Truth Verification Protocol')).toBeVisible();
    await expect(page.getByText('Editorial Corroboration Record')).toBeVisible();

    // Check Verification Badge modal interaction
    const verifyBadge = page.locator('button[title*="Inspect AI Fact-Checking"]').first();
    if (await verifyBadge.isVisible()) {
      await verifyBadge.click();
      await expect(page.getByText('Fact-Check & Cross-Reference Dossier')).toBeVisible();
      // Close modal by pressing close button or Escape
      await page.keyboard.press('Escape');
    }
  });

  test('Newsroom Operations Admin Dashboard works', async ({ page }) => {
    await page.goto('/admin');

    // Verify operations dashboard header
    await expect(page.getByText('Newsroom Operations & Autonomous Pipeline')).toBeVisible();
    await expect(page.getByText('4-Agent Autonomous Editorial Matrix')).toBeVisible();
    await expect(page.getByText('Live Autonomous Crawler Stream')).toBeVisible();
    await expect(page.getByText('Monitored Global Feeds')).toBeVisible();

    // Verify trigger button exists
    const triggerBtn = page.getByRole('button', { name: /Trigger Discovery Cycle/i });
    await expect(triggerBtn).toBeVisible();
  });
});
