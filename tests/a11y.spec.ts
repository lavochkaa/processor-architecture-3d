import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const path of ['/', '/scenario/', '/compute/', '/glossary/', '/boundaries/', '/sources/']) {
  test(`@a11y ${path} has no detectable WCAG A/AA violations`, async ({ page }) => {
    await page.goto(path);
    if (path === '/compute/') await page.getByRole('button', { name: 'Показать вычисление' }).waitFor();
    const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(report.violations).toEqual([]);
  });
}

test('@a11y interactive step and quiz are accessible', async ({ page }) => {
  await page.goto('/scenario/');
  await page.getByRole('button', { name: /Нажать клавишу A/ }).click();
  let report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(report.violations).toEqual([]);
  await page.getByRole('button', { name: 'Проверить понимание' }).count();
  for (let index = 0; index < 8; index += 1) await page.getByRole('button', { name: index === 7 ? 'Завершить маршрут' : 'Следующий шаг' }).click();
  await page.getByRole('button', { name: 'Проверить понимание' }).click();
  report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(report.violations).toEqual([]);
});

test('@a11y addition table and active ALU step remain accessible', async ({ page }) => {
  await page.goto('/compute/');
  await page.getByRole('button', { name: 'Показать вычисление' }).click();
  await page.getByRole('toolbar', { name: 'Главы вычисления' }).getByRole('button', { name: /ALU/ }).click();
  const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(report.violations).toEqual([]);
});
