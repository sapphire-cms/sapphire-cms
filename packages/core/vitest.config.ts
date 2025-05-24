import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['./test/**/*.test.ts'],
    passWithNoTests: true,
  },
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
    },
  },
});
