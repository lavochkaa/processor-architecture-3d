import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

test('landing page composition stays visually stable', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero')).toHaveScreenshot('landing-hero.png', { animations: 'disabled' });
});

test('2D scene keeps its first and final states visually stable', async ({ page }) => {
  await page.goto('/scenario/');
  await page.getByRole('button', { name: /Нажать клавишу A/ }).click();
  await expect(page.getByTestId('scene-2d')).toHaveScreenshot('scene-2d-start.png', { animations: 'disabled' });
  await page.getByRole('button', { name: '08' }).click();
  await expect(page.getByTestId('scene-2d')).toHaveScreenshot('scene-2d-end.png', { animations: 'disabled' });
});

test('reduced motion scene has a stable static state', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/scenario/');
  await page.getByRole('button', { name: /Нажать клавишу A/ }).click();
  await expect(page.getByTestId('scene-2d')).toHaveScreenshot('scene-2d-reduced.png', { animations: 'disabled' });
});

test('3D author camera points render without continuous animation', async ({ page }) => {
  await page.goto('/scenario/');
  await page.getByRole('button', { name: /Нажать клавишу A/ }).click();
  await page.getByRole('button', { name: '3D-сцена' }).click();
  if (await page.getByText('WebGL недоступен. Схема показывает весь тот же маршрут.').count()) test.skip();
  await expect(page.getByTestId('scene-3d').locator('canvas')).toBeVisible();
  await expect(page.getByTestId('scene-3d')).toHaveScreenshot('scene-3d-start.png', { maxDiffPixelRatio: 0.05, animations: 'disabled' });
  await page.getByRole('button', { name: '08' }).click();
  await expect(page.getByTestId('scene-3d')).toHaveScreenshot('scene-3d-end.png', { maxDiffPixelRatio: 0.05, animations: 'disabled' });
});
