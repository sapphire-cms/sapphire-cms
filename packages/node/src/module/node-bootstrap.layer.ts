import * as yaml from 'yaml';
import camelcaseKeys from 'camelcase-keys';
import * as path from 'path';
import {promises as fs} from 'fs';
import {NodeModuleParams} from './node.module';
import {
  BootstrapLayer,
  CmsConfig,
  ContentSchema,
  SapphireModuleClass,
  ZCmsConfigSchema,
  ZContentSchemaSchema,
  ZManifestSchema
} from '@sapphire-cms/core';
import {ensureDirectory, findYamlFile, loadYaml, resolveYamlFile} from '../utils';
import chalk from 'chalk';
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

  public async loadModules(): Promise<SapphireModuleClass<any, any>[]> {
    const nodeModulesPath = path.resolve(this.workPaths.root, 'node_modules');
    const manifestFiles = await NodeBootstrapLayer.findSapphireModulesManifestFiles(nodeModulesPath);

    const modulesPromises = manifestFiles.map(async (file) => NodeBootstrapLayer.loadModulesFromManifest(file));
    const allModules = await Promise.all(modulesPromises);

    return allModules.flatMap(arr => arr);
  }

  public async getAllContentSchemas(): Promise<ContentSchema[]> {
    const files = await fs.readdir(await ensureDirectory(this.workPaths.schemasDir));

    const schemaFiles = files
        .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
        .map(file => path.join(this.workPaths.schemasDir, file));

    const schemaPromises = schemaFiles.map(async (file) => {
      // TODO: use loadYaml
      const raw = await fs.readFile(file, 'utf-8');
      const parsed = camelcaseKeys(yaml.parse(raw), { deep: true });

      const result = ZContentSchemaSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error(`Invalid schema in ${file}:\n${JSON.stringify(result.error.format(), null, 2)}`);
      }

      return result.data;
    });

    return Promise.all(schemaPromises);
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

  private static async loadModulesFromManifest(manifestFile: string): Promise<SapphireModuleClass<any, any>[]> {
    const manifestDir = path.dirname(manifestFile);
    const manifest = await loadYaml(manifestFile, ZManifestSchema);

    const loadedModules: SapphireModuleClass<any, any>[] = [];

    for (const modulePath of manifest.modules) {
      const moduleFile = path.resolve(manifestDir, modulePath);
      const module = (await import(moduleFile)).default as SapphireModuleClass<any, any>;
      loadedModules.push(module);
    }

    return loadedModules;
  }
}
