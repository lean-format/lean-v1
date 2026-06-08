import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts', 'packages/*/__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
  },
});
