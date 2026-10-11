import { expect, test } from '@playwright/test';

test.use({ launchOptions: { args: ['--disable-webgl', '--disable-webgl2'] } });

test('validates operands and focuses the first invalid field', async ({ page }) => {
  await page.goto('/compute/');
  const a = page.getByRole('textbox', { name: 'Число A' });
  const b = page.getByRole('textbox', { name: 'Число B' });
  await a.fill('');
  await expect(a).not.toHaveAttribute('aria-invalid', 'true');
  await a.blur();
  await expect(a).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Введите число от 0 до 15: у модели четыре бита')).toBeVisible();
  await a.fill('01');
  await expect(a).not.toHaveAttribute('aria-invalid', 'true');
  await b.fill('16');
  await page.getByRole('button', { name: 'Показать вычисление' }).click();
  await expect(b).toBeFocused();
  await b.fill('15');
  await page.getByRole('button', { name: 'Показать вычисление' }).click();
  await expect(page.getByText('Шаг 1 из 10', { exact: true })).toBeVisible();
  await expect(page.getByTestId('compute-flat')).toBeVisible();
});

test('synchronizes ten steps, RAM, carry, five-bit register, screen, and reverse navigation', async ({ page }) => {
  await page.goto('/compute/');
  await page.getByRole('button', { name: 'Показать вычисление' }).click();
  await expect(page.locator('.compute-panel').getByText('11 → 1011; 6 → 0110.', { exact: false })).toBeVisible();
  await page.getByRole('toolbar', { name: 'Главы вычисления' }).getByRole('button', { name: /ALU/ }).click();
  await expect(page.getByText('Шаг 4 из 10', { exact: true })).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('table').getByRole('cell', { name: 'c0: 0' })).toBeVisible();
  for (let step = 5; step <= 10; step += 1) {
    await page.getByRole('button', { name: 'Дальше' }).click();
    await expect(page.getByText(`Шаг ${step} из 10`, { exact: true })).toBeVisible();
  }
  await expect(page.locator('.compute-panel').getByText('10001₂ = 16 + 1 = 17₁₀.', { exact: false })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Путь операндов' })).toContainText('17');
  await page.getByRole('button', { name: 'Назад' }).click();
  await expect(page.getByText('Шаг 9 из 10', { exact: true })).toBeVisible();
  await expect(page.locator('.compute-panel').getByText('Результат записан в RAM', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Изменить числа' }).click();
  await expect(page.getByRole('textbox', { name: 'Число A' })).toHaveValue('11');
});

test('limits arrow navigation to the focused chapter strip and fits a 360px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/compute/');
  await page.getByRole('button', { name: 'Показать вычисление' }).click();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('Шаг 1 из 10', { exact: true })).toBeVisible();
  const toolbar = page.getByRole('toolbar', { name: 'Главы вычисления' });
  await toolbar.getByRole('button', { name: /Память и регистры/ }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('Шаг 4 из 10', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test('keeps the static worked example available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/compute/');
  await page.getByText('Текстовый разбор примера 11 + 6 без JavaScript').click();
  await expect(page.getByText('10001₂ = 16 + 1 = 17₁₀.', { exact: false })).toBeVisible();
  await expect(page.getByText('RAM принимает оба операнда', { exact: false })).toBeVisible();
  await context.close();
});

test('falls back to the complete flat route when WebGL is disabled', async ({ page }) => {
  await page.goto('/compute/');
  await page.getByRole('button', { name: 'Показать вычисление' }).click();
  await page.getByRole('button', { name: 'ALU 4–7' }).click();
  await expect(page.getByTestId('compute-flat')).toBeVisible();
  await expect(page.getByText('WEBGL НЕДОСТУПЕН · ПЛОСКИЙ ПУТЬ')).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
});

test('keeps zero carry empty and preserves the fifth bit for 15 + 15', async ({ page }) => {
  await page.goto('/compute/');
  await page.getByRole('textbox', { name: 'Число A' }).fill('0');
  await page.getByRole('textbox', { name: 'Число B' }).fill('0');
  await page.getByRole('button', { name: 'Показать вычисление' }).click();
  await page.getByRole('button', { name: 'Результат 8–10' }).click();
  await expect(page.locator('.compute-panel')).toContainText('c₄ = 0');
  await expect(page.locator('.compute-panel')).toContainText('00000');
  await page.getByRole('button', { name: 'Дальше' }).click();
  await expect(page.locator('.compute-panel')).toContainText('RAM');
  await page.getByRole('button', { name: 'Дальше' }).click();
  await expect(page.locator('.compute-panel')).toContainText('= 0₁₀');

  await page.getByRole('button', { name: 'Изменить числа' }).click();
  await page.getByRole('textbox', { name: 'Число A' }).fill('15');
  await page.getByRole('textbox', { name: 'Число B' }).fill('15');
  await page.getByRole('button', { name: 'Показать вычисление' }).click();
  await page.getByRole('button', { name: 'Результат 8–10' }).click();
  await expect(page.locator('.compute-panel')).toContainText('11110');
  await page.getByRole('button', { name: 'Дальше' }).click();
  await expect(page.locator('.compute-panel')).toContainText('RAM');
  await page.getByRole('button', { name: 'Дальше' }).click();
  await expect(page.locator('.compute-panel')).toContainText('= 30₁₀');
});
