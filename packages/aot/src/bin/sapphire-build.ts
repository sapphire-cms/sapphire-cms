import { builtinModules } from 'node:module';
import * as process from 'node:process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Command } from '@commander-js/extra-typings';
import {
  AnyParams,
  BootstrapError,
  BootstrapLayer,
  CmsConfig,
  CmsLoader,
  ContentSchema,
  Id,
  Layers,
  loadCmsConfig,
  Manifest,
  ModuleFactory,
  normalizeManifest,
  Option,
  PipelineSchema,
  PlatformAdapter,
  PlatformError,
  SapphireCms,
  SapphireModuleClass,
  ShaperSchema,
  ZManifestSchema,
} from '@sapphire-cms/core';
import {
  findSapphireModulesManifestFiles,
  FsError,
  loadModuleFromFile,
  loadYaml,
  ModuleLoadingError,
  printError,
  resolveYamlFile,
  writeTextFileSafeDir,
  YamlParsingError,
} from '@sapphire-cms/node';
import { failure, Outcome, program, Program } from 'defectless';
import { Eta } from 'eta';
import { z } from 'zod';
import * as packageJson from '../../package.json';
import { BundleError, Bundler } from './bundler';
import { kebabToCamel } from './utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templateDir = path.join(__dirname, 'templates');

const nodeBuiltins = [...builtinModules, ...builtinModules.map((m) => `node:${m}`)];

const main = new Command()
  .name('sapphire-build')
  .description('Sapphire CMS compiler and bundler.')
  .version(packageJson.version)
  .argument(
    '[dir]',
    'Absolute or relative path to the root directory of CMS project. ' +
      'By default it is the folder of script invocation',
    '.',
  )
  .option(
    '-c, --config <file>',
    'Absolute or relative path (to the root) to the configuration file.',
  )
  .option('-P, --profile <string>', 'Profile')
  .action(async (dir, opts) => {
    const { config, profile } = opts;
    const root = path.resolve(process.cwd(), dir);

    let configFilename: string;
    if (config) {
      configFilename = path.resolve(root, config);
    } else if (profile) {
      configFilename = path.resolve(root, `./sapphire-cms.config.${profile}.yaml`);
    } else {
      configFilename = path.resolve(root, './sapphire-cms.config.yaml');
    }

    const nodeModulesFolder = path.join(root, 'node_modules');

    await program(function* (): Program<
      void,
      FsError | YamlParsingError | ModuleLoadingError | BootstrapError | PlatformError | BundleError
    > {
      const configFilenameOption: Option<string> = yield resolveYamlFile(configFilename);

      if (Option.isNone(configFilenameOption)) {
        return failure(new FsError(`Missing CMS config file ${configFilename}`));
      }

      const systemBootstrap: BootstrapLayer<AnyParams> = yield createBootstrap(
        root,
        configFilenameOption.value,
      );

      // Start CMS and make it resolve used modules
      const cmsLoader = new CmsLoader(systemBootstrap);
      const cms: SapphireCms = yield cmsLoader.loadSapphireCms();

      const cmsConfig: CmsConfig = yield loadCmsConfig(systemBootstrap, undefined, profile);

      // Remove bootstrap layer to force CMS use StaticBootstrapLayer
      delete cmsConfig.layers.bootstrap;

      // Discover installed modules
      const discoveredModules: DiscoveredModule[] = [];
      const platformAdapters = new Map<string, PlatformAdapter>();

      const manifestFiles: string[] = yield findSapphireModulesManifestFiles(nodeModulesFolder);
      for (const manifestFile of manifestFiles) {
        const loaded: z.infer<typeof ZManifestSchema> = yield loadYaml(
          manifestFile,
          ZManifestSchema,
        );
        const manifest: Manifest = normalizeManifest(loaded);
        const manifestDir = path.dirname(manifestFile);

        for (const modulePath of manifest.modules) {
          const moduleFile = path.resolve(manifestDir, modulePath);
          const moduleClass = yield loadModuleFromFile(moduleFile);
          const moduleFactory = new ModuleFactory(moduleClass);

          if (moduleFactory.name === 'cli') {
            continue; // do not bundle cli module
          }

          discoveredModules.push({
            name: moduleFactory.name,
            file: moduleFile,
          });
        }

        for (const platformAdapter of manifest.platformAdapters) {
          platformAdapter.path = path.resolve(manifestDir, platformAdapter.path);
          platformAdapters.set(platformAdapter.name, platformAdapter);
        }
      }

      // Push resolved modules into template
      const templateModules: Record<string, string> = {};
      for (const discoveredModule of discoveredModules) {
        if (cmsLoader.usedModules.has(discoveredModule.name)) {
          templateModules[`${kebabToCamel(discoveredModule.name)}Module`] = discoveredModule.file;
        }
      }

      // Push loaded content schemas into template
      const templateContentSchemas: Record<string, object> = {};
      const contentSchemas: ContentSchema[] = yield cms.bootstrapLayer.getContentSchemas();
      for (const contentSchema of contentSchemas) {
        templateContentSchemas[`${kebabToCamel(contentSchema.name)}ContentSchema`] = contentSchema;
      }

      // Push loaded pipelines into template
      const templatePipelineSchemas: Record<string, object> = {};
      const pipelineSchemas: PipelineSchema[] = yield cms.bootstrapLayer.getPipelineSchemas();
      for (const pipelineSchema of pipelineSchemas) {
        templatePipelineSchemas[`${kebabToCamel(pipelineSchema.name)}PipelineSchema`] =
          pipelineSchema;
      }

      // Push loaded shapers into template
      const templateShaperSchemas: Record<string, object> = {};
      const shaperSchemas: ShaperSchema[] = yield cms.bootstrapLayer.getShaperSchemas();
      for (const shaperSchema of shaperSchemas) {
        templateShaperSchemas[`${kebabToCamel(shaperSchema.name)}ShaperSchema`] = shaperSchema;
      }

      const context: StaticContext = {
        cmsConfig: cmsConfig,
        modules: templateModules,
        contentSchemas: templateContentSchemas,
        pipelineSchemas: templatePipelineSchemas,
        shaperSchemas: templateShaperSchemas,
      };

      const distDir =
        (cmsConfig.config.modules.filter((m) => m.module === 'aot')[0]?.config.dist as string) ||
        'dist';
      const outputDir = path.resolve(root, distDir, 'sapphire-cms');

      // Write tsconfig
      const tsconfigFile = path.join(outputDir, 'tsconfig.json');
      yield writeTextFileSafeDir(tsconfigFile, JSON.stringify(tsconfig(outputDir)));

      // Write static bootstrap bundle
      const staticBootstrapFile = path.resolve(outputDir, 'static-bootstrap.ts');
      const eta = new Eta({ views: templateDir });
      const rendered = eta.render('static-bootstrap', context);
      yield writeTextFileSafeDir(staticBootstrapFile, rendered);

      // Bundle adapters
      for (const adapterName of cms.platformLayer.acceptedAdapters) {
        if (platformAdapters.has(adapterName)) {
          const platformAdapter = platformAdapters.get(adapterName)!;

          const bundler = new Bundler(
            nodeModulesFolder,
            outputDir,
            platformAdapter.path,
            tsconfigFile,
            [...platformAdapter.bundle.exclude, ...nodeBuiltins],
          );
          yield bundler.buildAll();
        }
      }
    }).match(
      () => {},
      (err) => {
        printError(err);
        process.exit(1);
      },
      (defect) => {
        printError(defect);
        process.exit(1);
      },
    );
  });

main.parse();

type StaticContext = {
  cmsConfig: CmsConfig;
  modules: Record<string, string>;
  contentSchemas: Record<string, object>;
  pipelineSchemas: Record<string, object>;
  shaperSchemas: Record<string, object>;
};

type DiscoveredModule = {
  name: Id;
  file: string;
};

function createBootstrap(
  root: string,
  configFilename: string,
): Outcome<BootstrapLayer, ModuleLoadingError> {
  const cmsNodeModuleFile = path.join(
    root,
    'node_modules',
    '@sapphire-cms',
    'node',
    'dist',
    'node.module.js',
  );

  // TODO: import types from node package and type it
  const nodeModuleConfig = {
    root,
    configFile: configFilename,
    dataDir: '.',
    outputDir: '.',
    port: 0,
    ssl: false,
  };

  return program(function* (): Program<BootstrapLayer, ModuleLoadingError> {
    const cmsNodeModuleClass: SapphireModuleClass = yield loadModuleFromFile(cmsNodeModuleFile);
    const moduleFactory = new ModuleFactory(cmsNodeModuleClass);
    const cmsNodeModule = moduleFactory.instance(nodeModuleConfig);
    return cmsNodeModule.getLayer(Layers.BOOTSTRAP) as BootstrapLayer;
  });
}

function tsconfig(outputDir: string): object {
  return {
    compilerOptions: {
      declaration: false,
      declarationMap: false,
      resolveJsonModule: true,
      moduleResolution: 'node',
      types: ['node'],
    },
    include: [`${outputDir}/**/*.ts`],
  };
}
