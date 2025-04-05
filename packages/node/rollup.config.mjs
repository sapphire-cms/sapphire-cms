import typescript from '@rollup/plugin-typescript';
import chmod from '@mnrendra/rollup-plugin-chmod'

export default [{
  input: 'src/module/node.module.ts',
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
    'yaml',
    'chalk',
  ],
}, {
  input: 'src/bin/sapphire-node.ts',
  output: [
    {
      file: 'dist/sapphire-node.js',
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
    'chalk',
  ],
}, {
  input: 'src/index.ts',
  output: [
    {
      dir: 'dist',
      format: 'esm',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src',
      entryFileNames: '[name].js',
    }
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.utils.json',
    }),
  ],
  external: [
    'path',
    'fs',
    'camelcase-keys',
    'yaml',
    'chalk',
  ],
}];
