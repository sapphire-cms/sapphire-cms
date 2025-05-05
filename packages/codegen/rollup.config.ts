import * as rollup from 'rollup';
import typescript from '@rollup/plugin-typescript';

const config: rollup.RollupOptions[] = [
  {
    input: 'src/codegen.module.ts',
    output: [
      {
        file: 'dist/codegen.module.js',
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
    external: ['@sapphire-cms/core', 'neverthrow', 'yaml'],
  },
];

export default config;
