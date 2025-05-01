import {promises as fs} from 'fs';
import * as path from 'path';
import {
  BootstrapLayer,
  CmsConfig,
  ContentSchema,
  Manifest, normalizeContentSchema, normalizePipelineSchema,
  PipelineSchema,
  SapphireModuleClass,
  ZCmsConfigSchema,
  ZContentSchema,
  ZManifestSchema, ZPipelineSchema
} from '@sapphire-cms/core';
import chalk from 'chalk';
import {ensureDirectory, findYamlFile, loadYaml, resolveYamlFile} from '../utils';
import {NodeModuleParams} from './node.module';
import {resolveWorkPaths, WorkPaths} from './params-utils';

export default class NodeBootstrapLayer implements BootstrapLayer<NodeModuleParams> {
  private readonly workPaths: WorkPaths;

  constructor(params: NodeModuleParams) {
    this.workPaths = resolveWorkPaths(params);
  }

  public async getCmsConfig(): Promise<CmsConfig> {
    const csmConfigFile = await resolveYamlFile(this.workPaths.configFile);
    if (!csmConfigFile) {
      throw new Error(`Missing CMS config file ${this.workPaths.configFile}`);
    }

    return loadYaml(csmConfigFile!, ZCmsConfigSchema);
  }

  public async loadModules(): Promise<SapphireModuleClass[]> {
    const nodeModulesPath = path.resolve(this.workPaths.root, 'node_modules');
    const manifestFiles = await NodeBootstrapLayer.findSapphireModulesManifestFiles(nodeModulesPath);

    const modulesPromises = manifestFiles.map(async (file) => NodeBootstrapLayer.loadModulesFromManifest(file));
    const allModules = await Promise.all(modulesPromises);

    return allModules.flatMap(arr => arr);
  }

  public async getContentSchemas(): Promise<ContentSchema[]> {
    const files = await fs.readdir(await ensureDirectory(this.workPaths.schemasDir), { recursive: true });

    const schemaFiles = files
        .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
        .map(file => path.join(this.workPaths.schemasDir, file));

    return Promise.all(schemaFiles.map(async (file) => {
      const yaml = await loadYaml(file, ZContentSchema);
      return normalizeContentSchema(yaml);
    }));
  }

  public async getPipelineSchemas(): Promise<PipelineSchema[]> {
    const files = await fs.readdir(await ensureDirectory(this.workPaths.pipelinesDir), { recursive: true });

    const pipelineFiles = files
        .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
        .map(file => path.join(this.workPaths.pipelinesDir, file));

    return Promise.all(pipelineFiles.map(async (file) => {
      const yaml = await loadYaml(file, ZPipelineSchema);
      return normalizePipelineSchema(yaml);
    }));
  }

  public installPackages(packageNames: string[]): Promise<void> {
    const prefixedPackages = packageNames.map(packageName => '@sapphire-cms/' + packageName);

    for (const packageName of prefixedPackages) {
      console.log(chalk.blue('Installing package: ') + chalk.yellow(packageName + '...'));
      // TODO: code the package install
      console.log(chalk.green('Successfully installed package: ') + chalk.yellow(packageName));
    }

    return Promise.resolve();
  }

  private static async findSapphireModulesManifestFiles(nodeModulesPath: string): Promise<string[]> {
    const discoveredManifests: string[] = [];

    const entries = await fs.readdir(nodeModulesPath);

    for (const entry of entries) {
      const fullEntryPath = path.join(nodeModulesPath, entry);

      // Find manifests of official modules
      if (entry === '@sapphire-cms') {
        const scopedPackages = await fs.readdir(fullEntryPath);

        for (const sub of scopedPackages) {
          const manifestPath = await findYamlFile(path.join(fullEntryPath, sub, 'sapphire-cms.manifest'));
          if (manifestPath) {
            discoveredManifests.push(manifestPath);
          }
        }
      }

      // Find manifests of community modules
      if (entry.startsWith('sapphire-cms-')) {
        const manifestPath = await findYamlFile(path.join(fullEntryPath, 'sapphire-cms.manifest'));
        if (manifestPath) {
          discoveredManifests.push(manifestPath);
        }
      }
    }

    return discoveredManifests;
  }

  private static async loadModulesFromManifest(manifestFile: string): Promise<SapphireModuleClass[]> {
    const manifestDir = path.dirname(manifestFile);
    const manifest: Manifest = await loadYaml(manifestFile, ZManifestSchema);

    const loadedModules: SapphireModuleClass[] = [];

    for (const modulePath of manifest.modules) {
      const moduleFile = path.resolve(manifestDir, modulePath);
      const module = (await import(moduleFile)).default as SapphireModuleClass;
      loadedModules.push(module);
    }

    return loadedModules;
  }
}
