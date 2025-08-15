import * as rollup from 'rollup';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const config: rollup.RollupOptions[] = [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'esm',
      },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        noEmitOnError: true,
      }),
    ],
    external: [],
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.min.js',
        format: 'esm',
      },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        noEmitOnError: true,
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
