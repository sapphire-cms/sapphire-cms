import typescript from '@rollup/plugin-typescript';
import chmod from '@mnrendra/rollup-plugin-chmod'
import json from '@rollup/plugin-json';

export default [{
  input: 'src/module/cli.module.ts',
  output: [
    {
      file: 'dist/cli.module.js',
      format: 'esm',
      sourcemap: true,
    }
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      experimentalDecorators: true,
      useDefineForClassFields: false,
    }),
  ],
  external: [
    '@sapphire-cms/core',
    'tempy',
    'fs',
    'path',
    'execa',
    'node:process',
    'ts-dedent',
    'chalk',
  ],
}, {
  input: 'src/bin/sapphire-cli.ts',
  output: [
    {
      file: 'dist/sapphire-cli.js',
      format: 'esm',
      banner: '#!/usr/bin/env node',
      sourcemap: true,
    }
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
    }),
    json(),
    chmod({
      mode: '755',
    }),
  ],
  external: [
    '@sapphire-cms/node',
    'chalk',
    'commander',
    '@commander-js/extra-typings',
    'nano-spawn',
    'path',
    'fs',
    'camelcase-keys',
    'yaml',
    'tempy',
  ],
}];
