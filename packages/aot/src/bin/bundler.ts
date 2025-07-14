import * as path from 'path';
import chmod from '@mnrendra/rollup-plugin-chmod';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { OuterError } from '@sapphire-cms/core';
import { getPathWithoutExtension } from '@sapphire-cms/node';
import { Outcome } from 'defectless';
import { ModuleFormat, rollup, RollupBuild, RollupOptions } from 'rollup';

export class BundleError extends OuterError {
  public readonly _tag = 'BundleError';

  constructor(cause?: unknown) {
    super('Failed to bundle CMS', cause);
  }
}

export class Bundler {
  private readonly outputFilePrefix: string;
  private readonly buildOptions: RollupOptions;
  private readonly buildOptionsMinified: RollupOptions;

  constructor(
    private readonly nodeModulesFolder: string,
    private readonly outputDir: string,
    private readonly entryFile: string,
    private readonly tsconfigFile: string,
    private readonly exclude: string[],
  ) {
    this.outputFilePrefix = path.basename(getPathWithoutExtension(entryFile));

    this.buildOptions = {
      input: this.entryFile,
      plugins: [
        alias({
          entries: [
            {
              find: '@sapphire-cms/bundle',
              replacement: path.resolve(this.outputDir, 'static-bootstrap'),
            },
          ],
        }),
        commonjs(),
        resolve({
          modulePaths: [this.nodeModulesFolder],
          preferBuiltins: false,
          exportConditions: ['node', 'default'],
        }),
        typescript({
          tsconfig: this.tsconfigFile,
          noEmitOnError: true,
          declaration: false,
        }),
        json(),
        chmod({
          mode: '755',
        }),
      ],
      external: this.exclude,
    };

    this.buildOptionsMinified = {
      input: this.entryFile,
      plugins: [
        alias({
          entries: [
            {
              find: '@sapphire-cms/bundle',
              replacement: path.resolve(this.outputDir, 'static-bootstrap'),
            },
          ],
        }),
        commonjs(),
        resolve({
          modulePaths: [this.nodeModulesFolder],
          preferBuiltins: false,
          exportConditions: ['node', 'default'],
        }),
        typescript({
          tsconfig: this.tsconfigFile,
          noEmitOnError: true,
          declaration: false,
        }),
        json(),
        chmod({
          mode: '755',
        }),
        terser({
          format: {
            comments: false,
          },
        }),
      ],
      external: this.exclude,
    };
  }

  public buildAll(): Outcome<void, BundleError> {
    return Outcome.all([
      this.bundleEsm(),
      this.bundleEsmMinified(),
      this.bundleCjs(),
      this.bundleCjsMinified(),
    ])
      .map(() => {})
      .mapFailure((bundleErrors) => new BundleError(bundleErrors));
  }

  public bundleEsm(): Outcome<void, BundleError> {
    return Bundler.createRollup(this.buildOptions).flatMap((build) =>
      this.write(build, `${this.outputFilePrefix}.js`, 'esm'),
    );
  }

  public bundleEsmMinified(): Outcome<void, BundleError> {
    return Bundler.createRollup(this.buildOptionsMinified).flatMap((build) =>
      this.write(build, `${this.outputFilePrefix}.min.js`, 'esm'),
    );
  }

  public bundleCjs(): Outcome<void, BundleError> {
    return Bundler.createRollup(this.buildOptions).flatMap((build) =>
      this.write(build, `${this.outputFilePrefix}.cjs`, 'cjs'),
    );
  }

  public bundleCjsMinified(): Outcome<void, BundleError> {
    return Bundler.createRollup(this.buildOptionsMinified).flatMap((build) =>
      this.write(build, `${this.outputFilePrefix}.min.cjs`, 'cjs'),
    );
  }

  private write(
    build: RollupBuild,
    filename: string,
    format: ModuleFormat,
  ): Outcome<void, BundleError> {
    return Outcome.fromSupplier(
      () =>
        build.write({
          file: path.join(this.outputDir, filename),
          format,
          banner: '#!/usr/bin/env node',
          sourcemap: true,
          inlineDynamicImports: true,
        }),
      (err) => new BundleError(err),
    ).map(() => {});
  }

  private static createRollup(options: RollupOptions): Outcome<RollupBuild, BundleError> {
    return Outcome.fromSupplier(
      () => rollup(options),
      (err) => new BundleError(err),
    );
  }
}
