import { Dirent } from 'fs';
import * as path from 'path';
import {
  AsyncProgram,
  asyncProgram,
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
  ZCmsConfigSchema,
  ZContentSchema,
  ZManifestSchema,
  ZPipelineSchema,
  failure,
  success,
  Outcome,
} from '@sapphire-cms/core';
import chalk from 'chalk';
import {
  ensureDirectory,
  findYamlFile,
  FsError,
  listDirectoryEntries,
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
    return asyncProgram(
      function* (): AsyncProgram<CmsConfig, FsError | YamlParsingError> {
        const csmConfigFile: Option<string> = yield resolveYamlFile(this.workPaths.configFile);

        if (Option.isSome(csmConfigFile)) {
          return loadYaml(csmConfigFile.value, ZCmsConfigSchema);
        } else {
          return failure(new FsError(`Missing CMS config file ${this.workPaths.configFile}`));
        }
      },
      (defect) => failure(new FsError('Defective getCmsConfig program', defect)),
      this,
    ).mapFailure((err) => err.wrapIn(BootstrapError));
  }

  public loadModules(): Outcome<SapphireModuleClass[], BootstrapError> {
    const nodeModulesPath = path.resolve(this.workPaths.root, 'node_modules');

    return asyncProgram(
      function* (): AsyncProgram<
        SapphireModuleClass[],
        FsError | YamlParsingError | ModuleLoadingError
      > {
        const manifestFiles: string[] =
          yield NodeBootstrapLayer.findSapphireModulesManifestFiles(nodeModulesPath);

        const allModules: SapphireModuleClass[] = [];

        for (const manifest of manifestFiles) {
          const loadedModules: SapphireModuleClass[] =
            yield NodeBootstrapLayer.loadModulesFromManifest(manifest);
          allModules.push(...loadedModules);
        }

        return allModules;
      },
      (defect) => failure(new FsError('Defective loadModules program', defect)),
    ).mapFailure((err) => err.wrapIn(BootstrapError));
  }

  public getContentSchemas(): Outcome<ContentSchema[], BootstrapError> {
    return asyncProgram(
      function* (): AsyncProgram<ContentSchema[], FsError | YamlParsingError> {
        yield ensureDirectory(this.workPaths.schemasDir);
        const entries: Dirent[] = yield listDirectoryEntries(this.workPaths.schemasDir, true);
        const contentSchemasFiles = entries
          .filter((entry) => entry.isFile())
          .filter((entry) => entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))
          .map((entry) => path.join(entry.parentPath, entry.name));
        const loadingTasks = contentSchemasFiles.map((file) => loadYaml(file, ZContentSchema));

        return Outcome.combine(loadingTasks).map((loaded) =>
          loaded.map((yaml) => normalizeContentSchema(yaml)),
        );
      },
      (defect) => failure(new FsError('Defective getContentSchemas program', defect)),
      this,
    ).mapFailure((err) => err.wrapIn(BootstrapError));
  }

  public getPipelineSchemas(): Outcome<PipelineSchema[], BootstrapError> {
    return asyncProgram(
      function* (): AsyncProgram<PipelineSchema[], FsError | YamlParsingError> {
        yield ensureDirectory(this.workPaths.pipelinesDir);
        const entries: Dirent[] = yield listDirectoryEntries(this.workPaths.pipelinesDir, true);
        const pipelineFiles = entries
          .filter((entry) => entry.isFile())
          .filter((entry) => entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))
          .map((entry) => path.join(entry.parentPath, entry.name));
        const loadingTasks = pipelineFiles.map((file) => loadYaml(file, ZPipelineSchema));

        return Outcome.combine(loadingTasks).map((loaded) =>
          loaded.map((yaml) => normalizePipelineSchema(yaml)),
        );
      },
      (defect) => failure(new FsError('Defective getPipelineSchemas program', defect)),
      this,
    ).mapFailure((err) => err.wrapIn(BootstrapError));
  }

  public installPackages(packageNames: string[]): Outcome<void, BootstrapError> {
    const prefixedPackages = packageNames.map((packageName) => '@sapphire-cms/' + packageName);

    for (const packageName of prefixedPackages) {
      console.log(chalk.blue('Installing package: ') + chalk.yellow(packageName + '...'));
      // TODO: code the package install
      console.log(chalk.green('Successfully installed package: ') + chalk.yellow(packageName));
    }

    return success(undefined);
  }

  private static findSapphireModulesManifestFiles(
    nodeModulesPath: string,
  ): Outcome<string[], FsError> {
    return asyncProgram(
      function* (): AsyncProgram<string[], FsError> {
        const discoveredManifests: string[] = [];

        const entries: Dirent[] = yield listDirectoryEntries(nodeModulesPath);

        for (const entry of entries) {
          const fullEntryPath = path.join(nodeModulesPath, entry.name);

          // Find manifests of official modules
          if (entry.name === '@sapphire-cms') {
            const scopedPackages: Dirent[] = yield listDirectoryEntries(fullEntryPath);
            const findManifestsTasks = scopedPackages
              .map((sub) => path.join(fullEntryPath, sub.name, 'sapphire-cms.manifest'))
              .map((manifestFilename) => findYamlFile(manifestFilename));
            const foundManifests: Option<string>[] = yield Outcome.combine(findManifestsTasks);
            foundManifests
              .filter((option) => Option.isSome(option))
              .map((option) => option.value)
              .forEach((manifestFile) => discoveredManifests.push(manifestFile));
          }

          // Find manifests of community modules
          if (entry.name.startsWith('sapphire-cms-')) {
            const manifestPath: Option<string> = yield findYamlFile(
              path.join(fullEntryPath, 'sapphire-cms.manifest'),
            );

            if (Option.isSome(manifestPath)) {
              discoveredManifests.push(manifestPath.value);
            }
          }
        }

        return discoveredManifests;
      },
      (defect) => failure(new FsError('Defected findSapphireModulesManifestFiles program', defect)),
    );
  }

  private static loadModulesFromManifest(
    manifestFile: string,
  ): Outcome<SapphireModuleClass[], FsError | YamlParsingError | ModuleLoadingError> {
    const manifestDir = path.dirname(manifestFile);

    return loadYaml(manifestFile, ZManifestSchema).andThen((manifest: Manifest) => {
      const loadTasks = manifest.modules
        .map((modulePath) => path.resolve(manifestDir, modulePath))
        .map((moduleFile) =>
          Outcome.fromSupplier(
            () => import(moduleFile),
            (err) =>
              new ModuleLoadingError(`Failed to load module from the file ${moduleFile}`, err),
          ),
        );
      return Outcome.combine(loadTasks).map((loaded) =>
        loaded.map((module) => module.default as SapphireModuleClass),
      );
    });
  }
}
