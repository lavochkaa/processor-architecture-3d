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

test('camera scale follows ALU and result chapters, with overview and reset controls', async ({ page }) => {
  await page.goto('/compute/');
  const webglAvailable = await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')));
  if (!webglAvailable) test.skip(true, 'WebGL is unavailable in this browser');
  await page.getByRole('button', { name: 'Показать вычисление' }).click();
  await page.getByRole('button', { name: 'ALU 4–7' }).click();
  await expect(page.getByRole('navigation', { name: 'Масштаб сцены' })).toContainText('ALU');
  await page.getByRole('button', { name: 'Плата', exact: true }).click();
  await expect(page.getByTestId('compute-stage')).toHaveAttribute('data-overview', 'true');
  await page.getByRole('button', { name: 'Вернуть камеру' }).click();
  await expect(page.getByTestId('compute-stage')).not.toHaveAttribute('data-overview');
  await page.getByRole('button', { name: 'Результат 8–9' }).click();
  await expect(page.getByRole('navigation', { name: 'Масштаб сцены' })).toContainText('Результат');
});
