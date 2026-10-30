import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

test.describe('sidebar navigation', () => {
  test('renders an accessible desktop sidebar and its hover state', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The desktop sidebar is intentionally hidden on mobile.');
    await page.goto('/home', { waitUntil: 'domcontentloaded' });

    const sidebar = page.getByRole('navigation', { name: /menu latéral|side menu/i });
    await expect(sidebar).toBeVisible();
    const matches = sidebar.getByRole('button', { name: /matchs|matches/i });
    await matches.hover();
    await expect(matches).toHaveClass(/hover:bg-pitch-sidebar-hover/);
    await expect(sidebar).toHaveScreenshot('sidebar-desktop.png', { animations: 'disabled' });

    const accessibility = await new AxeBuilder({ page }).include('aside.sidebar-desktop').analyze();
    expect(accessibility.violations).toEqual([]);
  });

  test('opens the responsive drawer on mobile and closes it with its accessible control', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The drawer interaction is covered by the mobile project.');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/home', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: /ouvrir le menu|open navigation/i }).click();
    const dialog = page.getByRole('dialog', { name: /menu latéral|side menu/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('navigation', { name: /menu latéral|side menu/i })).toBeVisible();
    await expect(page.getByRole('navigation', { name: /navigation mobile|mobile navigation/i })).toBeVisible();
    await expect(dialog).toHaveScreenshot('sidebar-mobile.png', { animations: 'disabled' });

    const accessibility = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
    expect(accessibility.violations).toEqual([]);

    await dialog.getByRole('button', { name: /fermer le menu|close menu/i }).click();
    await expect(dialog).toBeHidden();
  });
});
