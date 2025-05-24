import * as rollup from 'rollup';
import typescript from '@rollup/plugin-typescript';

const config: rollup.RollupOptions[] = [
  {
    input: 'src/rest.module.ts',
    output: [
      {
        file: 'dist/rest.module.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        experimentalDecorators: true,
      }),
    ],
    external: ['@tsed/common', '@tsed/di', '@sapphire-cms/core', 'defectless'],
  },
];

export default config;
