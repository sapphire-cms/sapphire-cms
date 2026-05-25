import * as rollup from 'rollup';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

const config: rollup.RollupOptions[] = [
  {
    input: 'src/cloudinary.module.ts',
    output: [
      {
        file: 'dist/cloudinary.module.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        experimentalDecorators: true,
      }),
      json(),
    ],
    external: ['@sapphire-cms/core', 'defectless', 'cloudinary'],
  },
];

export default config;
