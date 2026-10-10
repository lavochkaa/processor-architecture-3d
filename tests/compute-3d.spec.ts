import { expect, test } from '@playwright/test';

test('macro board renders as the main scene while its labels remain available in the DOM', async ({ page }) => {
  await page.goto('/compute/');
  const webglAvailable = await page.evaluate(() => {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'));
  });
  if (!webglAvailable) test.skip(true, 'WebGL is unavailable in this browser');
  await page.getByRole('button', { name: 'Показать вычисление' }).click();
  const canvas = page.getByTestId('compute-3d').locator('canvas');
  await expect(canvas).toBeVisible();
  await expect(page.getByRole('list', { name: 'Путь операндов' })).toContainText('Буфер ввода (условный)');
  await expect(page.getByRole('list', { name: 'Путь операндов' })).toContainText('Регистр результата (условный, 5 бит)');
});
