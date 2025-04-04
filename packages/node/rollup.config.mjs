import typescript from '@rollup/plugin-typescript';
import chmod from '@mnrendra/rollup-plugin-chmod'

export default [{
  input: 'src/node.module.ts',
  output: [
    {
      file: 'dist/node.module.js',
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
    'path',
    'fs',
    'camelcase-keys',
    'yaml'
  ],
}, {
  input: 'src/sapphire.ts',
  output: [
    {
      file: 'dist/sapphire.js',
      format: 'esm',
      banner: '#!/usr/bin/env node',
      sourcemap: true,
    }
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
    }),
    chmod({
      mode: '755',
    }),
  ],
  external: [
    'path',
    'fs',
    'camelcase-keys',
    'yaml',
  ],
}];
