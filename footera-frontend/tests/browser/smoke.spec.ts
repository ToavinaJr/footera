import { expect, test } from '@playwright/test';

test('shows the public landing page when no session exists', async ({ page }) => {
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ status: 401, json: { message: 'Session expirée' } }));
  await page.route('**/api/v1/auth/refresh', (route) => route.fulfill({ status: 401, json: { message: 'Session expirée' } }));

  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 5000 });

  
  await expect(page).toHaveTitle(/Footera/);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByRole('link', { name: /se connecter|log in|hiditra/i }).first()).toBeVisible();
});
