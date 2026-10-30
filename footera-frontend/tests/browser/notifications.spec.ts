import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

test('opens an accessible notification drawer and supports keyboard-style interaction', async ({ page }) => {
  await page.route('**/api/v1/notifications', (route) => route.fulfill({
    status: 200,
    json: [{
      id: 'notification-1',
      title: 'Match à venir',
      message: 'Votre équipe joue demain.',
      time: 'il y a 5 min',
      isRead: false,
      type: 'match',
      targetSection: 'matches',
      targetId: 'match-1',
    }],
  }));
  await page.goto('/home', { waitUntil: 'domcontentloaded' });

  await page.getByRole('button', { name: /notification/i }).click();
  const dialog = page.getByRole('dialog', { name: /centre d.alertes|notifications/i });
  await expect(dialog).toBeVisible();

  const notification = dialog.getByRole('button', { name: /match à venir/i });
  await notification.hover();
  await expect(notification).toBeVisible();
  await expect(dialog).toHaveScreenshot('notifications-drawer.png', { animations: 'disabled' });

  const accessibility = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(accessibility.violations).toEqual([]);

  await notification.click();
  await expect(page).toHaveURL(/\/matches\/match-1$/);
});
