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
import { ModuleFormat, OutputPluginOption, rollup, RollupBuild, RollupOptions } from 'rollup';
import { visualizer } from 'rollup-plugin-visualizer';

export class BundleError extends OuterError {
  public readonly _tag = 'BundleError';

  constructor(cause?: unknown) {
    super('Failed to bundle CMS', cause);
  }
}

export class Bundler {
  private readonly outputFilePrefix: string;
  private readonly buildOptions: RollupOptions;

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
          dedupe: [
            'defectless',
            '@tsed/common',
            '@tsed/di',
            '@tsed/platform-params',
            '@tsed/platform-multer',
          ],
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
  }

  public buildAll(): Outcome<void, BundleError> {
    const terserPlugin = terser({
      format: {
        comments: false,
      },
    });

    const visualizerPlugin = visualizer({
      filename: path.join(this.outputDir, `${this.outputFilePrefix}.html`),
      template: 'treemap',
      gzipSize: true,
      brotliSize: true,
    });

    return Bundler.createRollup(this.buildOptions).flatMap((build) => {
      return Bundler.write(build, path.join(this.outputDir, `${this.outputFilePrefix}.js`), 'esm', [
        visualizerPlugin,
      ])
        .through(() =>
          Bundler.write(
            build,
            path.join(this.outputDir, `${this.outputFilePrefix}.min.js`),
            'esm',
            [terserPlugin],
          ),
        )
        .through(() =>
          Bundler.write(build, path.join(this.outputDir, `${this.outputFilePrefix}.cjs`), 'cjs'),
        )
        .through(() =>
          Bundler.write(build, path.join(this.outputDir, `${this.outputFilePrefix}.cjs`), 'cjs', [
            terserPlugin,
          ]),
        )
        .finally(() => Bundler.closeBuild(build));
    });
  }

  private static write(
    build: RollupBuild,
    filename: string,
    format: ModuleFormat,
    plugins: OutputPluginOption[] = [],
  ): Outcome<void, BundleError> {
    return Outcome.fromSupplier(
      () =>
        build.write({
          file: filename,
          format,
          banner: '#!/usr/bin/env node',
          sourcemap: true,
          inlineDynamicImports: true,
          plugins,
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

  private static closeBuild(build: RollupBuild): Outcome<void, BundleError> {
    return Outcome.fromSupplier(
      () => build.close(),
      (err) => new BundleError(err),
    );
  }
}
