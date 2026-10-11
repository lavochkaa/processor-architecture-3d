import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { chromium, expect } from '@playwright/test';

const output = fileURLToPath(new URL('../docs/preview/', import.meta.url));
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
  recordVideo: { dir: output, size: { width: 1280, height: 800 } }
});
const page = await context.newPage();
const stage = page.getByTestId('compute-stage');
const next = page.getByRole('button', { name: 'Дальше' });
const previous = page.getByRole('button', { name: 'Назад' });

async function frame(name) {
  await stage.screenshot({ path: join(output, `${name}.png`), animations: 'disabled' });
}

async function advance() {
  await next.evaluate((button) => button.click());
}

async function captureTransition(step) {
  await advance();
  await page.waitForTimeout(70);
  await frame(`step${String(step).padStart(2, '0')}-start`);
  await page.waitForTimeout(950);
  await frame(`step${String(step).padStart(2, '0')}-middle`);
  await expect(stage).toHaveAttribute('data-presented-step', String(step), { timeout: 7000 });
  await frame(`step${String(step).padStart(2, '0')}-end`);
}

try {
  await page.goto('http://127.0.0.1:4321/compute/');
  await expect(page.getByTestId('compute-3d').locator('canvas')).toBeVisible();
  await page.waitForTimeout(1400);
  await frame('input-desktop');
  await page.getByRole('button', { name: 'Показать вычисление' }).click();
  await expect(stage).toHaveAttribute('data-presented-step', '1');
  await page.getByLabel('Скорость').selectOption('0.5');
  await frame('step01-board');
  for (const step of [2, 3, 4]) await captureTransition(step);
  await page.getByLabel('Скорость').selectOption('2');
  for (const step of [5, 6, 7]) {
    await advance();
    await expect(stage).toHaveAttribute('data-presented-step', String(step), { timeout: 7000 });
  }
  await page.getByLabel('Скорость').selectOption('0.5');
  for (const step of [8, 9, 10]) await captureTransition(step);
  for (const step of [9, 8]) {
    await previous.evaluate((button) => button.click());
    await expect(stage).toHaveAttribute('data-presented-step', String(step), { timeout: 7000 });
  }
  const video = page.video();
  await context.close();
  if (video) {
    await video.saveAs(join(output, 'addition-walkthrough.webm'));
    await video.delete();
  }

  const mobile = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 1 });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto('http://127.0.0.1:4321/compute/');
  await expect(mobilePage.getByTestId('compute-3d').locator('canvas')).toBeVisible();
  await mobilePage.waitForTimeout(1400);
  await mobilePage.getByTestId('compute-stage').screenshot({ path: join(output, 'input-mobile-360.png'), animations: 'disabled' });
  await mobile.close();
} finally {
  await browser.close();
}
