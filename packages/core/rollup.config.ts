import * as rollup from 'rollup';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import { visualizer } from 'rollup-plugin-visualizer';
import type { LogLevel, LogOrStringHandler, RollupLog } from 'rollup';

function onLog(level: LogLevel, log: RollupLog, handler: LogOrStringHandler): void {
  if (log.code === 'INVALID_ANNOTATION' && log.id?.includes('/node_modules/zod/')) {
    return;
  }

  handler(level, log);
}

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
    external: [
      'defectless',
      'nanoid/non-secure',
      'zod/mini',
      'reflect-metadata',
      'tsyringe',
      'tslib',
    ],
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
      visualizer({
        filename: 'dist/bundle-stats.html',
        template: 'treemap',
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    onLog,
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
    onLog,
  },
];

export default config;
