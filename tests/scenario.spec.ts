import { expect, test } from '@playwright/test';

test('keyboard-only visitor completes eight steps, changes modes and answers questions', async ({ page }) => {
  await page.goto('/scenario/');
  await page.getByRole('button', { name: /Нажать клавишу A/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Физическое нажатие' }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Экспертный' }).click();
  await expect(page.getByRole('region', { name: 'Интерактивный сценарий' }).getByText(/Схема матрицы, debounce/)).toBeVisible();
  await page.getByRole('button', { name: 'Текст', exact: true }).click();
  await expect(page.getByTestId('scene-text')).toBeVisible();
  await page.getByRole('button', { name: 'Схема', exact: true }).click();
  await expect(page.getByTestId('scene-2d')).toBeVisible();
  await expect(page.getByLabel('ПОЛЕ ВВОДА БРАУЗЕРА / СИМУЛЯЦИЯ')).toHaveValue('');
  for (let index = 1; index <= 8; index += 1) {
    await expect(page.locator('.step-counter')).toContainText(`ЭТАП ${String(index).padStart(2, '0')}`);
    if (index === 8) await expect(page.getByLabel('ПОЛЕ ВВОДА БРАУЗЕРА / СИМУЛЯЦИЯ')).toHaveValue('a');
    await page.getByRole('button', { name: index === 8 ? 'Завершить маршрут' : 'Следующий шаг' }).focus();
    await page.keyboard.press('Enter');
  }
  await page.getByRole('button', { name: 'Проверить понимание' }).click();
  const questions = page.locator('.quiz-item');
  await expect(questions).toHaveCount(4);
  await questions.nth(0).getByRole('radio').nth(1).check();
  await questions.nth(1).getByRole('radio').nth(0).check();
  await questions.nth(2).getByRole('radio').nth(1).check();
  await questions.nth(3).getByRole('radio').nth(0).check();
  await expect(page.getByText('Верно.', { exact: false })).toHaveCount(4);
});

test('static content remains available with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/scenario/');
  await page.getByText('Полный текстовый маршрут без интерактивности').click();
  await expect(page.locator('.static-route li')).toHaveCount(8);
  await expect(page.getByText('Световой поток — метафора перехода')).toBeVisible();
  await context.close();
});

test('reduced motion disables autoplay while keeping manual navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/scenario/');
  await page.getByRole('button', { name: /Нажать клавишу A/ }).click();
  await expect(page.getByRole('button', { name: 'Автовоспроизведение' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Следующий шаг' }).click();
  await expect(page.locator('.step-counter')).toContainText('ЭТАП 02');
});

test('missing WebGL keeps the current step and uses the complete 2D route', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
      if (kind === 'webgl' || kind === 'webgl2' || kind === 'experimental-webgl') return null;
      return Reflect.apply(original, this, [kind, ...args]);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto('/scenario/');
  await page.getByRole('button', { name: /Нажать клавишу A/ }).click();
  await page.getByRole('button', { name: 'Следующий шаг' }).click();
  await page.getByRole('button', { name: '3D-сцена' }).click();
  await expect(page.getByTestId('scene-2d')).toBeVisible();
  await expect(page.locator('.step-counter')).toContainText('ЭТАП 02');
  await expect(page.getByRole('status')).toContainText('WebGL недоступен');
});

test('lost WebGL context switches to 2D without losing progress', async ({ page }) => {
  await page.goto('/scenario/');
  await page.getByRole('button', { name: /Нажать клавишу A/ }).click();
  await page.getByRole('button', { name: 'Следующий шаг' }).click();
  await page.getByRole('button', { name: '3D-сцена' }).click();
  if (await page.getByText('WebGL недоступен. Схема показывает весь тот же маршрут.').count()) test.skip();
  const canvas = page.getByTestId('scene-3d').locator('canvas');
  await expect(canvas).toBeVisible();
  await canvas.evaluate((element) => element.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await expect(page.getByTestId('scene-2d')).toBeVisible();
  await expect(page.locator('.step-counter')).toContainText('ЭТАП 02');
});
