import typescript from '@rollup/plugin-typescript';

export default [{
  input: 'src/codegen.module.ts',
  output: [
    {
      file: 'dist/codegen.module.js',
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
    'yaml',
  ],
}];
