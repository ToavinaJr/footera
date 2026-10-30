import { defineConfig } from 'vitest/config';
export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`.
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts', '**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
    thresholds: { lines: 80 },
      exclude: [
        'src/generated/**',
        'src/main.ts',
        'src/index.ts',
        'src/app.factory.ts',
        'src/database/prisma.service.ts',
        'src/database/seed-data.ts',
        // HTTP adapters are measured by integration/E2E tests, not unit coverage.
        'src/controllers/**',
        'src/app.controller.ts',
      ],
    },
  },
});
