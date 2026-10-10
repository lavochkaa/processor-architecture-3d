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
  await expect(page.getByRole('list', { name: 'Путь операндов' })).toContainText('RAM · операнды');
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
  await page.getByRole('button', { name: 'Результат 8–10' }).click();
  await expect(page.getByRole('navigation', { name: 'Масштаб сцены' })).toContainText('Результат');
});

test('lost WebGL context retains the current ALU step and switches to the flat route', async ({ page }) => {
  await page.goto('/compute/');
  if (!await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')))) test.skip(true, 'WebGL is unavailable');
  await page.getByRole('button', { name: 'Показать вычисление' }).click();
  await page.getByRole('button', { name: 'ALU 4–7' }).click();
  const canvas = page.getByTestId('compute-3d').locator('canvas');
  await expect(canvas).toBeVisible();
  const lost = await canvas.evaluate((element) => {
    const context = (element as HTMLCanvasElement).getContext('webgl2');
    const extension = context?.getExtension('WEBGL_lose_context');
    extension?.loseContext();
    return Boolean(extension);
  });
  if (!lost) test.skip(true, 'WEBGL_lose_context is unavailable');
  await expect(page.getByTestId('compute-flat')).toBeVisible();
  await expect(page.getByText('Шаг 4 из 10', { exact: true })).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
});

test('reduced motion keeps manual 3D navigation and instant transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/compute/');
  if (!await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')))) test.skip(true, 'WebGL is unavailable');
  await page.getByRole('button', { name: 'Показать вычисление' }).click();
  await page.getByRole('button', { name: 'ALU 4–7' }).click();
  await expect(page.getByText('МГНОВЕННЫЕ ПЕРЕХОДЫ')).toBeVisible();
  await expect(page.getByTestId('compute-3d').locator('canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Воспроизвести' })).toBeEnabled();
});

test('demand renderer stops issuing draws after a step settles', async ({ page }) => {
  await page.goto('/compute/');
  if (!await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')))) test.skip(true, 'WebGL is unavailable');
  await page.getByRole('button', { name: 'Показать вычисление' }).click();
  await page.getByRole('button', { name: 'ALU 4–7' }).click();
  await expect(page.getByTestId('compute-3d').locator('canvas')).toBeVisible();
  await page.evaluate(() => {
    const scope = window as Window & { __drawCount?: number };
    scope.__drawCount = 0;
    const original = WebGL2RenderingContext.prototype.drawElements;
    WebGL2RenderingContext.prototype.drawElements = function (...args) {
      scope.__drawCount = (scope.__drawCount ?? 0) + 1;
      return original.apply(this, args);
    };
  });
  await page.getByRole('button', { name: 'Дальше' }).click();
  await page.waitForTimeout(1900);
  const afterTransition = await page.evaluate(() => (window as Window & { __drawCount?: number }).__drawCount ?? 0);
  expect(afterTransition).toBeGreaterThan(0);
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => (window as Window & { __drawCount?: number }).__drawCount ?? 0)).toBe(afterTransition);
});
