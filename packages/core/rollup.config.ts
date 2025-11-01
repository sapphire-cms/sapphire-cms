import * as rollup from 'rollup';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';

const config: rollup.RollupOptions[] = [
  {
    input: 'src/index.ts',
    output: [
      {
        dir: 'dist',
        format: 'esm',
        sourcemap: true,
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
      },
    ],
    plugins: [
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        noEmitOnError: true,
        experimentalDecorators: true,
        useDefineForClassFields: false,
      }),
    ],
    external: ['defectless', 'nanoid/non-secure', 'zod', 'reflect-metadata', 'tsyringe', 'tslib'],
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/core.bundle.js',
        format: 'esm',
      },
    ],
    plugins: [
      resolve({
        mainFields: ['module', 'main'],
      }),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        noEmitOnError: true,
        experimentalDecorators: true,
        useDefineForClassFields: false,
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/core.bundle.min.js',
        format: 'esm',
      },
    ],
    plugins: [
      resolve({
        mainFields: ['module', 'main'],
      }),
      json(),
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
  },
];

export default config;
