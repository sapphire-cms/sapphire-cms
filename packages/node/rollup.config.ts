import * as rollup from 'rollup';
import typescript from '@rollup/plugin-typescript';
import chmod from '@mnrendra/rollup-plugin-chmod';
import json from '@rollup/plugin-json';

const config: rollup.RollupOptions[] = [
  {
    input: 'src/module/node.module.ts',
    output: [
      {
        file: 'dist/node.module.js',
        format: 'esm',
        sourcemap: true,
      },
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
      '@tsed/common',
      '@tsed/di',
      '@tsed/platform-express',
      '@sapphire-cms/core',
      'cors',
      'defectless',
      'body-parser',
      'path',
      'fs',
      'camelcase-keys',
      'yaml',
      'chalk',
      'node:process',
      'nano-spawn',
    ],
  },
  {
    input: 'src/bin/sapphire-node.ts',
    output: [
      {
        file: 'dist/sapphire-node.js',
        format: 'esm',
        banner: '#!/usr/bin/env node',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        noEmitOnError: true,
        experimentalDecorators: true,
      }),
      json(),
      chmod({
        mode: '755',
      }),
    ],
    external: [
      '@sapphire-cms/core',
      'defectless',
      'path',
      'fs',
      'camelcase-keys',
      'yaml',
      'chalk',
      'node:process',
      '@commander-js/extra-typings',
      'nano-spawn',
    ],
  },
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
      typescript({
        tsconfig: './tsconfig.common.json',
        noEmitOnError: true,
      }),
    ],
    external: [
      '@sapphire-cms/core',
      'defectless',
      'neverthrow',
      'path',
      'fs',
      'camelcase-keys',
      'yaml',
      'chalk',
      'node:process',
    ],
  },
];

export default config;
