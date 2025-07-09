import * as process from 'node:process';
import * as path from 'path';
import { Command } from '@commander-js/extra-typings';
import {
  BootstrapError,
  BootstrapLayer,
  CmsConfig,
  ContentSchema,
  Layers,
  Manifest,
  ModuleFactory,
  Option,
  PipelineSchema,
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
import * as packageJson from '../package.json';
import { BundleError, Bundler } from './bundler';
import { CodeGenerator } from './code-generator';
import { kebabToCamel } from './utils';

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
      const manifestFiles: string[] = yield findSapphireModulesManifestFiles(nodeModulesFolder);
      for (const manifestFile of manifestFiles) {
        const manifest: Manifest = yield loadYaml(manifestFile, ZManifestSchema);
        const manifestDir = path.dirname(manifestFile);

        for (const modulePath of manifest.modules || []) {
          const moduleFile = path.resolve(manifestDir, modulePath);
          const moduleClass = yield loadModuleFromFile(moduleFile);
          const moduleFactory = new ModuleFactory(moduleClass);

          if (moduleFactory.name === 'cli') {
            continue; // do not bundle cli module
          }

          templateModules[`${kebabToCamel(moduleFactory.name)}Module`] = moduleFile;
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

      // TODO: readme for aot module
      const outputDir = (csmConfig.config.modules['aot']?.dist as string) || 'dist';
      const aotFile = path.resolve(root, outputDir, 'sapphire-cms', 'index.ts');

      const codeGenerator = new CodeGenerator(aotFile);
      codeGenerator.csmConfig = loadedCmsConfig;
      codeGenerator.modules = templateModules;
      codeGenerator.contentSchemas = templateContentSchemas;
      codeGenerator.pipelineSchemas = templatePipelineSchemas;

      yield codeGenerator.generate();

      const tsconfigFile = path.join(root, outputDir, 'sapphire-cms', 'tsconfig.json');
      yield writeFileSafeDir(tsconfigFile, JSON.stringify(tsconfig(aotFile)));

      const bundler = new Bundler(nodeModulesFolder, outputDir, aotFile, tsconfigFile);
      return bundler.buildAll();
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

function tsconfig(aotFile: string): object {
  return {
    compilerOptions: {
      declaration: false,
      declarationMap: false,
      resolveJsonModule: true,
      moduleResolution: 'node',
      types: ['node'],
    },
    include: [aotFile],
  };
}
