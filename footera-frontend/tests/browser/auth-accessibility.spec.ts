import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

test.describe('authentication accessibility', () => {
  test('login form exposes labeled controls and has no axe violations', async ({ page, api }) => {
    api.loggedIn = false;
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /e-mail|email/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /mot de passe|password/i })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('registration form exposes its name field and has no axe violations', async ({ page, api }) => {
    api.loggedIn = false;
    await page.goto('/auth?mode=register', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('textbox', { name: /nom|name/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /e-mail|email/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /mot de passe|password/i })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('persists the selected language after reload', async ({ page, api }) => {
    api.loggedIn = false;
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });

    const language = page.getByRole('combobox', { name: /langue|language/i });
    await language.click();
    await page.getByRole('option', { name: /english|anglais/i }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome back');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome back');
  });
});
