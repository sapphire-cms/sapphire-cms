import { Dirent } from 'fs';
import * as path from 'path';
import {
  BootstrapError,
  BootstrapLayer,
  CmsConfig,
  ContentSchema,
  Manifest,
  normalizeContentSchema,
  normalizePipelineSchema,
  Option,
  PipelineSchema,
  SapphireModuleClass,
  WebModule,
  ZCmsConfigSchema,
  ZContentSchema,
  ZManifestSchema,
  ZPipelineSchema,
} from '@sapphire-cms/core';
import chalk from 'chalk';
import { failure, Outcome, Program, program } from 'defectless';
// @ts-expect-error cannot be resolved by Typescript but can be solved by Node
// eslint-disable-next-line import/no-unresolved
import spawn from 'nano-spawn';
import {
  ensureDirectory,
  findSapphireModulesManifestFiles,
  FsError,
  listDirectoryEntries,
  loadModuleFromFile,
  loadYaml,
  ModuleLoadingError,
  resolveYamlFile,
  YamlParsingError,
} from '../common';
import { NodeModuleParams } from './node.module';
import { resolveWorkPaths, WorkPaths } from './params-utils';

export default class NodeBootstrapLayer implements BootstrapLayer<NodeModuleParams> {
  private readonly workPaths: WorkPaths;

  constructor(params: NodeModuleParams) {
    this.workPaths = resolveWorkPaths(params);
  }

  public getCmsConfig(): Outcome<CmsConfig, BootstrapError> {
    return program(function* (): Program<CmsConfig, FsError | YamlParsingError> {
      const csmConfigFile: Option<string> = yield resolveYamlFile(this.workPaths.configFile);

      if (Option.isSome(csmConfigFile)) {
        return loadYaml(csmConfigFile.value, ZCmsConfigSchema);
      } else {
        return failure(new FsError(`Missing CMS config file ${this.workPaths.configFile}`));
      }
    }, this).mapFailure((err) => err.wrapIn(BootstrapError));
  }

  public loadModules(): Outcome<SapphireModuleClass[], BootstrapError> {
    const nodeModulesPath = path.resolve(this.workPaths.root, 'node_modules');

    return program(function* (): Program<
      SapphireModuleClass[],
      FsError | YamlParsingError | ModuleLoadingError
    > {
      const manifestFiles: string[] = yield findSapphireModulesManifestFiles(nodeModulesPath);

      const allModules: SapphireModuleClass[] = [];

      for (const manifest of manifestFiles) {
        const loadedModules: SapphireModuleClass[] =
          yield NodeBootstrapLayer.loadModulesFromManifest(manifest);
        allModules.push(...loadedModules);
      }

      return allModules;
    }).mapFailure((err) => err.wrapIn(BootstrapError));
  }

  public getContentSchemas(): Outcome<ContentSchema[], BootstrapError> {
    return program(function* (): Program<ContentSchema[], FsError | YamlParsingError> {
      yield ensureDirectory(this.workPaths.schemasDir);
      const entries: Dirent[] = yield listDirectoryEntries(this.workPaths.schemasDir, true);
      const contentSchemasFiles = entries
        .filter((entry) => entry.isFile())
        .filter((entry) => entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))
        .map((entry) => path.join(entry.parentPath, entry.name));
      const loadingTasks = contentSchemasFiles.map((file) => loadYaml(file, ZContentSchema));

      return Outcome.all(loadingTasks)
        .map((loaded) => loaded.map((yaml) => normalizeContentSchema(yaml)))
        .mapFailure((errors) => {
          // TODO: find a cleaner solution. Do not swallow the errors
          return errors.filter((error) => !!error)[0];
        });
    }, this).mapFailure((err) => err.wrapIn(BootstrapError));
  }

  public getPipelineSchemas(): Outcome<PipelineSchema[], BootstrapError> {
    return program(function* (): Program<PipelineSchema[], FsError | YamlParsingError> {
      yield ensureDirectory(this.workPaths.pipelinesDir);
      const entries: Dirent[] = yield listDirectoryEntries(this.workPaths.pipelinesDir, true);
      const pipelineFiles = entries
        .filter((entry) => entry.isFile())
        .filter((entry) => entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))
        .map((entry) => path.join(entry.parentPath, entry.name));
      const loadingTasks = pipelineFiles.map((file) => loadYaml(file, ZPipelineSchema));

      return Outcome.all(loadingTasks)
        .map((loaded) => loaded.map((yaml) => normalizePipelineSchema(yaml)))
        .mapFailure((errors) => {
          // TODO: find a cleaner solution. Do not swallow the errors
          return errors.filter((error) => !!error)[0];
        });
    }, this).mapFailure((err) => err.wrapIn(BootstrapError));
  }

  public getWebModules(): Outcome<WebModule[], BootstrapError> {
    const nodeModulesPath = path.resolve(this.workPaths.root, 'node_modules');

    return program(function* (): Program<
      WebModule[],
      FsError | YamlParsingError | ModuleLoadingError
    > {
      const manifestFiles: string[] = yield findSapphireModulesManifestFiles(nodeModulesPath);

      const webModules: WebModule[] = [];

      for (const manifestFile of manifestFiles) {
        const manifest: Manifest = yield loadYaml(manifestFile, ZManifestSchema);
        const web = manifest.web || [];

        for (const webModule of web) {
          const root = path.resolve(path.dirname(manifestFile), webModule.root);
          webModules.push({
            name: webModule.name,
            root,
            mount: webModule.mount,
            spa: webModule.spa,
          });
        }
      }

      return webModules;
    }).mapFailure((err) => err.wrapIn(BootstrapError));
  }

  public installPackages(packageNames: string[]): Outcome<void, BootstrapError> {
    const prefixedPackages = packageNames.map((packageName) => '@sapphire-cms/' + packageName);

    console.log(chalk.blue('Installing packages: ') + chalk.yellow(prefixedPackages.join(', ')));

    const tasks: Outcome<unknown, BootstrapError>[] = prefixedPackages.map((dep) =>
      Outcome.fromSupplier(
        () =>
          spawn('npm', ['install', dep], {
            cwd: this.workPaths.root,
            stdio: 'inherit',
          }),
        (err) => new BootstrapError(`Failed to install package ${dep}`, err),
      ),
    );

    return Outcome.all(tasks)
      .tap(() => {
        console.log(
          chalk.green('Successfully installed package: ') +
            chalk.yellow(prefixedPackages.join(', ')),
        );
      })
      .map(() => {})
      .mapFailure((installErrors) => {
        const definedErrors = installErrors.filter((error) => !!error) as BootstrapError[];
        const message = definedErrors.map((error) => error.message).join('\n');
        const causes = definedErrors.map((error) => error?.cause).filter((cause) => !!cause);
        return new BootstrapError(message, causes);
      });
  }

  public removePackages(packageNames: string[]): Outcome<void, BootstrapError> {
    const prefixedPackages = packageNames.map((packageName) => '@sapphire-cms/' + packageName);

    console.log(chalk.blue('Removing packages: ') + chalk.yellow(prefixedPackages.join(', ')));

    const tasks: Outcome<unknown, BootstrapError>[] = prefixedPackages.map((dep) =>
      Outcome.fromSupplier(
        () =>
          spawn('npm', ['uninstall', dep], {
            cwd: this.workPaths.root,
            stdio: 'inherit',
          }),
        (err) => new BootstrapError(`Failed to remove package ${dep}`, err),
      ),
    );

    return Outcome.all(tasks)
      .tap(() => {
        console.log(
          chalk.green('Successfully removed package: ') + chalk.yellow(prefixedPackages.join(', ')),
        );
      })
      .map(() => {})
      .mapFailure((uninstallErrors) => {
        const definedErrors = uninstallErrors.filter((error) => !!error);
        const message = definedErrors.map((error) => error!.message).join('\n');
        const causes = definedErrors.map((error) => error?.cause).filter((cause) => !!cause);
        return new BootstrapError(message, causes);
      });
  }

  private static loadModulesFromManifest(
    manifestFile: string,
  ): Outcome<SapphireModuleClass[], FsError | YamlParsingError | ModuleLoadingError> {
    const manifestDir = path.dirname(manifestFile);

    return loadYaml(manifestFile, ZManifestSchema).flatMap((manifest: Manifest) => {
      const loadTasks = (manifest.modules || [])
        .map((modulePath) => path.resolve(manifestDir, modulePath))
        .map((moduleFile) => loadModuleFromFile(moduleFile));
      return Outcome.all(loadTasks).mapFailure((errors) => {
        // TODO: find a cleaner solution. Do not swallow the errors
        return errors.filter((error) => !!error)[0];
      });
    });
  }
}
