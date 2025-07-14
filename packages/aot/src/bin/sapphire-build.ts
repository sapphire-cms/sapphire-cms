import * as process from 'node:process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Command } from '@commander-js/extra-typings';
import {
  BootstrapError,
  BootstrapLayer,
  CmsConfig,
  ContentSchema,
  Layers,
  Manifest,
  ModuleFactory,
  normalizeManifest,
  Option,
  PipelineSchema,
  PlatformAdapter,
  SapphireModuleClass,
  ZCmsConfigSchema,
  ZManifestSchema,
} from '@sapphire-cms/core';
import {
  findSapphireModulesManifestFiles,
  FsError,
  loadModuleFromFile,
  loadYaml,
  ModuleLoadingError,
  resolveYamlFile,
  writeFileSafeDir,
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
    './sapphire-cms.config.yaml',
  )
  .action(async (dir, opts) => {
    const root = path.resolve(process.cwd(), dir);
    const configFilename = path.resolve(root, opts.config);
    const nodeModulesFolder = path.join(root, 'node_modules');

    await program(function* (): Program<
      void,
      FsError | YamlParsingError | ModuleLoadingError | BootstrapError | BundleError
    > {
      const configFilenameOption: Option<string> = yield resolveYamlFile(configFilename);

      if (Option.isNone(configFilenameOption)) {
        return failure(new FsError(`Missing CMS config file ${configFilename}`));
      }

      const csmConfig: CmsConfig = yield loadYaml(configFilenameOption.value, ZCmsConfigSchema);
      const bootstrapLayer = yield createBootstrap(root, csmConfig);

      // Reload CMS config by bootstrap layer (can return different config from the one found in the folder)
      const loadedCmsConfig: CmsConfig = yield bootstrapLayer.getCmsConfig();

      // Remove bootstrap layer to force CMS use StaticBootstrapLayer
      delete loadedCmsConfig.layers.bootstrap;

      // Push resolved modules into template
      const templateModules: Record<string, string> = {};
      const platformAdapters: PlatformAdapter[] = [];

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

          templateModules[`${kebabToCamel(moduleFactory.name)}Module`] = moduleFile;
        }

        for (const platformAdapter of manifest.platformAdapters) {
          platformAdapter.path = path.resolve(manifestDir, platformAdapter.path);
          platformAdapters.push(platformAdapter);
        }
      }

      // Push loaded content schemas into template
      const templateContentSchemas: Record<string, object> = {};
      const contentSchemas: ContentSchema[] = yield bootstrapLayer.getContentSchemas();
      for (const contentSchema of contentSchemas) {
        templateContentSchemas[`${kebabToCamel(contentSchema.name)}ContentSchema`] = contentSchema;
      }

      // Push loaded pipelines into template
      const templatePipelineSchemas: Record<string, object> = {};
      const pipelineSchemas: PipelineSchema[] = yield bootstrapLayer.getPipelineSchemas();
      for (const pipelineSchema of pipelineSchemas) {
        templatePipelineSchemas[`${kebabToCamel(pipelineSchema.name)}PipelineSchema`] =
          pipelineSchema;
      }

      const context: StaticContext = {
        cmsConfig: loadedCmsConfig,
        modules: templateModules,
        contentSchemas: templateContentSchemas,
        pipelineSchemas: templatePipelineSchemas,
      };

      const distDir = (csmConfig.config.modules['aot']?.dist as string) || 'dist';
      const outputDir = path.resolve(root, distDir, 'sapphire-cms');

      // Write tsconfig
      const tsconfigFile = path.join(outputDir, 'tsconfig.json');
      yield writeFileSafeDir(tsconfigFile, JSON.stringify(tsconfig(outputDir)));

      // Write static bootstrap bundle
      const staticBootstrapFile = path.resolve(outputDir, 'static-bootstrap.ts');
      const eta = new Eta({ views: templateDir });
      const rendered = eta.render('static-bootstrap', context);
      yield writeFileSafeDir(staticBootstrapFile, rendered);

      // Bundle adapters
      for (const platformAdapter of platformAdapters) {
        const bundler = new Bundler(
          nodeModulesFolder,
          outputDir,
          platformAdapter.path,
          tsconfigFile,
          platformAdapter.bundle.exclude,
        );
        yield bundler.buildAll();
      }
    }).match(
      () => {},
      (err) => {
        console.error(err);
        process.exit(1);
      },
      (defect) => {
        console.error(defect);
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
};

function createBootstrap(
  root: string,
  csmConfig: CmsConfig,
): Outcome<BootstrapLayer, ModuleLoadingError> {
  const cmsNodeModuleFile = path.join(
    root,
    'node_modules',
    '@sapphire-cms',
    'node',
    'dist',
    'node.module.js',
  );

  return program(function* (): Program<BootstrapLayer, ModuleLoadingError> {
    const cmsNodeModuleClass: SapphireModuleClass = yield loadModuleFromFile(cmsNodeModuleFile);
    const moduleFactory = new ModuleFactory(cmsNodeModuleClass);
    const cmsNodeModule = moduleFactory.instance(csmConfig.config.modules.node);
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
