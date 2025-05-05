import * as rollup from 'rollup';
import typescript from '@rollup/plugin-typescript';
import chmod from '@mnrendra/rollup-plugin-chmod';
import json from '@rollup/plugin-json';

const config: rollup.RollupOptions[] = [
  {
    input: 'src/module/cli.module.ts',
    output: [
      {
        file: 'dist/cli.module.js',
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
      '@sapphire-cms/core',
      '@sapphire-cms/textform',
      'tempy',
      'fs',
      'path',
      'execa',
      'node:process',
      'ts-dedent',
      'chalk',
    ],
  },
  {
    input: 'src/bin/sapphire-cli.ts',
    output: [
      {
        file: 'dist/sapphire-cli.js',
        format: 'esm',
        banner: '#!/usr/bin/env node',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        noEmitOnError: true,
      }),
      json(),
      chmod({
        mode: '755',
      }),
    ],
    external: [
      '@sapphire-cms/core',
      '@sapphire-cms/node',
      'neverthrow',
      'chalk',
      'commander',
      '@commander-js/extra-typings',
      'nano-spawn',
      'node:process',
      'path',
      'camelcase-keys',
      'yaml',
      'tempy',
    ],
  },
];

export default config;
