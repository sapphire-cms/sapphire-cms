import * as path from 'path';
import chmod from '@mnrendra/rollup-plugin-chmod';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { OuterError } from '@sapphire-cms/core';
import { Outcome } from 'defectless';
import { ModuleFormat, rollup, RollupBuild, RollupOptions } from 'rollup';

export class BundleError extends OuterError {
  public readonly _tag = 'BundleError';

  constructor(cause?: unknown) {
    super('Failed to bundle CMS', cause);
  }
}

export class Bundler {
  private readonly buildOptions: RollupOptions;
  private readonly buildOptionsMinified: RollupOptions;

  constructor(
    private readonly nodeModulesFolder: string,
    private readonly outputDir: string,
    private readonly aotFile: string,
    private readonly tsconfigFile: string,
  ) {
    this.buildOptions = {
      input: this.aotFile,
      plugins: [
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
    };

    this.buildOptionsMinified = {
      input: this.aotFile,
      plugins: [
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
      this.write(build, 'sapphire.bundle.js', 'esm'),
    );
  }

  public bundleEsmMinified(): Outcome<void, BundleError> {
    return Bundler.createRollup(this.buildOptionsMinified).flatMap((build) =>
      this.write(build, 'sapphire.bundle.min.js', 'esm'),
    );
  }

  public bundleCjs(): Outcome<void, BundleError> {
    return Bundler.createRollup(this.buildOptions).flatMap((build) =>
      this.write(build, 'sapphire.bundle.cjs', 'cjs'),
    );
  }

  public bundleCjsMinified(): Outcome<void, BundleError> {
    return Bundler.createRollup(this.buildOptionsMinified).flatMap((build) =>
      this.write(build, 'sapphire.bundle.min.cjs', 'cjs'),
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
          file: path.join(this.outputDir, 'sapphire-cms', filename),
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
