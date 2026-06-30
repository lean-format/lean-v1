import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts', 'packages/*/__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
  },
  coverage: {
    include: ['packages/core/src/**', 'packages/cli/src/**'],
    exclude: ['packages/core/src/benchmark-compare.ts'],
    reporter: ['text'],
  },
});
