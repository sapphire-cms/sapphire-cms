import * as yaml from 'yaml';
import camelcaseKeys from 'camelcase-keys';
import * as path from 'path';
import {promises as fs} from 'fs';
import {NodeModuleParams} from './node.module';
import {BootstrapLayer, ContentSchema, Module, ZContentSchemaSchema, ZManifestSchema} from '@sapphire-cms/core';
import {findYamlFile} from './fs-utils';
import {loadYaml} from './yaml-utils';

export default class NodeBootstrapLayer implements BootstrapLayer<NodeModuleParams> {
  private readonly schemasDir: string;

  constructor(private readonly params: NodeModuleParams) {
    this.schemasDir = path.join(params.dataRoot, 'schemas');
  }

  public async loadModules(): Promise<Module<any, any>[]> {
    const nodeModulesPath = path.resolve(this.params.root, 'node_modules');
    const manifestFiles = await NodeBootstrapLayer.findSapphireModulesManifestFiles(nodeModulesPath);

    const modulesPromises = manifestFiles.map(async (file) => NodeBootstrapLayer.loadModulesFromManifest(file));
    const allModules = await Promise.all(modulesPromises);

    return allModules.flatMap(arr => arr);
  }

  public async getAllSchemas(): Promise<ContentSchema[]> {
    const files = await fs.readdir(this.schemasDir);

    const schemaFiles = files
        .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
        .map(file => path.join(this.schemasDir, file));

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

  private static async loadModulesFromManifest(manifestFile: string): Promise<Module<any, any>[]> {
    const manifestDir = path.dirname(manifestFile);
    const manifest = await loadYaml(manifestFile, ZManifestSchema);

    const loadedModules: Module<any, any>[] = [];

    for (const modulePath of manifest.modules) {
      const moduleFile = path.resolve(manifestDir, modulePath);
      const module = (await import(moduleFile)).default as Module<any, any>;
      loadedModules.push(module);
    }

    return loadedModules;
  }
}
