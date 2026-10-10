import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**/*.ts', 'src/content/scenarios/**/*.ts', 'scripts/budget-model.mjs'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 }
    }
  }
});
