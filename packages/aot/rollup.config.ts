import * as rollup from 'rollup';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import chmod from '@mnrendra/rollup-plugin-chmod';
import copy from 'rollup-plugin-copy';

const config: rollup.RollupOptions[] = [
  {
    input: 'src/sapphire-build.ts',
    output: [
      {
        file: 'dist/sapphire-build.js',
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
      copy({
        targets: [
          { src: 'src/**/*.eta', dest: 'dist' },
          { src: 'src/**/*.json', dest: 'dist' },
        ],
        flatten: false,
      }),
    ],
    external: [
      'node:process',
      'path',
      '@commander-js/extra-typings',
      '@sapphire-cms/node',
      'defectless',
      '@sapphire-cms/core',
      'eta',
      'url',
      'rollup',
      '@rollup/plugin-typescript',
      '@rollup/plugin-node-resolve',
      '@rollup/plugin-commonjs',
      '@rollup/plugin-json',
      '@mnrendra/rollup-plugin-chmod',
    ],
  },
];

export default config;
