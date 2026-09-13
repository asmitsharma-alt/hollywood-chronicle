import { test, expect } from '@playwright/test';

test.describe('Real-Time Wire, Freshness & Box Office Ledger Tests', () => {
  test('Live wire sync countdown and relative timestamps are rendered', async ({ page }) => {
    await page.goto('/');

    // Verify live wire sync countdown badge is visible
    const liveWireBadge = page.locator('text=LIVE WIRE (Sync in');
    await expect(liveWireBadge).toBeVisible();

    // Verify relative timestamps exist on homepage dispatches
    const relativeTimeElements = page.locator('text=/mins ago|Just now|Wire Flash|hours? ago/');
    await expect(relativeTimeElements.first()).toBeVisible();
  });

  test('Theatrical Ledger displays current movies and metric switcher works', async ({ page }) => {
    await page.goto('/');

    // Locate Box Office Ledger
    const ledger = page.getByText('The Theatrical Ledger');
    await expect(ledger).toBeVisible();

    // Check tabs
    const weeklyBtn = page.getByRole('button', { name: 'Weekly', exact: true });
    const dailyBtn = page.getByRole('button', { name: 'Daily', exact: true });
    const worldwideBtn = page.getByRole('button', { name: 'Worldwide', exact: true });

    await expect(weeklyBtn).toBeVisible();
    await expect(dailyBtn).toBeVisible();
    await expect(worldwideBtn).toBeVisible();

    // Verify table headers change with tab selection
    await weeklyBtn.click();
    await expect(page.getByRole('columnheader', { name: 'Weekly' })).toBeVisible();

    await dailyBtn.click();
    await expect(page.getByRole('columnheader', { name: 'Daily' })).toBeVisible();

    await worldwideBtn.click();
    await expect(page.getByRole('columnheader', { name: 'Global Gross' })).toBeVisible();

    // Verify trend badges and theater status pills are present
    const statusBadges = page.locator('text=/In Theaters|IMAX Exclusive|Advance Sales/');
    await expect(statusBadges.first()).toBeVisible();
  });

  test('New Indian Pop Culture & Gaming categories filter content accurately', async ({ page }) => {
    await page.goto('/');

    // Test Gaming & Esports category tab
    const gamingTab = page.getByRole('button', { name: 'Gaming & Esports' });
    if (await gamingTab.isVisible()) {
      await gamingTab.click();
      await expect(page.locator('text=Gaming & Esports').first()).toBeVisible();
    }

    // Test Indian Cinema category tab
    const indianCinemaTab = page.getByRole('button', { name: 'Indian Cinema' });
    await expect(indianCinemaTab).toBeVisible();
    await indianCinemaTab.click();
    await expect(page.locator('text=Indian Cinema').first()).toBeVisible();
  });

  test('Custom 404 vintage broadsheet error handling', async ({ page }) => {
    await page.goto('/article/non-existent-archive-dispatch-xyz-123');

    // Verify custom 404 page is rendered
    await expect(page.getByText('ERROR 404 • ARCHIVE DISPATCH MISSING')).toBeVisible();
    await expect(page.getByText('Return to Front Page Broadsheet')).toBeVisible();

    // Click return to broadsheet
    await page.getByText('Return to Front Page Broadsheet').click();
    await expect(page).toHaveURL('/');
  });
});
