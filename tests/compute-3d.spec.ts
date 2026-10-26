import { expect, test } from '@playwright/test';
import { PerspectiveCamera, Vector3 } from 'three';
import { inputCameraPose } from '../src/renderers/arithmetic-3d/cameraPresets';

test('shows the board before the calculation starts', async ({ page }) => {
  await page.goto('/compute/');
  if (!await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')))) test.skip(true, 'WebGL is unavailable');
  await expect(page.getByTestId('compute-3d').locator('canvas')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Число A' })).toBeVisible();
});

test('presses actual 3D keys to edit A and B before running the calculation', async ({ page }) => {
  await page.goto('/compute/');
  if (!await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')))) test.skip(true, 'WebGL is unavailable');
  const canvas = page.getByTestId('compute-3d').locator('canvas');
  await expect(canvas).toBeVisible();
  await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('.compute-viewport');
    if (stage) window.scrollTo(0, stage.getBoundingClientRect().top + window.scrollY - 20);
  });
  await page.waitForTimeout(1400);
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  const pose = inputCameraPose();
  const camera = new PerspectiveCamera(42, box!.width / box!.height, .1, 80);
  camera.position.set(...pose.position);
  camera.lookAt(...pose.target);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  async function pressKey(column: number, row: number) {
    const point = new Vector3(-5.35 - .49 + column * .49, .27, -.48 + row * .31).project(camera);
    await page.mouse.click(box!.x + (point.x + 1) * box!.width / 2, box!.y + (1 - point.y) * box!.height / 2);
  }
  await pressKey(2, 3); // Backspace: A 11 → 1.
  await expect(page.getByRole('textbox', { name: 'Число A' })).toHaveValue('1');
  await pressKey(1, 1); // 5: A 1 → 15.
  await expect(page.getByRole('textbox', { name: 'Число A' })).toHaveValue('15');
  await pressKey(0, 3); // A/B.
  await pressKey(2, 3); // Backspace: B 6 → empty.
  await pressKey(1, 0); // 2.
  await expect(page.getByRole('textbox', { name: 'Число B' })).toHaveValue('2');
  await page.getByRole('button', { name: 'Показать вычисление' }).click();
  await expect(page.getByText('15 + 2', { exact: false }).first()).toBeVisible();
});

test('explains why the separate SSD is visible but inactive', async ({ page }) => {
  await page.goto('/compute/');
  if (!await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')))) test.skip(true, 'WebGL is unavailable');
  await page.getByRole('button', { name: 'Что такое SSD?' }).click();
  await expect(page.getByRole('status')).toContainText('В этом сложении не участвует');
  await page.getByRole('button', { name: 'Показать вычисление' }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('shows a compact action window above the active component', async ({ page }) => {
  await page.goto('/compute/');
  if (!await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')))) test.skip(true, 'WebGL is unavailable');
  const callout = page.locator('.compute-node-callout');
  await expect(callout).toContainText('Клавиатура');
  await page.getByRole('button', { name: 'Показать вычисление' }).click();
  await page.getByRole('button', { name: 'Дальше' }).click();
  await expect(callout).toContainText('RAM');
  await page.getByRole('button', { name: /^ALU(?:\s|$)/ }).click();
  await expect(callout).toContainText('ALU · сумматор 0');
});

test('reveals the next state only after a packet reaches RAM, including reverse travel', async ({ page }) => {
  await page.goto('/compute/');
  if (!await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')))) test.skip(true, 'WebGL is unavailable');
  await page.getByRole('button', { name: 'Показать вычисление' }).click();
  const stage = page.getByTestId('compute-stage');
  await expect(page.getByTestId('compute-3d').locator('canvas')).toBeVisible();
  await expect(stage).toHaveAttribute('data-presented-step', '1');
  await page.getByLabel('Скорость').selectOption('0.5');
  await page.getByRole('button', { name: 'Дальше' }).click();
  await expect(stage).toHaveAttribute('data-presented-step', '1');
  await expect(stage).toHaveAttribute('data-presented-step', '2', { timeout: 5000 });
  await page.getByRole('button', { name: 'Назад' }).click();
  await expect(stage).toHaveAttribute('data-presented-step', '2');
  await expect(stage).toHaveAttribute('data-presented-step', '1', { timeout: 5000 });
});

test('moves the five-bit answer from CPU to RAM before showing it on the screen', async ({ page }) => {
  await page.goto('/compute/');
  if (!await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')))) test.skip(true, 'WebGL is unavailable');
  await page.getByRole('button', { name: 'Показать вычисление' }).click();
  await expect(page.getByTestId('compute-3d').locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: /^Результат(?:\s|$)/ }).click();
  await page.getByLabel('Скорость').selectOption('0.5');
  const stage = page.getByTestId('compute-stage');
  await expect(stage).toHaveAttribute('data-presented-step', '8');
  await page.getByRole('button', { name: 'Дальше' }).click();
  await expect(stage).toHaveAttribute('data-presented-step', '8');
  await expect(stage).toHaveAttribute('data-presented-step', '9', { timeout: 5000 });
  await page.getByRole('button', { name: 'Дальше' }).click();
  await expect(stage).toHaveAttribute('data-presented-step', '9');
  await expect(stage).toHaveAttribute('data-presented-step', '10', { timeout: 5000 });
  await expect(page.locator('.compute-node-callout')).toContainText('17');
});

test('chapter jumps keep the prior data visible during the camera move', async ({ page }) => {
  await page.goto('/compute/');
  if (!await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')))) test.skip(true, 'WebGL is unavailable');
  await page.getByRole('button', { name: 'Показать вычисление' }).click();
  await expect(page.getByTestId('compute-3d').locator('canvas')).toBeVisible();
  await expect(page.locator('.compute-node-callout')).toContainText('Ввод');
  await page.getByLabel('Скорость').selectOption('0.5');
  const stage = page.getByTestId('compute-stage');
  await page.getByRole('button', { name: /^ALU(?:\s|$)/ }).click();
  await expect(stage).toHaveAttribute('data-presented-step', '1');
  await expect(page.locator('.compute-node-callout')).toContainText('Переход к главе');
  await expect(stage).toHaveAttribute('data-presented-step', '4', { timeout: 5000 });
  await expect(page.locator('.compute-node-callout')).toContainText('ALU · сумматор 0');
});

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
  await page.getByRole('button', { name: /^ALU(?:\s|$)/ }).click();
  await expect(page.getByRole('navigation', { name: 'Масштаб сцены' })).toContainText('ALU');
  await page.getByRole('button', { name: 'Плата', exact: true }).click();
  await expect(page.getByTestId('compute-stage')).toHaveAttribute('data-overview', 'true');
  await page.getByRole('button', { name: 'Вернуть камеру' }).click();
  await expect(page.getByTestId('compute-stage')).not.toHaveAttribute('data-overview');
  await page.getByRole('button', { name: /^Результат(?:\s|$)/ }).click();
  await expect(page.getByRole('navigation', { name: 'Масштаб сцены' })).toContainText('Результат');
});

test('keeps the action window inside a 360px scene without covering the addition table', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/compute/');
  if (!await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')))) test.skip(true, 'WebGL is unavailable');
  await page.getByRole('button', { name: 'Показать вычисление' }).click();
  await page.getByRole('button', { name: /^ALU(?:\s|$)/ }).click();
  const callout = page.locator('.compute-node-callout');
  await expect(callout).toContainText('ALU');
  const table = page.getByRole('table');
  await page.getByRole('button', { name: 'Развернуть' }).click();
  await expect(table).toBeVisible();
  const windowBox = await callout.boundingBox();
  const tableBox = await table.boundingBox();
  expect(windowBox).not.toBeNull();
  expect(tableBox).not.toBeNull();
  expect(windowBox!.x).toBeGreaterThanOrEqual(0);
  expect(windowBox!.x + windowBox!.width).toBeLessThanOrEqual(360);
  const overlap = windowBox!.x < tableBox!.x + tableBox!.width
    && windowBox!.x + windowBox!.width > tableBox!.x
    && windowBox!.y < tableBox!.y + tableBox!.height
    && windowBox!.y + windowBox!.height > tableBox!.y;
  expect(overlap).toBe(false);
});

test('lost WebGL context retains the current ALU step and switches to the flat route', async ({ page }) => {
  await page.goto('/compute/');
  if (!await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')))) test.skip(true, 'WebGL is unavailable');
  await page.getByRole('button', { name: 'Показать вычисление' }).click();
  await page.getByRole('button', { name: /^ALU(?:\s|$)/ }).click();
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
  await page.getByRole('button', { name: /^ALU(?:\s|$)/ }).click();
  await expect(page.getByText('МГНОВЕННЫЕ ПЕРЕХОДЫ')).toBeVisible();
  await expect(page.getByTestId('compute-3d').locator('canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Воспроизвести' })).toBeEnabled();
});

test('demand renderer stops issuing draws after a step settles', async ({ page }) => {
  await page.goto('/compute/');
  if (!await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')))) test.skip(true, 'WebGL is unavailable');
  await page.getByRole('button', { name: 'Показать вычисление' }).click();
  await page.getByRole('button', { name: /^ALU(?:\s|$)/ }).click();
  await expect(page.getByTestId('compute-3d').locator('canvas')).toBeVisible();
  await expect(page.getByTestId('compute-stage')).toHaveAttribute('data-presented-step', '4');
  await page.evaluate(() => {
    const scope = window as Window & { __drawCount?: number; __lastDrawAt?: number };
    scope.__drawCount = 0;
    const original = WebGL2RenderingContext.prototype.drawElements;
    WebGL2RenderingContext.prototype.drawElements = function (...args) {
      scope.__drawCount = (scope.__drawCount ?? 0) + 1;
      scope.__lastDrawAt = performance.now();
      return original.apply(this, args);
    };
  });
  await page.getByRole('button', { name: 'Дальше' }).click();
  await expect(page.getByTestId('compute-stage')).toHaveAttribute('data-presented-step', '5');
  await page.waitForFunction(() => {
    const scope = window as Window & { __drawCount?: number; __lastDrawAt?: number };
    return (scope.__drawCount ?? 0) > 0 && scope.__lastDrawAt !== undefined
      && performance.now() - scope.__lastDrawAt >= 700;
  }, null, { timeout: 10_000 });
  const afterTransition = await page.evaluate(() => (window as Window & { __drawCount?: number }).__drawCount ?? 0);
  expect(afterTransition).toBeGreaterThan(0);
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => (window as Window & { __drawCount?: number }).__drawCount ?? 0)).toBe(afterTransition);
});

test('remains responsive with four-times CPU throttling', async ({ page }) => {
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  try {
    await page.goto('/compute/');
    if (!await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')))) test.skip(true, 'WebGL is unavailable');
    await page.getByRole('button', { name: 'Показать вычисление' }).click();
    await expect(page.getByTestId('compute-3d').locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Дальше' }).click();
    await expect(page.getByTestId('compute-stage')).toHaveAttribute('data-presented-step', '2', { timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Дальше' })).toBeEnabled();
  } finally {
    await session.detach();
  }
});
