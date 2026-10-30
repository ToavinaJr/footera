import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

test.describe('public landing typography and responsive polish', () => {
  test('renders the editorial desktop hierarchy, hover state, and accessibility tree', async ({ page, api, isMobile }) => {
    test.skip(isMobile, 'Desktop visual coverage runs in the desktop project.');
    api.loggedIn = false;
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveCSS('font-family', /Bricolage Grotesque/);
    await expect(page.getByRole('link', { name: /se connecter|log in|hiditra/i }).first()).toBeVisible();
    await expect(page).toHaveScreenshot('landing-desktop.png', { fullPage: true, animations: 'disabled' });

    const login = page.getByRole('link', { name: /se connecter|log in|hiditra/i }).first();
    await login.hover();
    await expect(login).toHaveClass(/hover:text-pitch-primary/);
    await expect(login).toHaveCSS('color', 'rgb(23, 98, 70)');

    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
  });

  test('keeps the mobile headline and primary action usable without horizontal overflow', async ({ page, api, isMobile }) => {
    test.skip(!isMobile, 'Mobile visual coverage runs in the mobile project.');
    api.loggedIn = false;
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveCSS('font-family', /Bricolage Grotesque/);
    await expect(page.getByRole('link', { name: /rejoindre|join/i }).first()).toBeVisible();
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
    await expect(page).toHaveScreenshot('landing-mobile.png', { fullPage: true, animations: 'disabled' });

    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
  });
});
