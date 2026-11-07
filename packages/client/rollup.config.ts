import * as rollup from 'rollup';
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import type { LogLevel, LogOrStringHandler, RollupLog } from 'rollup';

function onLog(level: LogLevel, log: RollupLog, handler: LogOrStringHandler): void {
  if (log.code === 'INVALID_ANNOTATION' && log.id?.includes('/node_modules/zod/')) {
    return;
  }

  handler(level, log);
}

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
      nodeResolve(),
      typescript({
        tsconfig: './tsconfig.json',
        noEmitOnError: true,
      }),
    ],
    onLog,
  },
];

export default config;
