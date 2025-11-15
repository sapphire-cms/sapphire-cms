import * as rollup from 'rollup';
import typescript from '@rollup/plugin-typescript';

const config: rollup.RollupOptions[] = [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
      }),
    ],
    external: [
      '@tsed/common',
      '@tsed/di',
      '@tsed/platform-http',
      '@tsed/platform-express',
      '@tsed/platform-serverless-http',
    ],
  },
];

export default config;
