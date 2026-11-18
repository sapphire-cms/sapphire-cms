import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['./test/**/*.test.ts'],
    passWithNoTests: true,
    typecheck: {
      enabled: true,
      include: ['./test/**/*.test.ts'],
      ignoreSourceErrors: true,
      tsconfig: 'tsconfig.test.json',
    },
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
