import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import terser from "@rollup/plugin-terser";

export default [{
  input: 'src/index.ts',
  output: [
    {
      dir: 'dist',
      format: 'esm',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src',
      entryFileNames: '[name].js',
    }
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      noEmitOnError: true,
      experimentalDecorators: true,
      useDefineForClassFields: false,
    }),
  ],
  external: [
    'neverthrow',
    'nanoid/non-secure',
    'zod',
    'reflect-metadata',
    'tsyringe',
    'tslib',
  ],
}, {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/core.bundle.js',
      format: 'esm',
    }
  ],
  plugins: [
    resolve(),
    typescript({
      tsconfig: './tsconfig.json',
      noEmitOnError: true,
      experimentalDecorators: true,
      useDefineForClassFields: false,
    }),
  ],
}, {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/core.bundle.min.js',
      format: 'esm',
    }
  ],
  plugins: [
    resolve(),
    typescript({
      tsconfig: './tsconfig.json',
      noEmitOnError: true,
      experimentalDecorators: true,
      useDefineForClassFields: false,
    }),
    terser({
      format: {
        comments: false,
      },
    }),
  ],
}];
