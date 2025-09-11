import * as rollup from 'rollup';
import typescript from '@rollup/plugin-typescript';

const config: rollup.RollupOptions[] = [
  {
    input: 'src/simple-auth.module.ts',
    output: [
      {
        file: 'dist/simple-auth.module.js',
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
    external: ['@sapphire-cms/core', 'defectless'],
  },
];

export default config;
